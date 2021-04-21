/*
 * Copyright 2021 Google Inc. All Rights Reserved.
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

import {Config, GradleWrapper, JdkHelper, AndroidSdkTools,ConsoleLog, Log, GooglePlay, TwaManifest} from '@bubblewrap/core';
import { Track } from '@bubblewrap/core/dist/lib/GooglePlay';
import * as fs from 'fs';
import * as path from 'path';
import { ParsedArgs } from 'minimist';
import { TWA_MANIFEST_FILE_NAME } from '../constants';
import {Prompt, InquirerPrompt} from '../Prompt';

class Play {
  constructor(
    private args: ParsedArgs,
    private config: Config,
    private androidSdkTools: AndroidSdkTools,
    private googlePlay: GooglePlay,
  ){}

  async bootstrapPlay(): Promise<void> {
    await this.googlePlay.initPlay();
  }

  async publish(): Promise<void> {
      // Make tmp directory copy file over then clean up.
      //await this.googlePlay.publishBundle(Track.Internal,)
  }

  async run(): Promise<boolean> {
    // Update the TWA-Manifest if service account is supplied
    if (this.args.serviceAccount) {
      // This is probably all garbage and should probably be changed.
      const serviceAccountFile = this.args.serviceAccount;
      const manifestFile = this.args.manifest || path.join(process.cwd(), TWA_MANIFEST_FILE_NAME);
      const twaManifest = await TwaManifest.fromFile(manifestFile);
      twaManifest.serviceAccountJsonFile = serviceAccountFile;
    }
    // Need to validate that the service account file exists in TWA-Manifest
    // and/or on disk. (Thinking about CI/CD scenarios)
    if (this.args.init) {
      await this.bootstrapPlay();
      return true;
    }
    return true;
  }

}

export async function play(config: Config, parsedArgs: ParsedArgs,
    log: Log = new ConsoleLog('play'), prompt: Prompt = new InquirerPrompt()): Promise<boolean> {
  const jdkHelper = new JdkHelper(process, config);
  const androidSdkTools = await AndroidSdkTools.create(process, config, jdkHelper, log);
  const gradleWrapper = new GradleWrapper(process, androidSdkTools);
  const googlePlay = new GooglePlay(gradleWrapper);
  const play = new Play(parsedArgs, config, androidSdkTools, googlePlay);
  play.run();
  return true;
}
