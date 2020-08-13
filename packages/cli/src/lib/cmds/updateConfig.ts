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
import {join} from 'path';
import {homedir} from 'os';
import {existsSync, promises as fsPromises} from 'fs';
import {loadOrCreateConfig} from '../config';

const CONFIG_FILE_PATH = join(join(homedir(), '.bubblewrap-config/bubblewrap-config.json'));

async function updateAndroidSdkPath(path: string, log: Log): Promise<boolean> {
  if (!existsSync(path)) {
    log.error('Please enter a valid path.');
    return false;
  }
  const config = loadOrCreateConfig();
  const jdkPath = (await config).jdkPath;
  const newConfig = new Config(jdkPath, path);
  fsPromises.unlink(CONFIG_FILE_PATH);
  newConfig.saveConfig(CONFIG_FILE_PATH);
  return true;
}

async function updateJdkPath(path: string, log: Log): Promise<boolean> {
  if (!existsSync(path)) {
    log.error('Please enter a valid path.');
    return false;
  }
  const config = await loadOrCreateConfig();
  const androidSdkPath = (await config).androidSdkPath;
  const newConfig = new Config(path, androidSdkPath);
  fsPromises.unlink(CONFIG_FILE_PATH);
  newConfig.saveConfig(CONFIG_FILE_PATH);
  return true;
}

async function invoke(args: ParsedArgs, log: Log): Promise<boolean> {
  if (args.jdkPath) {
    await updateJdkPath(args.JdkPath, log);
  } else if (args.androidSdkPath) {
    await updateAndroidSdkPath(args.androidSdkPath, log);
  } else {
    log.error('usage: bubblewrap updateConfig --jdkPath(or --androidSdkPath)' +
      '\npath/to/location');
    return false;
  }
  return true;
}

export async function updateConfig(args: ParsedArgs, log: Log = new ConsoleLog('updateConfig')):
        Promise<boolean> {
  return await invoke(args, log);
}
