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


import {join} from 'path';
import {homedir} from 'os';
import {Config} from '@bubblewrap/core';
import * as inquirer from 'inquirer';
import {existsSync, promises} from 'fs';

const DEFAULT_CONFIG_PATH = join(homedir(), '/.bubblewrap-config/bubblewrap-config.json');

async function createConfig(): Promise<Config> {
  const result = await inquirer.prompt([
    {
      name: 'jdkPath',
      message: 'Path to the JDK:',
      validate: existsSync,
    }, {
      name: 'androidSdkPath',
      message: 'Path to the Android SDK:',
      validate: existsSync,
    },
  ]);
  return new Config(result.jdkPath, result.androidSdkPath);
}

export async function loadOrCreateConfig(path = DEFAULT_CONFIG_PATH): Promise<Config> {
  if (!existsSync(path)) {
    // no new named config file found
    if (existsSync(join(homedir(), '/.llama-pack/llama-pack-config.json'))) {
      // old named config file found - rename it and it's folder
      promises.rename((join(homedir(), '/.llama-pack')), (join(homedir(), '/.bubblewrap-config')));
      promises.rename((join(homedir(), '/.bubblewrap-config/llama-pack-config.json')), path);
    }
  }
  const existingConfig = await Config.loadConfig(path);
  if (existingConfig) return existingConfig;

  const config = await createConfig();
  await config.saveConfig(path);
  return config;
}
