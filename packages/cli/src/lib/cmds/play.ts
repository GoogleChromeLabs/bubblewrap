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
  track?: string;
  serviceAccountFile?: string;
  manifest?: string;
  appBundleLocation?: string;
  targetDirectory?: string;
  retain?: number;
  remove?: number;
  list?: boolean;
  add?: number;
}

// Default file path
const defaultSignedAppBundleFileName = 'app-release-bundle.aab';

type PlayCommand = 'publish' | 'retain' | 'versionCheck';

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
  * @summary Can validate the largest version number vs twa-manifest.json and update
  * to give x+1 version number.
  * @return {number} The largest version number found in the play console.
  */
  async getLargestVersion(twaManifest: TwaManifest): Promise<number> {
    const versionCode = await this.googlePlay.performPlayOperation(
        twaManifest.packageId, async (editId: string): Promise<number> => {
          return await this.googlePlay.getLargestVersionCode(twaManifest.packageId, editId);
        });
    return versionCode;
  }

  /**
  * Publishes the Android App Bundle to the user specified {@link PlayStoreTrack} from the
  * {@link PlayArgs}.
  * @return {boolean} Whether the publish command completes successfully or not.
  */
  async publish(twaManifest: TwaManifest): Promise<boolean> {
    // Validate that the publish value is listed in the available Tracks.
    // If no value was supplied with publish we make it internal.
    const userSelectedTrack = asPlayStoreTrack(this.args.track?.toLowerCase() || 'internal');
    if (userSelectedTrack == null) {
      this.prompt.printMessage(enUS.messageInvalidTrack);
      return false;
    }

    const defaultPath = path.join(process.cwd(), defaultSignedAppBundleFileName);

    const publishFilePath = this.args.appBundleLocation || defaultPath;

    if (!fs.existsSync(publishFilePath)) {
      throw new Error(`App Bundle not found on disk: ${publishFilePath}`);
    }

    const retainedBundles = twaManifest.retainedBundles;
    await this.googlePlay.performPlayOperation(twaManifest.packageId,
        async (editId: string): Promise<void> => {
          return await this.googlePlay.publishBundle(
              userSelectedTrack, publishFilePath, twaManifest.packageId, retainedBundles, editId);
        }, true);

    return true;
  }

  /**
  * Updates the gradle file based on the updates to the twa-manifest.json file and warns the user
  *   that they need to call build again.
  * @param {string} manifestFile - The path to the the TwaManifest JSON file.
  * @param {string} appVersionName - Optional: Changes the string representation of the version.
  */
  private async updateProjectAndWarn(manifestFile: string, appVersionName?: string): Promise<void> {
    await updateProject(
        true,
        appVersionName || null,
        this.prompt,
        this.args.targetDirectory || process.cwd(),
        manifestFile);
    this.prompt.printMessage(enUS.messageCallBubblewrapBuild);
  }

  /**
  * Runs the playRetain command. This handles the retaining of packages that are published on Play.
  * @return {boolean} Returns whether or not the run command completed successfully.
  */
  async runRetain(): Promise<boolean> {
    const manifestFile = this.args.manifest || path.join(process.cwd(), TWA_MANIFEST_FILE_NAME);
    const twaManifest = await TwaManifest.fromFile(manifestFile);

    // bubblewrap playRetain --add 86
    if (this.args.add) {
      const versionToRetain = this.args.add;
      // Validate an integer was supplied.
      if (!Number.isInteger(versionToRetain)) {
        throw new Error(enUS.versionRetainedNotAnInteger);
      }
      if (versionToRetain > twaManifest.appVersionCode) {
        // Cannot retain a higher version as that would take precedence.
        await this.prompt.printMessage(
            enUS.versionToRetainHigherThanBuildVersion(
                twaManifest.appVersionCode, versionToRetain));
      }
      // Validate that the version exists on the Play Servers.
      const exists = await this.googlePlay.performPlayOperation(twaManifest.packageId,
          async (editId: string): Promise<boolean> => {
            return await this.googlePlay.versionExists(
                twaManifest.packageId, versionToRetain, editId);
          });
      if (!exists) {
        throw new Error(enUS.versionDoesNotExistOnServer);
      }

      const alreadyRetained = twaManifest.retainedBundles.find(
          (version) => version == versionToRetain);

      if (!alreadyRetained) {
        twaManifest.retainedBundles.push(versionToRetain);
      }

      await twaManifest.saveToFile(manifestFile);
    }

    // bubblewrap playRetain --remove 86
    if (this.args.remove) {
      const versionToRemove = this.args.remove;
      twaManifest.retainedBundles = twaManifest.retainedBundles.filter((obj) => {
        return obj != versionToRemove;
      });
      await twaManifest.saveToFile(manifestFile);
    }

    // bubblewrap playRetain --list
    if (this.args.list) {
      twaManifest.retainedBundles.forEach((version) => {
        this.prompt.printMessage(`${version}`);
      });
    }

    return true;
  }

  /**
   * Calls the publish workflow to the Play Store. This takes a user supplied track (or internal)
   *  and an appBundleLocation (defaults to the current directory) and uploads these artifacts to
   *  the Google Play Store.
   * @returns whether the playPublish command completed successfully
   */
  async runPlayPublish(): Promise<boolean> {
    const manifestFile = this.args.manifest || path.join(process.cwd(), TWA_MANIFEST_FILE_NAME);
    const twaManifest = await TwaManifest.fromFile(manifestFile);

    const success = await this.publish(twaManifest);
    if (!success) {
      this.prompt.printMessage(enUS.messagePublishingWasNotSuccessful);
      return false;
    }
    this.prompt.printMessage(enUS.messagePlayUploadSuccess);
    return true;
  }

  /**
   * Runs the version check workflow. If the published version is higher than that of the twaManifest,
   *  we assume that the version that exists locally is needs to be updated to a higher version.
   */
  async runVersionCheck(): Promise<void> {
    const manifestFile = this.args.manifest || path.join(process.cwd(), TWA_MANIFEST_FILE_NAME);
    const twaManifest = await TwaManifest.fromFile(manifestFile);

    // bubblewrap playVersionCheck
    const version = await this.getLargestVersion(twaManifest);
    if (version >= twaManifest.appVersionCode) {
      const updateVersion = await this.prompt.promptConfirm(enUS.promptVersionMismatch(
          twaManifest.appVersionCode.toString(), version.toString()), true);
      if (updateVersion) {
        if (twaManifest.appVersionCode.toString() == twaManifest.appVersionName) {
          twaManifest.appVersionName = (version + 1).toString();
        }
        twaManifest.appVersionCode = version + 1;
        await twaManifest.saveToFile(manifestFile);
        await this.updateProjectAndWarn(manifestFile);
      }
    }
  }
}

