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

import {AndroidSdkTools, Config, DigitalAssetLinks, GradleWrapper, JdkHelper, Log, TwaManifest,
  KeyTool} from '@bubblewrap/core';
import * as inquirer from 'inquirer';
import * as path from 'path';
import * as fs from 'fs';
import {validateKeyPassword} from '../inputHelpers';
import {PwaValidator, PwaValidationResult} from '@bubblewrap/validator';
import {printValidationResult} from '../pwaValidationHelper';
import {ParsedArgs} from 'minimist';

interface SigningKeyPasswords {
  keystorePassword: string;
  keyPassword: string;
}

/**
 * Checks if the keystore password and the key password are part of the environment prompts the
 * user for a password otherwise.
 *
 * @returns {Promise<SigningKeyPasswords} the password information collected from enviromental
 * variables or user input.
 */
async function getPasswords(log: Log): Promise<SigningKeyPasswords> {
  // Check if passwords are set as environment variables.
  const envKeystorePass = process.env['BUBBLEWRAP_KEYSTORE_PASSWORD'];
  const envKeyPass = process.env['BUBBLEWRAP_KEY_PASSWORD'];

  if (envKeyPass !== undefined && envKeystorePass !== undefined) {
    log.info('Using passwords set in the BUBBLEWRAP_KEYSTORE_PASSWORD and ' +
        'BUBBLEWRAP_KEY_PASSWORD environmental variables.');
    return {
      keystorePassword: envKeystorePass,
      keyPassword: envKeyPass,
    };
  }

  // Ask user for the keystore password
  const result = await inquirer.prompt([
    {
      name: 'password',
      type: 'password',
      message: 'KeyStore password:',
      validate: validateKeyPassword,
      mask: '*',
    }, {
      name: 'keypassword',
      type: 'password',
      message: 'Key password:',
      validate: validateKeyPassword,
      mask: '*',
    },
  ]);

  return {
    keystorePassword: result.password,
    keyPassword: result.keypassword,
  };
}

async function startValidation(): Promise<PwaValidationResult> {
  const manifestFile = path.join(process.cwd(), 'twa-manifest.json');
  const twaManifest = await TwaManifest.fromFile(manifestFile);
  return PwaValidator.validate(new URL(twaManifest.startUrl, twaManifest.webManifestUrl));
}

export async function build(
    config: Config, args: ParsedArgs, log = new Log('build')): Promise<boolean> {
  let pwaValidationPromise;
  if (!args.skipPwaValidation) {
    pwaValidationPromise = startValidation();
  }

  const jdkHelper = new JdkHelper(process, config);
  const androidSdkTools = new AndroidSdkTools(process, config, jdkHelper, log);
  const keyTool = new KeyTool(jdkHelper, log);

  if (!await androidSdkTools.checkBuildTools()) {
    console.log('Installing Android Build Tools. Please, read and accept the license agreement');
    await androidSdkTools.installBuildTools();
  }

  const twaManifest = await TwaManifest.fromFile('./twa-manifest.json');

  const passwords = await getPasswords(log);

  // Builds the Android Studio Project
  log.info('Building the Android App...');
  const gradleWraper = new GradleWrapper(process, androidSdkTools);
  await gradleWraper.assembleRelease();

  // Zip Align
  log.info('Zip Aligning...');
  await androidSdkTools.zipalign(
      './app/build/outputs/apk/release/app-release-unsigned.apk', // input file
      './app-release-unsigned-aligned.apk', // output file
  );

  if (!args.skipPwaValidation) {
    log.info('Checking PWA Quality Criteria...');
    try {
      const pwaValidationResult = (await pwaValidationPromise)!;
      printValidationResult(pwaValidationResult, log);
      if (pwaValidationResult.status === 'FAIL') {
        log.warn('PWA Quality Criteria check failed.');
      }
    } catch (e) {
      const message = 'Failed to run the PWA Quality Criteria checks. Skipping.';
      log.debug(e);
      log.warn(message);
    }
  }

  // And sign APK
  log.info('Signing...');
  const outputFile = './app-release-signed.apk';
  await androidSdkTools.apksigner(
      twaManifest.signingKey.path,
      passwords.keystorePassword, // keystore password
      twaManifest.signingKey.alias, // alias
      passwords.keyPassword, // key password
      './app-release-unsigned-aligned.apk', // input file path
      outputFile, // output file path
  );

  log.info(`Signed Android App generated at "${outputFile}"`);

  try {
    const digitalAssetLinksFile = './assetlinks.json';
    const keyInfo = await keyTool.keyInfo({
      path: twaManifest.signingKey.path,
      alias: twaManifest.signingKey.alias,
      keypassword: passwords.keyPassword,
      password: passwords.keystorePassword,
    });

    const sha256Fingerprint = keyInfo.fingerprints.get('SHA256');
    if (!sha256Fingerprint) {
      log.warn('Could not find SHA256 fingerprint. Skipping generating "assetlinks.json"');
    } else {
      const digitalAssetLinks =
      DigitalAssetLinks.generateAssetLinks(twaManifest.packageId, sha256Fingerprint);

      await fs.promises.writeFile(digitalAssetLinksFile, digitalAssetLinks);

      log.info(`Digital Asset Links file generated at ${digitalAssetLinksFile}`);
      log.warn('If opting into "App Signing by Google Play" when uploading the Android app for ' +
          'the first time, the SHA-256 fingerprint will differ.');
    }
  } catch (e) {
    log.warn('Error generating "assetlinks.json"', e);
  }
  return true;
}
