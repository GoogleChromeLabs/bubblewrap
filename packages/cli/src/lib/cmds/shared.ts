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
import {Presets, Bar} from 'cli-progress';
import {BufferedLog, ConsoleLog} from '@bubblewrap/core';
import {TwaGenerator, TwaManifest} from '@bubblewrap/core';
import {green} from 'colors';
import {createValidateString} from '../inputHelpers';

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
 * @param {string} currentAppVersionName the current app's version name (optional) .
 * @param {Prompt} prompt prompt instance to get information from the user if needed.
 */
export async function updateVersions(
    twaManifest: TwaManifest, currentAppVersionName: string,
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

export async function generateManifestChecksumFile(manifestFile: string,
    prompt: Prompt): Promise<void> {
  fs.readFile(manifestFile, async function(err, data) {
    if (err) {
      prompt.printMessage(err.toString());
      return;
    }
    const csFile = path.join(process.cwd(), 'manifest-checksum.txt');
    const sum = crypto.createHash('sha1').update(data).digest('hex');
    await fs.promises.writeFile(csFile, sum);
  });
}
