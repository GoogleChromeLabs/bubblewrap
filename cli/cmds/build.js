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

const {androidSdkTools} = require('../../lib/androidSdk');
const GradleWraper = require('../../lib/GradleWrapper');

const {promisify} = require('util');
const prompt = require('prompt');
const colors = require('colors/safe');
prompt.get = promisify(prompt.get);

async function build() {
  if (!await androidSdkTools.checkBuildTools()) {
    console.log('Installing Android Build Tools. Please, read and accept the license agreement');
    await androidSdkTools.installBuildTools();
  }

  prompt.message = colors.green('[llama-pack-build]');
  prompt.delimiter = ' ';
  prompt.start();

  // Ask user for the keystore password
  const result = await prompt.get({
    name: 'password',
    required: true,
    description: 'Password for the Key Store',
    hidden: true,
    replace: '*',
  });

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
      './android.keystore', // the path to the keystore file
      result.password, // keystore password
      'android', // alias
      result.password, // key password
      './app-release-unsigned-aligned.apk', // input file path
      './app-release-signed.apk', // output file path
      outputFile,
  );

  console.log(`Signed Android App generated at "${outputFile}"`);
}

module.exports = build;
