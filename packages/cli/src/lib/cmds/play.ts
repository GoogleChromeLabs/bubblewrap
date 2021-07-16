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
  asPlayStoreTrack,
} from '@bubblewrap/core';
import * as fs from 'fs';
import * as path from 'path';
import {TWA_MANIFEST_FILE_NAME} from '../constants';
import {Prompt, InquirerPrompt} from '../Prompt';
import {updateProject} from './shared';
import {enUS} from '../strings';

export interface PlayArgs {
  publish?: string;
  init?: boolean;
  serviceAccountFile?: string;
  manifest?: string;
  appBundleLocation?: string;
  targetDirectory?: string;
  versionCheck?: boolean;
  // versionCheck?: boolean; // Uncomment when getLargetVersion is implemented.
}

/**
  * The Play class is the class that is used to communicate with the Google Play Store.
  */
class Play {
  constructor(
    private args: PlayArgs,
    private googlePlay: GooglePlay,
    private prompt: Prompt = new InquirerPrompt(),
  ) {}

  /**
  * Bootstraps the Play listing via the Gradle-Play-Plugin.
  * @return {void}
  */
  async bootstrapPlay(): Promise<void> {
    await this.googlePlay.initPlay();
  }

  /**
  * @summary Can validate the largest version number vs twa-manifest.json and update
  * to give x+1 version number.
  * @return {number} The largest version number found in the play console.
  */
  async getLargestVersion(twaManifest: TwaManifest): Promise<number> {
    const versionNumber = await this.googlePlay.getLargestVersion(
      twaManifest.packageId, twaManifest.serviceAccountJsonFile!);
    return versionNumber;
  }

  /**
  * Publishes the Android App Bundle to the specified from the {@link PlayArgs}.
  * @return {boolean} Whether the publish command completes successfully or not.
  */
  async publish(): Promise<boolean> {
    // Validate that the publish value is listed in the available Tracks.
    // If no value was supplied with publish we make it internal.
    const userSelectedTrack = asPlayStoreTrack(this.args.publish?.toLowerCase() || 'internal');
    if (userSelectedTrack == null) {
      this.prompt.printMessage(enUS.messageInvalidTrack);
      return false;
    }
    // appbundlelocation is an option argument.
    if (this.args.appBundleLocation && fs.existsSync(this.args.appBundleLocation!!)) {
      await this.googlePlay.publishBundle(userSelectedTrack, this.args.appBundleLocation);
      return true;
    }
    // Make tmp directory copy file over signed APK then cleanup.
    const publishDir = fs.mkdtempSync('bubblewrap');
    const signedAppBundleFileName = 'app-release-bundle.aab';
    // Where we should find our output file
    const defaultPath = path.join(process.cwd(), signedAppBundleFileName);

    fs.copyFileSync(defaultPath, path.join(publishDir, signedAppBundleFileName));
    await this.googlePlay.publishBundle(userSelectedTrack, publishDir);

    fs.unlinkSync(path.join(publishDir, signedAppBundleFileName));
    fs.rmdirSync(publishDir);
    return true;
  }

  /**
  * Validates that the service account JSON file exists.
  * @param {string | undefined} path - The path the the JSON file.
  * @return {boolean} Whether or not the JSON file exists.
  */
  private validServiceAccountJsonFile(path: string | undefined): boolean {
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

  /**
  * Runs the play command. This allows multiple flags to be handled through here.
  * @return {boolean} Returns whether or not the run command completed successfully.
  */
  async run(): Promise<boolean> {
    if (!await this.prompt.promptConfirm(enUS.promptExperimentalFeature, false)) {
      return true;
    }
    const manifestFile = this.args.manifest || path.join(process.cwd(), TWA_MANIFEST_FILE_NAME);
    const twaManifest = await TwaManifest.fromFile(manifestFile);
    // Update the TWA-Manifest if service account is supplied
    // bubblewrap play --serviceAccountFile="/path/to/service-account.json"
    // --manifest="/path/twa-manifest.json"
    if (this.args.serviceAccountFile) {
      twaManifest.serviceAccountJsonFile = this.args.serviceAccountFile;
      twaManifest.saveToFile(manifestFile);
      // Then we need to call bubblewrap update so the gradle plugin has the appropriate file.
      await updateProject(
          true, null, this.prompt, this.args.targetDirectory || process.cwd(), manifestFile);
      this.prompt.printMessage(enUS.messageCallBubblewrapBuild);
    }
    if (!this.validServiceAccountJsonFile(twaManifest.serviceAccountJsonFile)) {
      this.prompt.printMessage(enUS.messageServiceAccountJSONMissing);
      return false;
    }

    // bubblewrap play --init
    if (this.args.init) {
      await this.bootstrapPlay();
    }
    // bubblewrap play --publish
    if (this.args.publish) {
      const success = await this.publish();
      if (!success) {
        this.prompt.printMessage(enUS.messagePublishingWasNotSuccessful);
        return false;
      }
      this.prompt.printMessage(enUS.messagePlayUploadSuccess);
    }

    // bubblewrap play --versionCheck
    if (this.args.versionCheck) {
      const version = await this.getLargestVersion(twaManifest);
      this.prompt.printMessage(version.toString());
    }
    return true;
  }
}

export async function play(config: Config, parsedArgs: PlayArgs,
    log: Log = new ConsoleLog('play'), prompt: Prompt = new InquirerPrompt()): Promise<boolean> {
  const jdkHelper = new JdkHelper(process, config);
  const androidSdkTools = await AndroidSdkTools.create(process, config, jdkHelper, log);
  const gradleWrapper = new GradleWrapper(process, androidSdkTools);
  const googlePlay = new GooglePlay(gradleWrapper);
  const play = new Play(parsedArgs, googlePlay, prompt);
  await play.run();
  return true;
}
