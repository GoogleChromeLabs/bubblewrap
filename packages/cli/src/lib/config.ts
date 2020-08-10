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
import {Config, ConsoleLog, Result} from '@bubblewrap/core';
import {existsSync} from 'fs';
import {promises as fsPromises} from 'fs';
import {InquirerPrompt, Prompt} from './Prompt';

const DEFAULT_CONFIG_FOLDER = join(homedir(), '.bubblewrap');
const DEFAULT_CONFIG_NAME = 'config.json';
const DEFAULT_CONFIG_FILE_PATH = join(DEFAULT_CONFIG_FOLDER, DEFAULT_CONFIG_NAME);
const LEGACY_CONFIG_FOLDER = join(homedir(), '.llama-pack');
const LEGACY_CONFIG_NAME = 'llama-pack-config.json';
const LEGACY_CONFIG_FILE_PATH = join(LEGACY_CONFIG_FOLDER, LEGACY_CONFIG_NAME);

async function validateSdkInput(path: string): Promise<Result<string, Error>> {
  if (!existsSync(path) || !existsSync(join(path, 'build-tools'))) {
    return Result.error(Error('Invalid path. Run \'bubblewrap doctor for more information\''));
  }
  return Result.ok(path);
}

async function validateJdkInput(path: string): Promise<Result<string, Error>> {
  if (!existsSync(path)) {
    return Result.error(Error('Invalid path. Run \'bubblewrap doctor for more information\''));
  } else {
    const file = await fsPromises.readFile(join(path, 'release'), 'utf-8');
    if (!file || (file.indexOf('JAVA_VERSION="1.8') < 0)) {
      return Result.error(Error('Invalid path. Run \'bubblewrap doctor for more information\''));
    }
  }
  return Result.ok(path);
}


async function createConfig(prompt: Prompt = new InquirerPrompt): Promise<Config> {
  // const jdkPath = prompt.promptInput()
  const jdkPath = prompt.promptInput('Path to the JDK:', null, validateJdkInput);
  const androidSdkPath = prompt.promptInput('Path to the SDK:', null, validateSdkInput);
  return new Config(await jdkPath, await androidSdkPath);
}

async function renameConfigIfNeeded(log = new ConsoleLog('config')): Promise<void> {
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


export async function loadOrCreateConfig(prompt: Prompt = new InquirerPrompt,
    path = DEFAULT_CONFIG_FILE_PATH): Promise<Config> {
  console.log(path);
  console.log('');
  await renameConfigIfNeeded();
  const existingConfig = await Config.loadConfig(path);
  if (existingConfig) return existingConfig;

  const config = await createConfig(prompt);
  await config.saveConfig(path);
  return config;
}
