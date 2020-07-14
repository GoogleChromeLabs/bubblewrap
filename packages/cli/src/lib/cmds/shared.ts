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

import {Prompt} from '../Prompt';
import {enUS as messages} from '../strings';
import {Presets, Bar} from 'cli-progress';
import {TwaGenerator, TwaManifest} from '@bubblewrap/core';
import {green} from 'colors';

/**
 * Wraps generating a project with a progress bar.
 */
export async function generateTwaProject(prompt: Prompt, twaGenerator: TwaGenerator,
    targetDirectory: string, twaManifest: TwaManifest): Promise<void> {
  prompt.printMessage(messages.messageGeneratingAndroidProject);
  const progressBar = new Bar({
    format: ` >> [${green('{bar}')}[0m] {percentage}% | ETA: {eta}s'`,
  }, Presets.shades_classic);
  progressBar.start(100, 0);
  const progress = (current: number, total: number): void => {
    progressBar.update(current / total * 100);
  };
  await twaGenerator.createTwaProject(targetDirectory, twaManifest, progress);
  progressBar.stop();
}
