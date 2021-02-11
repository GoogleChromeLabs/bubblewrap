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
import {Config, Log, ConsoleLog, JdkHelper, AndroidSdkTools} from '@bubblewrap/core';
import {JdkInstaller} from './JdkInstaller';
import {AndroidSdkToolsInstaller} from './AndroidSdkToolsInstaller';
import {existsSync} from 'fs';
import {enUS as messages} from './strings';
import {promises as fsPromises} from 'fs';
import {InquirerPrompt, Prompt} from './Prompt';

const DEFAULT_CONFIG_FOLDER = join(homedir(), '.bubblewrap');
const DEFAULT_CONFIG_NAME = 'config.json';
export const DEFAULT_CONFIG_FILE_PATH = join(DEFAULT_CONFIG_FOLDER, DEFAULT_CONFIG_NAME);
const LEGACY_CONFIG_FOLDER = join(homedir(), '.llama-pack');
const LEGACY_CONFIG_NAME = 'llama-pack-config.json';
const LEGACY_CONFIG_FILE_PATH = join(LEGACY_CONFIG_FOLDER, LEGACY_CONFIG_NAME);
const DEFAULT_JDK_FOLDER = join(DEFAULT_CONFIG_FOLDER, 'jdk');
const DEFAULT_SDK_FOLDER = join(DEFAULT_CONFIG_FOLDER, 'android_sdk');

async function createConfig(prompt: Prompt = new InquirerPrompt()): Promise<Config> {
  const jdkInstallRequest = await prompt.promptConfirm(messages.promptInstallJdk, true);

  let jdkPath;
  if (!jdkInstallRequest) {
    jdkPath = await prompt.promptInput(messages.promptJdkPath, null,
        JdkHelper.validatePath);
  } else {
    await fsPromises.mkdir(DEFAULT_JDK_FOLDER, {recursive: true});
    prompt.printMessage(messages.messageDownloadJdk + DEFAULT_JDK_FOLDER);
    const jdkInstaller = new JdkInstaller(process, prompt);
    jdkPath = await jdkInstaller.install(DEFAULT_JDK_FOLDER);
  }

  const sdkInstallRequest = await prompt.promptConfirm(messages.promptInstallSdk, true);

  let sdkPath;
  if (!sdkInstallRequest) {
    sdkPath = await prompt.promptInput(messages.promptSdkPath, null,
        AndroidSdkTools.validatePath);
  } else {
    const sdkTermsAgreement = await prompt.promptConfirm(messages.promptSdkTerms, false);
    if (sdkTermsAgreement) {
      await fsPromises.mkdir(DEFAULT_SDK_FOLDER, {recursive: true});
      prompt.printMessage(messages.messageDownloadSdk + DEFAULT_SDK_FOLDER);
      const androidSdkToolsInstaller = new AndroidSdkToolsInstaller(process, prompt);
      await androidSdkToolsInstaller.install(DEFAULT_SDK_FOLDER);
      sdkPath = DEFAULT_SDK_FOLDER;
    } else {
      throw new Error(messages.errorSdkTerms);
    }
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

export async function loadOrCreateConfig(
    log: Log = new ConsoleLog('config'),
    prompt: Prompt = new InquirerPrompt(),
    path?: string): Promise<Config> {
  let configPath;
  if (path === undefined) {
    await renameConfigIfNeeded(log);
    configPath = DEFAULT_CONFIG_FILE_PATH;
  } else {
    configPath = path;
  }
  const existingConfig = await Config.loadConfig(configPath);
  if (existingConfig) return existingConfig;

  const config = await createConfig(prompt);
  await config.saveConfig(configPath);
  return config;
}
