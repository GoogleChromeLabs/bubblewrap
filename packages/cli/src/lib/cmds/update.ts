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

import * as path from 'path';
import {Prompt, InquirerPrompt} from '../Prompt';
import {TwaGenerator, TwaManifest} from '@bubblewrap/core';
import {ParsedArgs} from 'minimist';
import {APP_NAME} from '../constants';
import {enUS as messages} from '../strings';
import {updateVersions, generateTwaProject} from './shared';

/**
 * Updates an existing TWA Project using the `twa-manifest.json`.
 * @param {string} [args.manifest] directory where the command should look for the
 * `twa-manifest.json`. Defaults to the current folder.
 * @param {boolean} [args.skipVersionUpgrade] Skips upgrading appVersionCode and appVersionName
 * if set to true.
 * @param {string} [args.appVersionName] Value to be used for appVersionName when upgrading
 * versions. Ignored if `args.skipVersionUpgrade` is set to true.
 */
export async function update(
    args: ParsedArgs, prompt: Prompt = new InquirerPrompt()): Promise<boolean> {
  const targetDirectory = args.directory || process.cwd();
  const manifestFile = args.manifest || path.join(process.cwd(), 'twa-manifest.json');
  const twaManifest = await TwaManifest.fromFile(manifestFile);
  twaManifest.generatorApp = APP_NAME;

  const features = twaManifest.features;
  // Check that if Play Billing is enabled, enableNotifications must also be true
  if (features.playBilling?.enabled && !twaManifest.enableNotifications) {
    prompt.printMessage(messages.errorPlayBillingEnableNotifications);
    return false;
  }
  // Check that if billing is true, alphaDependencies must also be enabled
  if (features.playBilling?.enabled && !twaManifest.alphaDependencies.enabled) {
    prompt.printMessage(messages.errorPlayBillingAlphaDependencies);
    return false;
  }

  if (!args.skipVersionUpgrade) {
    const newVersionInfo = await updateVersions(twaManifest, args.appVersionName, prompt);
    twaManifest.appVersionName = newVersionInfo.appVersionName;
    twaManifest.appVersionCode = newVersionInfo.appVersionCode;
    prompt.printMessage(messages.messageUpgradedAppVersion(
        newVersionInfo.appVersionName, newVersionInfo.appVersionCode));
  }

  const twaGenerator = new TwaGenerator();
  await twaGenerator.removeTwaProject(targetDirectory);
  await generateTwaProject(prompt, twaGenerator, targetDirectory, twaManifest);
  if (!args.skipVersionUpgrade) {
    twaManifest.saveToFile(manifestFile);
  }
  prompt.printMessage(messages.messageProjectUpdatedSuccess);
  return true;
}
