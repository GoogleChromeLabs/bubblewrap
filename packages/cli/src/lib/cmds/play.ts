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

import {GooglePlay, TwaManifest, asPlayStoreTrack} from '@bubblewrap/core';
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
}

/**
  * The Play class is the class that is used to communicate with the Google Play Store.
  */
class Play {
  private googlePlay?: GooglePlay;
  constructor(
    private args: PlayArgs,
    private prompt: Prompt = new InquirerPrompt(),
  ) {}

  /**
  * @summary Can validate the largest version number vs twa-manifest.json and update
  * to give x+1 version number.
  * @return {number} The largest version number found in the play console.
  */
  async getLargestVersion(twaManifest: TwaManifest): Promise<number> {
    const versionNumber = await this.googlePlay!.getLargestVersionCode(twaManifest.packageId);
    return versionNumber;
  }

  /**
  * Publishes the Android App Bundle to the specified from the {@link PlayArgs}.
  * @return {boolean} Whether the publish command completes successfully or not.
  */
  async publish(twaManifest: TwaManifest): Promise<boolean> {
    // Validate that the publish value is listed in the available Tracks.
    // If no value was supplied with publish we make it internal.
    const userSelectedTrack = asPlayStoreTrack(this.args.publish?.toLowerCase() || 'internal');
    if (userSelectedTrack == null) {
      this.prompt.printMessage(enUS.messageInvalidTrack);
      return false;
    }
    // appbundlelocation is an option argument.
    if (this.args.appBundleLocation && fs.existsSync(this.args.appBundleLocation!!)) {
      return await this.internalPublish(
          this.args.appBundleLocation,
          userSelectedTrack,
          twaManifest,
      );
    }

    const defaultSignedAppBundleFileName = 'app-release-bundle.aab';
    // Where we should find our output file
    const defaultPath = path.join(process.cwd(), defaultSignedAppBundleFileName);

    return await this.internalPublish(defaultPath, userSelectedTrack, twaManifest);
  }

  private async internalPublish(
      bundleLocation: string,
      userSelectedTrack: string,
      twaManifest: TwaManifest,
  ): Promise<boolean> {
    await this.googlePlay!.publishBundle(
        userSelectedTrack,
        bundleLocation,
        twaManifest.packageId,
        [], // TODO: add a retainedBundles array to the twaManifest.
    );
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

  private async updateProjectAndWarn(manifestFile: string, appVersionName?: string): Promise<void> {
    await updateProject(
        true,
        (appVersionName || null),
        this.prompt,
        this.args.targetDirectory || process.cwd(),
        manifestFile,
    );
    this.prompt.printMessage(enUS.messageCallBubblewrapBuild);
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
      await twaManifest.saveToFile(manifestFile);
    }
    if (!this.validServiceAccountJsonFile(twaManifest.serviceAccountJsonFile)) {
      this.prompt.printMessage(enUS.messageServiceAccountJSONMissing);
      return false;
    }
    // Setup Google Play since we can confirm that the serviceAccountJsonFile is valid.
    this.googlePlay = new GooglePlay(twaManifest.serviceAccountJsonFile!);

    // bubblewrap play --versionCheck
    if (this.args.versionCheck) {
      const version = await this.getLargestVersion(twaManifest);
      if (version >= twaManifest.appVersionCode) {
        const updateVersion = await this.prompt.promptConfirm(enUS.promptVersionMismatch(
            twaManifest.appVersionCode.toString(), version.toString()), true);
        if (updateVersion) {
          twaManifest.appVersionCode = version + 1;
          await twaManifest.saveToFile(manifestFile);
          await this.updateProjectAndWarn(manifestFile);
        }
      }
    }

    // bubblewrap play --publish
    if (this.args.publish) {
      const success = await this.publish(twaManifest);
      if (!success) {
        this.prompt.printMessage(enUS.messagePublishingWasNotSuccessful);
        return false;
      }
      this.prompt.printMessage(enUS.messagePlayUploadSuccess);
    }

    return true;
  }
}

export async function play(parsedArgs: PlayArgs,
    prompt: Prompt = new InquirerPrompt()): Promise<boolean> {
  const play = new Play(parsedArgs, prompt);
  await play.run();
  return true;
}
