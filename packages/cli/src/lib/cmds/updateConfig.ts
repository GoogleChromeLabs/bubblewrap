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

import {Config, Log} from '@bubblewrap/core';
import {ParsedArgs} from 'minimist';
import {join} from 'path';
import {homedir} from 'os';
import {existsSync} from 'fs';
import {loadOrCreateConfig} from '../config';

const CONFIG_FILE_PATH = join(join(homedir(), '.bubblewrap-config/bubblewrap-config.json'));

async function updatePath(jdkOrSdk: string, path: string, log: Log): Promise<boolean> {
  if (!existsSync(path)) {
    log.error('Please enter a valid path for the ' + jdkOrSdk + '.');
    return false;
  }
  const config = await loadOrCreateConfig();
  if (jdkOrSdk === 'jdk') {
    const jdkPath = config.jdkPath;
    const newConfig = new Config(jdkPath, path);
    await newConfig.saveConfig(CONFIG_FILE_PATH);
  } else {
    const androidSdkPath = config.androidSdkPath;
    const newConfig = new Config(path, androidSdkPath);
    await newConfig.saveConfig(CONFIG_FILE_PATH);
  }
  return true;
}

async function invoke(args: ParsedArgs, log: Log): Promise<boolean> {
  if (args.jdkPath) {
    await updatePath('jdk', args.JdkPath, log);
  }
  if (args.androidSdkPath) {
    await updatePath('androidSdk', args.androidSdkPath, log);
  }
  if (!args.jdkPath && !args.androidSdkPath) {
    log.error('usage: bubblewrap updateConfig --jdkPath(or --androidSdkPath) new/path/to/folder');
    return false;
  }
  return true;
}

export async function updateConfig(args: ParsedArgs, log = new Log('updateConfig')):
        Promise<boolean> {
  return await invoke(args, log);
}

