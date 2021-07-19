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

import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import {InquirerPrompt, Prompt} from '../Prompt';
import {enUS as messages} from '../strings';
import {APP_NAME} from '../constants';
import {Presets, Bar} from 'cli-progress';
import {BufferedLog, ConsoleLog} from '@bubblewrap/core';
import {TwaGenerator, TwaManifest} from '@bubblewrap/core';
import {green} from 'colors';
import {createValidateString, validateImageUrl} from '../inputHelpers';

/**
 * Wraps generating a project with a progress bar.
 */
export async function generateTwaProject(prompt: Prompt, twaGenerator: TwaGenerator,
    targetDirectory: string, twaManifest: TwaManifest): Promise<void> {
  prompt.printMessage(messages.messageGeneratingAndroidProject);
  const progressBar = new Bar({
    format: ` >> [${green('{bar}')}] {percentage}%`,
  }, Presets.shades_classic);
  progressBar.start(100, 0);
  const progress = (current: number, total: number): void => {
    progressBar.update(current / total * 100);
  };
  const log = new BufferedLog(new ConsoleLog('Generating TWA'));
  await twaGenerator.createTwaProject(targetDirectory, twaManifest, log, progress);
  progressBar.stop();
  log.flush();
}

/**
 * Compute the new app version.
 * @param {TwaManifest} oldTwaManifest current Twa Manifest.
 * @param {string | null} currentAppVersionName the current app's version name (or null) .
 * @param {Prompt} prompt prompt instance to get information from the user if needed.
 */
export async function updateVersions(
    twaManifest: TwaManifest, currentAppVersionName: string | null,
    prompt: Prompt = new InquirerPrompt()): Promise<{
    appVersionName: string;
    appVersionCode: number;
  }> {
  const previousAppVersionCode = twaManifest.appVersionCode;
  const appVersionCode = twaManifest.appVersionCode + 1;

  // If a version was passed as parameter, use it.
  if (currentAppVersionName) {
    return {
      appVersionCode: appVersionCode,
      appVersionName: currentAppVersionName,
    };
  }

  // Otherwise, try to upgrade automatically with the versionCode.
  if (twaManifest.appVersionName === previousAppVersionCode.toString()) {
    return {
      appVersionCode: appVersionCode,
      appVersionName: appVersionCode.toString(),
    };
  }

  // If not not possible, ask the user to input a new version.
  const appVersionName = await prompt.promptInput(
      messages.promptNewAppVersionName,
      null,
      createValidateString(1),
  );

  return {
    appVersionCode: appVersionCode,
    appVersionName: appVersionName,
  };
}

export function computeChecksum(data: Buffer): string {
  return crypto.createHash('sha1').update(data).digest('hex');
}

export async function generateManifestChecksumFile(manifestFile: string,
    targetDirectory: string): Promise<void> {
  const manifestContents = await fs.promises.readFile(manifestFile);
  const checksumFile = path.join(targetDirectory, 'manifest-checksum.txt');
  const sum = computeChecksum(manifestContents);
  await fs.promises.writeFile(checksumFile, sum);
}

/**
 * Update the TWA project.
 * @param skipVersionUpgrade {boolean} Skips upgrading appVersionCode and appVersionName if set to true.
 * @param appVersionName {string | null} Value to be used for appVersionName when upgrading
 * versions. Ignored if `args.skipVersionUpgrade` is set to true. If null, a default is used or user will be prompted for one.
 * @param prompt {Prompt} Prompt instance to get information from the user if necessary.
 * @param directory {string} TWA project directory.
 * @param manifest {string} Path to twa-manifest.json file.
 */
export async function updateProject(
    skipVersionUpgrade: boolean,
    appVersionName: string | null,
    prompt: Prompt = new InquirerPrompt(),
    directory: string,
    manifest: string): Promise<boolean> {
  const targetDirectory = directory || process.cwd();
  const manifestFile = manifest || path.join(process.cwd(), 'twa-manifest.json');
  const twaManifest = await TwaManifest.fromFile(manifestFile);
  twaManifest.generatorApp = APP_NAME;

  const features = twaManifest.features;

  // Check that if Play Billing is enabled, enableNotifications must also be true.
  if (features.playBilling?.enabled && !twaManifest.enableNotifications) {
    prompt.printMessage(messages.errorPlayBillingEnableNotifications);
    return false;
  }
  // Check that if Play Billing is enabled, alphaDependencies must also be enabled.
  if (features.playBilling?.enabled && !twaManifest.alphaDependencies.enabled) {
    prompt.printMessage(messages.errorPlayBillingAlphaDependencies);
    return false;
  }

  // Check that the iconUrl exists.
  if (!twaManifest.iconUrl) {
    throw new Error(messages.errorIconUrlMustExist(manifestFile));
  }

  // Check that the iconUrl is valid.
  if (twaManifest.iconUrl) {
    const result = await validateImageUrl(twaManifest.iconUrl);
    if (result.isError()) {
      throw result.unwrapError();
    }
  }

  if (!skipVersionUpgrade) {
    const newVersionInfo = await updateVersions(twaManifest, appVersionName, prompt);
    twaManifest.appVersionName = newVersionInfo.appVersionName;
    twaManifest.appVersionCode = newVersionInfo.appVersionCode;
    prompt.printMessage(messages.messageUpgradedAppVersion(
        newVersionInfo.appVersionName, newVersionInfo.appVersionCode));
  }

  const twaGenerator = new TwaGenerator();
  await twaGenerator.removeTwaProject(targetDirectory);
  await generateTwaProject(prompt, twaGenerator, targetDirectory, twaManifest);
  if (!skipVersionUpgrade) {
    await twaManifest.saveToFile(manifestFile);
  }
  await generateManifestChecksumFile(manifestFile, targetDirectory);
  prompt.printMessage(messages.messageProjectUpdatedSuccess);
  return true;
}
