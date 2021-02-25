/*
 * Copyright 2019 Google Inc. All Rights Reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import {AndroidSdkTools, Config, DigitalAssetLinks, GradleWrapper, JdkHelper, KeyTool, Log,
  ConsoleLog, TwaManifest, JarSigner, SigningKeyInfo, Result} from '@bubblewrap/core';
import * as path from 'path';
import * as fs from 'fs';
import {enUS as messages} from '../strings';
import {Prompt, InquirerPrompt} from '../Prompt';
import {PwaValidator, PwaValidationResult} from '@bubblewrap/validator';
import {printValidationResult} from '../pwaValidationHelper';
import {ParsedArgs} from 'minimist';
import {createValidateString} from '../inputHelpers';

// Path to the file generated when building an app bundle file using gradle.
const APP_BUNDLE_BUILD_OUTPUT_FILE_NAME = './app/build/outputs/bundle/release/app-release.aab';
const APP_BUNDLE_SIGNED_FILE_NAME = './app-release-bundle.aab'; // Final signed App Bundle file.

// Path to the file generated when building an APK file using gradle.
const APK_BUILD_OUTPUT_FILE_NAME = './app/build/outputs/apk/release/app-release-unsigned.apk';

// Final aligned and signed APK.
const APK_SIGNED_FILE_NAME = './app-release-signed.apk';

// Output file for zipalign.
const APK_ALIGNED_FILE_NAME = './app-release-unsigned-aligned.apk';

const TWA_MANIFEST_FILE_NAME = './twa-manifest.json';
const ASSETLINKS_OUTPUT_FILE = './assetlinks.json';

interface SigningKeyPasswords {
  keystorePassword: string;
  keyPassword: string;
}

class Build {
  constructor(
      private args: ParsedArgs,
      private androidSdkTools: AndroidSdkTools,
      private keyTool: KeyTool,
      private gradleWrapper: GradleWrapper,
      private jarSigner: JarSigner,
      private log: Log = new ConsoleLog('build'),
      private prompt: Prompt = new InquirerPrompt()) {
  }

  /**
   * Checks if the keystore password and the key password are part of the environment prompts the
   * user for a password otherwise.
   *
   * @returns {Promise<SigningKeyPasswords} the password information collected from enviromental
   * variables or user input.
   */
  async getPasswords(signingKeyInfo: SigningKeyInfo): Promise<SigningKeyPasswords> {
    // Check if passwords are set as environment variables.
    const envKeystorePass = process.env['BUBBLEWRAP_KEYSTORE_PASSWORD'];
    const envKeyPass = process.env['BUBBLEWRAP_KEY_PASSWORD'];

    if (envKeyPass !== undefined && envKeystorePass !== undefined) {
      this.prompt.printMessage(messages.messageUsingPasswordsFromEnv);
      return {
        keystorePassword: envKeystorePass,
        keyPassword: envKeyPass,
      };
    }

    // Ask user for the keystore password
    this.prompt.printMessage(
        messages.messageEnterPasswords(signingKeyInfo.path, signingKeyInfo.alias));
    const keystorePassword =
        await this.prompt.promptPassword(messages.promptKeystorePassword, createValidateString(6));
    const keyPassword =
      await this.prompt.promptPassword(messages.promptKeyPassword, createValidateString(6));

    return {
      keystorePassword: keystorePassword,
      keyPassword: keyPassword,
    };
  }

  async runValidation(): Promise<Result<PwaValidationResult, Error>> {
    try {
      const manifestFile = this.args.manifest || path.join(process.cwd(), TWA_MANIFEST_FILE_NAME);
      const twaManifest = await TwaManifest.fromFile(manifestFile);
      const pwaValidationResult =
          await PwaValidator.validate(new URL(twaManifest.startUrl, twaManifest.webManifestUrl));
      return Result.ok(pwaValidationResult);
    } catch (e) {
      return Result.error(e);
    }
  }

  async generateAssetLinks(
      twaManifest: TwaManifest, passwords: SigningKeyPasswords): Promise<void> {
    try {
      const digitalAssetLinksFile = ASSETLINKS_OUTPUT_FILE;
      const keyInfo = await this.keyTool.keyInfo({
        path: twaManifest.signingKey.path,
        alias: twaManifest.signingKey.alias,
        keypassword: passwords.keyPassword,
        password: passwords.keystorePassword,
      });

      const sha256Fingerprint = keyInfo.fingerprints.get('SHA256');
      if (!sha256Fingerprint) {
        this.prompt.printMessage(messages.messageSha256FingerprintNotFound);
        return;
      }

      const digitalAssetLinks =
        DigitalAssetLinks.generateAssetLinks(twaManifest.packageId, sha256Fingerprint);

      await fs.promises.writeFile(digitalAssetLinksFile, digitalAssetLinks);

      this.prompt.printMessage(messages.messageDigitalAssetLinksSuccess(digitalAssetLinksFile));
    } catch (e) {
      this.prompt.printMessage(messages.errorAssetLinksGeneration);
    }
  }

  async buildApk(): Promise<void> {
    await this.gradleWrapper.assembleRelease();
    await this.androidSdkTools.zipalign(
        APK_BUILD_OUTPUT_FILE_NAME, // input file
        APK_ALIGNED_FILE_NAME, // output file
    );
  }

  async signApk(signingKey: SigningKeyInfo, passwords: SigningKeyPasswords): Promise<void> {
    await this.androidSdkTools.apksigner(
        signingKey.path,
        passwords.keystorePassword,
        signingKey.alias,
        passwords.keyPassword,
        APK_ALIGNED_FILE_NAME, // input file path
        APK_SIGNED_FILE_NAME,
    );
  }

  async buildAppBundle(): Promise<void> {
    await this.gradleWrapper.bundleRelease();
  }

  async signAppBundle(signingKey: SigningKeyInfo, passwords: SigningKeyPasswords): Promise<void> {
    await this.jarSigner.sign(signingKey, passwords.keystorePassword, passwords.keyPassword,
        APP_BUNDLE_BUILD_OUTPUT_FILE_NAME, APP_BUNDLE_SIGNED_FILE_NAME);
  }

  async build(): Promise<boolean> {
    if (!await this.androidSdkTools.checkBuildTools()) {
      this.prompt.printMessage(messages.messageInstallingBuildTools);
      await this.androidSdkTools.installBuildTools();
    }

    let validationPromise = null;
    if (!this.args.skipPwaValidation) {
      validationPromise = this.runValidation();
    }

    const manifestFile = this.args.manifest || path.join(process.cwd(), TWA_MANIFEST_FILE_NAME);
    const twaManifest = await TwaManifest.fromFile(manifestFile);
    const passwords = await this.getPasswords(twaManifest.signingKey);

    // Builds the Android Studio Project
    this.prompt.printMessage(messages.messageBuildingApp);
    await this.buildApk();
    await this.signApk(twaManifest.signingKey, passwords);
    this.prompt.printMessage(messages.messageApkSucess(APK_SIGNED_FILE_NAME));

    await this.buildAppBundle();
    await this.signAppBundle(twaManifest.signingKey, passwords);
    this.prompt.printMessage(messages.messageAppBundleSuccess(APP_BUNDLE_SIGNED_FILE_NAME));

    await this.generateAssetLinks(twaManifest, passwords);

    if (validationPromise !== null) {
      const result = await validationPromise;
      if (result.isOk()) {
        const pwaValidationResult = result.unwrap();
        printValidationResult(pwaValidationResult, this.log);

        if (pwaValidationResult.status === 'FAIL') {
          this.prompt.printMessage(messages.warnPwaFailedQuality);
        }
      } else {
        const e = result.unwrapError();
        this.log.debug(e.message);
        this.prompt.printMessage(messages.errorFailedToRunQualityCriteria);
      }
    }
    return true;
  }
}

export async function build(config: Config, args: ParsedArgs,
    log: Log = new ConsoleLog('build'), prompt: Prompt = new InquirerPrompt()): Promise<boolean> {
  const jdkHelper = new JdkHelper(process, config);
  const androidSdkTools =
      await AndroidSdkTools.create(process, config, jdkHelper, log);
  const keyTool = new KeyTool(jdkHelper, log);
  const gradleWrapper = new GradleWrapper(process, androidSdkTools);
  const jarSigner = new JarSigner(jdkHelper);
  const build = new Build(
      args,
      androidSdkTools,
      keyTool,
      gradleWrapper,
      jarSigner,
      log,
      prompt,
  );
  return build.build();
}