/**
  * Validates that the service account JSON file exists.
  * @param {string | undefined} path - The path the the JSON file.
  * @return {boolean} Whether or not the JSON file exists.
  */
function validServiceAccountJsonFile(path: string | undefined): boolean {
  if (path == undefined) {
    return false;
  }
  if (!fs.existsSync(path)) {
    return false;
  }
  return true;
}

async function setupGooglePlay(args: PlayArgs): Promise<GooglePlay> {
  const manifestFile = args.manifest || path.join(process.cwd(), TWA_MANIFEST_FILE_NAME);
  const twaManifest = await TwaManifest.fromFile(manifestFile);
  // Update the TWA-Manifest if service account is supplied
  // bubblewrap play --serviceAccountFile="/path/to/service-account.json"
  // --manifest="/path/twa-manifest.json"
  if (args.serviceAccountFile) {
    twaManifest.serviceAccountJsonFile = args.serviceAccountFile;
    await twaManifest.saveToFile(manifestFile);
  }
  if (!twaManifest.serviceAccountJsonFile ||
      !validServiceAccountJsonFile(twaManifest.serviceAccountJsonFile)) {
    throw new Error(enUS.messageServiceAccountJSONMissing);
  }
  // Setup Google Play since we can confirm that the serviceAccountJsonFile is valid.
  return new GooglePlay(twaManifest.serviceAccountJsonFile);
}

export async function play(parsedArgs: PlayArgs,
    command: PlayCommand, prompt: Prompt = new InquirerPrompt()): Promise<boolean> {
  // TODO(@nohe427): Remove after experimental
  if (!await prompt.promptConfirm(enUS.promptExperimentalFeature, false)) {
    return true;
  }
  const googlePlay = await setupGooglePlay(parsedArgs);
  const play = new Play(parsedArgs, googlePlay, prompt);
  switch (command) {
    case 'publish':
      return await play.runPlayPublish();
    case 'versionCheck':
      await play.runVersionCheck();
      return true;
    case 'retain':
      return await play.runRetain();
  }
}
