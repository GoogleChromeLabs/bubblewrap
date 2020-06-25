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
import {existsSync} from 'fs';
import {promises as fsPromises} from 'fs';

const DEFAULT_CONFIG_FOLDER = join(homedir(), '.bubblewrap-config');
const DEFAULT_CONFIG_NAME = 'bubblewrap-config.json';
const LEGACY_CONFIG_FOLDER = join(homedir(), '.llama-pack');
const LEGACY_CONFIG_NAME = 'llama-pack-config.json';

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

async function renameConfigIfNeeded(): Promise<void> {
  if (existsSync(join(DEFAULT_CONFIG_FOLDER, DEFAULT_CONFIG_NAME))) return;
  // no new named config file found
  if (!existsSync(join(LEGACY_CONFIG_FOLDER, LEGACY_CONFIG_NAME))) return;
  // old named config file found - rename it and its folder
  console.log('An old named config file was found, changing it now');
  const files = await fsPromises.readdir(LEGACY_CONFIG_FOLDER);
  const numOfFiles = files.length;
  if (numOfFiles != 1) {
    // there are other files at the old config folder. we leave it and create a new one
    await fsPromises.mkdir(DEFAULT_CONFIG_FOLDER);
    fsPromises.rename(join(LEGACY_CONFIG_FOLDER, LEGACY_CONFIG_NAME),
        join(DEFAULT_CONFIG_FOLDER, DEFAULT_CONFIG_NAME));
  } else {
    fsPromises.rename(LEGACY_CONFIG_FOLDER, DEFAULT_CONFIG_FOLDER);
    fsPromises.rename(join(DEFAULT_CONFIG_FOLDER, LEGACY_CONFIG_NAME),
        join(DEFAULT_CONFIG_FOLDER, DEFAULT_CONFIG_NAME));
  }
}


export async function loadOrCreateConfig(path =
join(DEFAULT_CONFIG_FOLDER, DEFAULT_CONFIG_NAME)): Promise<Config> {
  await renameConfigIfNeeded();
  const existingConfig = await Config.loadConfig(path);
  if (existingConfig) return existingConfig;

  const config = await createConfig();
  await config.saveConfig(path);
  return config;
}
