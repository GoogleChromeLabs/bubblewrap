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

import {AndroidSdkTools, Config, JdkHelper, Log, ConsoleLog} from '@bubblewrap/core';
import {ParsedArgs} from 'minimist';

const APK_FILE_PARAM = '--apkFile';
const DEFAULT_APK_FILE = './app-release-signed.apk';

const PARAMETERS_TO_IGNORE = ['--verbose', '-r'];

export async function install(
    args: ParsedArgs, config: Config, log: Log = new ConsoleLog('install')): Promise<boolean> {
  const jdkHelper = new JdkHelper(process, config);
  const androidSdkTools = await AndroidSdkTools.create(process, config, jdkHelper, log);
  const apkFile = args.apkFile || DEFAULT_APK_FILE;
  if (args.verbose) {
    log.setVerbose(true);
  }

  // parameter 0 would be the path to 'node', followed by `bubblewrap.js` at 1, then `install` at
  // 2. So, we want to start collecting args from parameter 3 and ignore any a possible
  // `--apkFile`, which is specific to install. Extra parameters are passed through to `adb`.
  const originalArgs = process.argv.slice(3).filter(
      (v) => !v.startsWith(APK_FILE_PARAM) && PARAMETERS_TO_IGNORE.indexOf(v) < 0);
  await androidSdkTools.install(apkFile, originalArgs);
  return true;
}
