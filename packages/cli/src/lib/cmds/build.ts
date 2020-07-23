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
  TwaManifest, JarSigner, SigningKeyInfo, Result} from '@bubblewrap/core';
import * as path from 'path';
import * as fs from 'fs';
import {enUS as messages} from '../strings';
import {Prompt, InquirerPrompt} from '../Prompt';
import {PwaValidator, PwaValidationResult} from '@bubblewrap/validator';
import {printValidationResult} from '../pwaValidationHelper';
import {ParsedArgs} from 'minimist';
import {createValidateString} from '../inputHelpers';

interface SigningKeyPasswords {
  keystorePassword: string;
  keyPassword: string;
}

class Build {
  private jdkHelper: JdkHelper;
  private androidSdkTools: AndroidSdkTools;
  private keyTool: KeyTool;
  private gradleWrapper: GradleWrapper;
  private jarSigner: JarSigner;

  constructor(private config: Config, private args: ParsedArgs,
      private log = new Log('build'), private prompt: Prompt = new InquirerPrompt()) {
    this.jdkHelper = new JdkHelper(process, this.config);
    this.androidSdkTools = new AndroidSdkTools(process, this.config, this.jdkHelper, this.log);
    this.keyTool = new KeyTool(this.jdkHelper, this.log);
    this.gradleWrapper = new GradleWrapper(process, this.androidSdkTools);
    this.jarSigner = new JarSigner(this.jdkHelper);
  }

  /**
   * Checks if the keystore password and the key password are part of the environment prompts the
   * user for a password otherwise.
   *
   * @returns {Promise<SigningKeyPasswords} the password information collected from enviromental
   * variables or user input.
   */
  async getPasswords(): Promise<SigningKeyPasswords> {
    // Check if passwords are set as environment variables.
    const envKeystorePass = process.env['BUBBLEWRAP_KEYSTORE_PASSWORD'];
    const envKeyPass = process.env['BUBBLEWRAP_KEY_PASSWORD'];

    if (envKeyPass !== undefined && envKeystorePass !== undefined) {
      this.log.info('Using passwords set in the BUBBLEWRAP_KEYSTORE_PASSWORD and ' +
          'BUBBLEWRAP_KEY_PASSWORD environmental variables.');
      return {
        keystorePassword: envKeystorePass,
        keyPassword: envKeyPass,
      };
    }

    // Ask user for the keystore password
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
      const manifestFile = path.join(process.cwd(), 'twa-manifest.json');
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
      const digitalAssetLinksFile = './assetlinks.json';
      const keyInfo = await this.keyTool.keyInfo({
        path: twaManifest.signingKey.path,
        alias: twaManifest.signingKey.alias,
        keypassword: passwords.keyPassword,
        password: passwords.keystorePassword,
      });

      const sha256Fingerprint = keyInfo.fingerprints.get('SHA256');
      if (!sha256Fingerprint) {
        this.log.warn('Could not find SHA256 fingerprint. Skipping generating "assetlinks.json"');
        return;
      }

      const digitalAssetLinks =
        DigitalAssetLinks.generateAssetLinks(twaManifest.packageId, sha256Fingerprint);

      await fs.promises.writeFile(digitalAssetLinksFile, digitalAssetLinks);

      this.log.info(`Digital Asset Links file generated at ${digitalAssetLinksFile}`);
      this.log.info('Read more about setting up Digital Asset Links at https://developers.google.com' +
          '/web/android/trusted-web-activity/quick-start#creating-your-asset-link-file');
    } catch (e) {
      this.log.warn('Error generating "assetlinks.json"', e);
    }
  }

  async buildApk(signingKey: SigningKeyInfo, passwords: SigningKeyPasswords): Promise<void> {
    await this.gradleWrapper.assembleRelease();
    await this.androidSdkTools.zipalign(
        './app/build/outputs/apk/release/app-release-unsigned.apk', // input file
        './app-release-unsigned-aligned.apk', // output file
    );
    const outputFile = './app-release-signed.apk';
    await this.androidSdkTools.apksigner(
        signingKey.path,
        passwords.keystorePassword, // keystore password
        signingKey.alias, // alias
        passwords.keyPassword, // key password
        './app-release-unsigned-aligned.apk', // input file path
        outputFile, // output file path
    );
    this.log.info(`Generated Android APK at "${outputFile}"`);
  }

  async buildAppBundle(signingKey: SigningKeyInfo, passwords: SigningKeyPasswords): Promise<void> {
    await this.gradleWrapper.bundleRelease();
    const inputFile = 'app/build/outputs/bundle/release/app-release.aab';
    const outputFile = './app-release-bundle.aab';
    await this.jarSigner.sign(
        signingKey, passwords.keystorePassword, passwords.keyPassword, inputFile, outputFile);
    this.log.info(`Generated Android App Bundle at "${outputFile}"`);
  }

  async build(): Promise<boolean> {
    if (!await this.androidSdkTools.checkBuildTools()) {
      console.log('Installing Android Build Tools. Please, read and accept the license agreement');
      await this.androidSdkTools.installBuildTools();
    }

    let validationPromise;
    if (!this.args.skipPwaValidation) {
      validationPromise = this.runValidation();
    }

    const twaManifest = await TwaManifest.fromFile('./twa-manifest.json');
    const passwords = await this.getPasswords();

    // Builds the Android Studio Project
    this.log.info('Building the Android App...');
    await this.buildApk(twaManifest.signingKey, passwords);

    if (this.args.generateAppBundle) {
      await this.buildAppBundle(twaManifest.signingKey, passwords);
    }

    await this.generateAssetLinks(twaManifest, passwords);

    if (validationPromise) {
      const result = await validationPromise;
      if (result.isOk()) {
        const pwaValidationResult = result.unwrap();
        printValidationResult(pwaValidationResult, this.log);

        if (pwaValidationResult.status === 'FAIL') {
          this.log.warn('PWA Quality Criteria check failed.');
        }
      } else {
        const e = result.unwrapError();
        const message = 'Failed to run the PWA Quality Criteria checks. Skipping.';
        this.log.debug(e.message);
        this.log.warn(message);
      }
    }
    return true;
  }
}

export async function build(config: Config, args: ParsedArgs,
    log = new Log('build'), prompt: Prompt = new InquirerPrompt()): Promise<boolean> {
  const build = new Build(config, args, log, prompt);
  return build.build();
}
