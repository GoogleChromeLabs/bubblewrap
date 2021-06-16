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

import {
  Config, GradleWrapper, JdkHelper, AndroidSdkTools, ConsoleLog, Log, GooglePlay, TwaManifest,
} from '@bubblewrap/core';
import {Track} from '@bubblewrap/core/dist/lib/GooglePlay';
import * as fs from 'fs';
import * as path from 'path';
import {ParsedArgs} from 'minimist';
import {TWA_MANIFEST_FILE_NAME} from '../constants';
import {Prompt, InquirerPrompt} from '../Prompt';
/**
  * The Play class is the class that is used to communicate with the Google Play Store.
  */
class Play {
  constructor(
    private args: ParsedArgs,
    private config: Config,
    private androidSdkTools: AndroidSdkTools,
    private googlePlay: GooglePlay,
  ) {}

  async bootstrapPlay(): Promise<void> {
    await this.googlePlay.initPlay();
  }

  // VersionOnTrack checks the selected track for the version number currently listed on it.
  private async versionOnTrack(track: string): Promise<number> {
    // Need to get an editId, then list all apks available. This should allow us to query the highest apk number.
    return 0;
  }

  // bubblewrap play --versionCheck can validate the largest version number vs twa-manifest.json and update to give x+1 version number.
  async getLargestVersion(): Promise<void> {

    // TODO(nohe427): This doesn't exist in the Gradle Play Plugin. Might be wortwhile to build
    // small integration to do this by getting the service account file?
  }

  private isInAvailableTracks(userSpecifiedTrack: string): boolean {
    const track: string = userSpecifiedTrack.toLowerCase();
    const selectedTrack: Track = (Track as any)[track];
    if (selectedTrack == (null || undefined)) {
      return false; // Should probably spit out an error message that track needs to be in [x,y,z]
    }
    return true;
  }

  // bubblewrap play --publish="Internal"
  async publish(): Promise<void> {
    // if (this.args.publish) { // This argument should be validated in run()
    // }
    // Validate that the publish value is listed in the available Tracks.
    const userSelectedTrack = this.args.publish.toLowerCase() || 'internal'; // If no value was supplied with publish we make it internal.
    if (!this.isInAvailableTracks(userSelectedTrack)) {
      return; // Throw error message?
    }
    if (this.args.appBundleLocation) {
      // Check this is a directory that contains our specified file name.
    }


    // Make tmp directory copy file over signed APK then cleanup.
    // await this.googlePlay.publishBundle(Track.Internal,)
  }

  private validServiceAccountJsonFile(path: string | undefined): boolean { // Return an error or boolean? Log a message?
    if (path == undefined) {
      // Log an error
      return false;
    }
    if (!fs.existsSync(path)) {
      // path doesn't exist log an error
      return false;
    }
    return true;
  }

  // bubblewrap play --init
  async run(): Promise<boolean> {
    const manifestFile = this.args.manifest || path.join(process.cwd(), TWA_MANIFEST_FILE_NAME);
    const twaManifest = await TwaManifest.fromFile(manifestFile);
    // Update the TWA-Manifest if service account is supplied
    // bubblewrap play --serviceAccountFile="/path/to/service-account.json"  --manifest="/path/twa-manifest.json"
    if (this.args.serviceAccountFile) {
      // Add service account to the TWA-Manifest
      const serviceAccountFile = this.args.serviceAccount;
      twaManifest.serviceAccountJsonFile = serviceAccountFile;
      // Then we need to call bubblewrap update so the gradle plugin has the appropriate file.
    }
    // Check if service account file exists on disk.

    // Need to validate that the service account file exists in TWA-Manifest
    // and/or on disk. (Thinking about CI/CD scenarios)
    if (!this.validServiceAccountJsonFile(twaManifest.serviceAccountJsonFile)) {
      // Return an error or log here?
      return false;
    }

    // bubblewrap play --init
    // This might not be useful at all considering that right now, we do not use anything listed in
    // the play listing.
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
  await play.run();
  return true;
}
