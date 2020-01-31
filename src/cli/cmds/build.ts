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

import {AndroidSdkTools} from '../../lib/androidSdk/AndroidSdkTools';
import {JdkHelper} from '../../lib/jdk/JdkHelper';
import {GradleWrapper} from '../../lib/GradleWrapper';
import {TwaManifest} from '../../lib/TwaManifest';
import {Config} from '../../lib/Config';
import Log from '../../lib/Log';
import * as inquirer from 'inquirer';
import {validatePassword} from '../inputHelpers';

/**
 * Checks if the keystore password and the key password are part of the environment prompts the
 * user for a password otherwise.
 *
 * @returns {Promise<[string, string]>} A promise with a tuple where the first item is they
 * keystore password and the second is the key password.
 */
async function getPasswords(): Promise<[string, string]> {
  // Check if passwords are set as environment variables.
  const envKeystorePass = process.env['LLAMA_PACK_KEYSTORE_PASSWORD'];
  const envKeyPass = process.env['LLAMA_PACK_KEY_PASSWORD'];

  if (envKeyPass !== undefined && envKeystorePass !== undefined) {
    return [envKeystorePass, envKeyPass];
  }

  // Ask user for the keystore password
  const result = await inquirer.prompt([
    {
      name: 'password',
      type: 'password',
      message: 'KeyStore password:',
      validate: validatePassword,
      mask: '*',
    }, {
      name: 'keypassword',
      type: 'password',
      message: 'Key password:',
      validate: validatePassword,
      mask: '*',
    },
  ]);

  return [result.password, result.keypassword];
}

export async function build(config: Config, log = new Log('build')): Promise<void> {
  const jdkHelper = new JdkHelper(process, config);
  const androidSdkTools = new AndroidSdkTools(process, config, jdkHelper);

  if (!await androidSdkTools.checkBuildTools()) {
    console.log('Installing Android Build Tools. Please, read and accept the license agreement');
    await androidSdkTools.installBuildTools();
  }

  const twaManifest = await TwaManifest.fromFile('./twa-manifest.json');

  const passwords = await getPasswords();

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

  // And sign APK
  log.info('Signing...');
  const outputFile = './app-release-signed.apk';
  await androidSdkTools.apksigner(
      twaManifest.signingKey.path,
      passwords[0], // keystore password
      twaManifest.signingKey.alias, // alias
      passwords[1], // key password
      './app-release-unsigned-aligned.apk', // input file path
      outputFile, // output file path
  );

  log.info(`Signed Android App generated at "${outputFile}"`);
}
