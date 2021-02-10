/*
 * Copyright 2020 Google Inc. All Rights Reserved.
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

import {Config, Log, ConsoleLog} from '@bubblewrap/core';
import {ParsedArgs} from 'minimist';
import {existsSync} from 'fs';
import {loadOrCreateConfig} from '../config';
import {DEFAULT_CONFIG_FILE_PATH} from '../config';
import {enUS as messages} from '../strings';

async function updateAndroidSdkPath(path: string, log: Log): Promise<boolean> {
  if (!existsSync(path)) {
    log.error('Please enter a valid path.');
    return false;
  }
  const config = await loadOrCreateConfig();
  const jdkPath = config.jdkPath;
  const newConfig = new Config(jdkPath, path);
  await newConfig.saveConfig(DEFAULT_CONFIG_FILE_PATH);
  return true;
}

async function updateJdkPath(path: string, log: Log): Promise<boolean> {
  if (!existsSync(path)) {
    log.error('Please enter a valid path.');
    return false;
  }
  const config = await loadOrCreateConfig();
  const androidSdkPath = config.androidSdkPath;
  const newConfig = new Config(path, androidSdkPath);
  await newConfig.saveConfig(DEFAULT_CONFIG_FILE_PATH);
  return true;
}

export async function updateConfig(args: ParsedArgs, log: Log = new ConsoleLog('updateConfig')):
        Promise<boolean> {
  if (args.jdkPath) {
    await updateJdkPath(args.jdkPath, log);
  }
  if (args.androidSdkPath) {
    await updateAndroidSdkPath(args.androidSdkPath, log);
  }
  if (!args.jdkPath && !args.androidSdkPath) {
    log.error(messages.updateConfigUsage);
    return false;
  }
  return true;
}
