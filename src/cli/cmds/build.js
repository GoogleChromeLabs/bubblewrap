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

'use strict';

const AndroidSdkTools = require('../../lib/androidSdk/AndroidSdkTools');
const JdkHelper = require('../../lib/jdk/JdkHelper');
const GradleWraper = require('../../lib/GradleWrapper');
const TwaManifest = require('../../lib/TwaManifest');

const {promisify} = require('util');
const prompt = require('prompt');
const colors = require('colors/safe');
prompt.get = promisify(prompt.get);

async function build(_, config) {
  const jdkHelper = new JdkHelper(process, config);
  const androidSdkTools = new AndroidSdkTools(process, config, jdkHelper);

  if (!await androidSdkTools.checkBuildTools()) {
    console.log('Installing Android Build Tools. Please, read and accept the license agreement');
    await androidSdkTools.installBuildTools();
  }

  const twaManifest = await TwaManifest.fromFile('./twa-manifest.json');
  prompt.message = colors.green('[llama-pack-build]');
  prompt.delimiter = ' ';
  prompt.start();

  const schema = {
    properties: {
      password: {
        name: 'password',
        required: true,
        description: 'KeyStore password:',
        hidden: true,
        replace: '*',
      },
      keypassword: {
        name: 'keypassword',
        required: true,
        description: 'Key password:',
        hidden: true,
        replace: '*',
      },
    },
  };

  // Ask user for the keystore password
  const result = await prompt.get(schema);

  // Builds the Android Studio Project
  console.log('Building the Android App...');
  const gradleWraper = new GradleWraper(process, androidSdkTools);
  await gradleWraper.assembleRelease();

  // Zip Align
  console.log('Zip Aligning...');
  await androidSdkTools.zipalign(
      './app/build/outputs/apk/release/app-release-unsigned.apk', // input file
      './app-release-unsigned-aligned.apk', // output file
  );

  // And sign APK
  console.log('Signing...');
  const outputFile = './app-release-signed.apk';
  await androidSdkTools.apksigner(
      twaManifest.signingKey.path,
      result.password, // keystore password
      twaManifest.signingKey.alias, // alias
      result.keypassword, // key password
      './app-release-unsigned-aligned.apk', // input file path
      './app-release-signed.apk', // output file path
      outputFile,
  );

  console.log(`Signed Android App generated at "${outputFile}"`);
}

module.exports = build;
