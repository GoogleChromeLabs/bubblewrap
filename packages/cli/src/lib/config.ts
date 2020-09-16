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
import {Config, Log, ConsoleLog, JdkInstaller, AndroidSdkToolsInstaller} from '@bubblewrap/core';
import * as inquirer from 'inquirer';
import {existsSync} from 'fs';
import {promises as fsPromises} from 'fs';

const DEFAULT_CONFIG_FOLDER = join(homedir(), '.bubblewrap');
const DEFAULT_CONFIG_NAME = 'config.json';
export const DEFAULT_CONFIG_FILE_PATH = join(DEFAULT_CONFIG_FOLDER, DEFAULT_CONFIG_NAME);
const LEGACY_CONFIG_FOLDER = join(homedir(), '.llama-pack');
const LEGACY_CONFIG_NAME = 'llama-pack-config.json';
const LEGACY_CONFIG_FILE_PATH = join(LEGACY_CONFIG_FOLDER, LEGACY_CONFIG_NAME);
const DEFAULT_JDK_FOLDER = join(DEFAULT_CONFIG_FOLDER, 'jdk');
const DEFAULT_SDK_FOLDER = join(DEFAULT_CONFIG_FOLDER, 'android_sdk');

async function createConfig(): Promise<Config> {
  const installJdk = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'request',
      message: 'Do you want Bubblewrap to install JDK? ("No" to use your JDK installation)',
      default: true,
    },
  ]);

  let jdkPath;
  if (!installJdk.request) {
    const jdk = await inquirer.prompt([
      {
        name: 'path',
        message: 'Path to your existing JDK:',
        validate: existsSync,
      },
    ]);
    jdkPath = jdk.path;
  } else {
    await fsPromises.mkdir(DEFAULT_JDK_FOLDER);
    console.log(`Downloading JDK 8 to ${DEFAULT_JDK_FOLDER}`);
    const jdkInstaller = new JdkInstaller(process);
    jdkPath = await jdkInstaller.install(DEFAULT_JDK_FOLDER);
  }

  const installSdk = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'request',
      message: 'Do you want Bubblewrap to install Android SDK? ("No" to use your installation)',
      default: true,
    },
  ]);

  let sdkPath;
  if (!installSdk.request) {
    const androidSdk = await inquirer.prompt([
      {
        name: 'path',
        message: 'Path to your existing Android SDK:',
        validate: existsSync,
      },
    ]);
    sdkPath = androidSdk.path;
  } else {
    await fsPromises.mkdir(DEFAULT_SDK_FOLDER);
    console.log(`Downloading Android command line tools to ${DEFAULT_SDK_FOLDER}`);
    await AndroidSdkToolsInstaller.install(DEFAULT_SDK_FOLDER);
    sdkPath = DEFAULT_SDK_FOLDER;
  }

  return new Config(jdkPath, sdkPath);
}

async function renameConfigIfNeeded(log: Log): Promise<void> {
  if (existsSync(DEFAULT_CONFIG_FILE_PATH)) return;
  // No new named config file found.
  if (!existsSync(LEGACY_CONFIG_FILE_PATH)) return;
  // Old named config file found - rename it and its folder.
  log.info('An old named config file was found, changing it now');
  const files = await fsPromises.readdir(LEGACY_CONFIG_FOLDER);
  const numOfFiles = files.length;
  if (numOfFiles != 1) {
    // At this point, we know that's at least one file in the folder, `LEGACY_CONFIG_NAME, so
    // `numOfFiles' will be at least `1`. We avoid destroying / moving other files in this folder.
    await fsPromises.mkdir(DEFAULT_CONFIG_FOLDER);
    await fsPromises.rename(LEGACY_CONFIG_FILE_PATH, DEFAULT_CONFIG_FILE_PATH);
  } else {
    await fsPromises.rename(LEGACY_CONFIG_FOLDER, DEFAULT_CONFIG_FOLDER);
    await fsPromises
        .rename(join(DEFAULT_CONFIG_FOLDER, LEGACY_CONFIG_NAME), DEFAULT_CONFIG_FILE_PATH);
  }
}

export async function loadOrCreateConfig(log: Log = new ConsoleLog('config'),
    path = DEFAULT_CONFIG_FILE_PATH): Promise<Config> {
  await renameConfigIfNeeded(log);
  const existingConfig = await Config.loadConfig(path);
  if (existingConfig) return existingConfig;

  const config = await createConfig();
  await config.saveConfig(path);
  return config;
}
