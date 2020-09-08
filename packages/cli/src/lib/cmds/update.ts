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
import {createValidateString} from '../inputHelpers';
import {enUS as messages} from '../strings';
import {generateTwaProject} from './shared';

async function updateVersions(
    twaManifest: TwaManifest, appVersionNameArg: string, prompt: Prompt): Promise<{
      appVersionName: string;
      appVersionCode: number;
    }> {
  const previousAppVersionCode = twaManifest.appVersionCode;
  const appVersionCode = twaManifest.appVersionCode + 1;

  // If a version was passed as parameter, use it.
  if (appVersionNameArg) {
    return {
      appVersionCode: appVersionCode,
      appVersionName: appVersionNameArg,
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

  if (!args.skipVersionUpgrade) {
    const newVersionInfo = await updateVersions(twaManifest, args.appVersionName, prompt);
    twaManifest.appVersionName = newVersionInfo.appVersionName;
    twaManifest.appVersionCode = newVersionInfo.appVersionCode;
    prompt.printMessage(messages.messageGeneratedNewVersion(
        newVersionInfo.appVersionName, newVersionInfo.appVersionCode));
    twaManifest.saveToFile(manifestFile);
  }

  const twaGenerator = new TwaGenerator();
  await twaGenerator.removeTwaProject(targetDirectory);
  await generateTwaProject(prompt, twaGenerator, targetDirectory, twaManifest);
  return true;
}
