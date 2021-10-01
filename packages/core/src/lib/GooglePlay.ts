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

import {androidpublisher_v3 as androidPublisher, google} from 'googleapis';
import {createReadStream} from 'fs';

// Possible values for release tracks
const TRACK_VALUES = ['alpha', 'beta', 'internal', 'production'];
export type PlayStoreTrack = typeof TRACK_VALUES[number];
export const PlayStoreTracks: PlayStoreTrack[] = [...TRACK_VALUES];

const PLAY_API_TIMEOUT_MS = 180000;

export function asPlayStoreTrack(input?: string): PlayStoreTrack | null {
  if (!input) {
    return null;
  }
  return TRACK_VALUES.includes(input) ? input as PlayStoreTrack : null;
}

export class GooglePlay {
  private _googlePlayApi: androidPublisher.Androidpublisher;

  /**
   * Constructs a Google Play object with the gradleWrapper so we can use a
   *   gradle plugin to communicate with Google Play.
   *
   * @param serviceAccountJsonFilePath This is the service account file to communicate with the
   *   play publisher API.
   */
  constructor(serviceAccountJsonFilePath: string) {
    this._googlePlayApi = this.getAndroidClient(serviceAccountJsonFilePath);
    if (!this._googlePlayApi) {
      throw new Error('Could not create a Google Play API client');
    }
  }

  /**
   * Generates an editId that should be used in all play operations.
   * @param packageName - The package that will be worked upon.
   * @param operation - The Play Operation which requires an editId injected
   * @param commitEdit - Whether or not this edit is a action or query edit. true indicates an action edit.
   * @returns - A PlayOperationResult which contains the output of the operation in a field that was worked upon.
   */
  async performPlayOperation<Type>(packageName: string,
      operation: (editId: string) => Promise<Type>, commitEdit = false): Promise<Type> {
    const editId = await this.startPlayOperation(packageName);
    const result = await operation(editId);
    if (!commitEdit) {
      await this.endPlayOperation(packageName, editId);
    }
    return result;
  }

  /**
   * This calls the publish bundle command and publishes an existing artifact to Google
   * Play.
   * Calls the following Play API commands in order:
   * Edits.Insert
   * Edits.Bundles.Upload
   * Edits.Tracks.Update
   * Edits.Commit
   * https://developers.google.com/android-publisher/api-ref/rest/v3/edits.bundles/upload
   * https://developers.google.com/android-publisher/edits#workflow
   * @param track - Specifies the track that the user would like to publish to.
   * @param filepath - Filepath of the App bundle you would like to upload.
   * @param packageName - Package name of the bundle.
   * @param retainedBundles - All bundles that should be retained on upload. This is useful for
   *   ChromeOS only releases.
   */
  async publishBundle(
      track: PlayStoreTrack,
      filepath: string,
      packageName: string,
      retainedBundles: number[],
      editId: string,
  ): Promise<void> {
    const result = await this._googlePlayApi.edits.bundles.upload(
        {
          ackBundleInstallationWarning: false,
          editId: editId,
          packageName: packageName,
          media: {
            body: createReadStream(filepath),
          },
        },
        {
          timeout: PLAY_API_TIMEOUT_MS,
        });

    const versionCodeUploaded = result.data.versionCode;
    if (!versionCodeUploaded) {
      throw new Error('Version code could not be found from Play API.');
    }
    const retainedBundlesStr = retainedBundles.map((n) => n.toString());
    await this.addBundleToTrack(
        track,
        [versionCodeUploaded.toString(), ...retainedBundlesStr],
        packageName,
        editId,
    );
    await this._googlePlayApi.edits.commit(
        {
          changesNotSentForReview: false,
          editId: editId,
          packageName: packageName,
        },
    );
  }

  /**
   * This calls the Edits.Tracks.Update play publisher api command. This will do the updating of
   * the user selected track for the reelase to the play store.
   * @param track - Specifies the track that the user would like to publish to.
   * @param versionCodes - Specifies all versions of the app bundle to be included on release
   *   (including retained artifacts).
   * @param packageName - packageName of the bundle.
   * @param editId - The current edit hosted on Google Play.
   */
  private async addBundleToTrack(
      track: PlayStoreTrack,
      versionCodes: string[],
      packageName: string,
      editId: string): Promise<void> {
    const tracksUpdate: androidPublisher.Params$Resource$Edits$Tracks$Update = {
      track: track,
      packageName: packageName,
      editId: editId,
      requestBody: {
        releases: [{
          versionCodes: versionCodes,
          status: 'completed',
        }],
        track: track,
      },
    };
    await this._googlePlayApi.edits.tracks.update(tracksUpdate);
  }


  /**
   * Connects to the Google Play Console and retrieves a list of all Android App Bundles for the
   * given packageName. Finds the largest versionCode of those bundles and returns it. Considers
   * both ChromeOS and Android Releases.
   * @param packageName - The packageName of the versionCode we are looking up.
   */
  async getLargestVersionCode(packageName: string, editId: string):
      Promise<number> {
    const bundleResponse =
        await this._googlePlayApi.edits.bundles.list({packageName: packageName, editId: editId});
    if (!bundleResponse.data.bundles) {
      throw new Error('No bundles found from Google Play');
    }
    const versionCode = Math.max(
        ...bundleResponse.data.bundles.map((bundle) => bundle.versionCode!!));

    return versionCode;
  }

  /**
   * Starts an edit on the Play servers. This is the basis for any play publishing api operation.
   * @param packageName - the packageName of the app we want to interact with.
   */
  private async startPlayOperation(packageName: string): Promise<string> {
    const edit = await this._googlePlayApi.edits.insert({packageName: packageName});
    const editId = edit.data.id;
    if (!editId) {
      throw new Error('Could not create a Google Play edit');
    }
    return editId;
  }

  /**
   * Cancels the edit in progress on the Play server.
   * @param packageName - The packageName of the app we are interacting with.
   * @param editId - The editId that is currently in progress.
   */
  private async endPlayOperation(packageName: string, editId: string): Promise<void> {
    await this._googlePlayApi.edits.delete({editId: editId, packageName: packageName});
  }

  /**
   * Checks to see if the version that we want to retain already exists within the Play Store.
   * @param packageName - The packageName of the versionCode we are looking up.
   * @param versionCode - The version code of the APK / Bundle we want to retain.
   */
  async versionExists(packageName: string, versionCode: number, editId: string):
      Promise<boolean> {
    const uploadedApks =
        await this._googlePlayApi.edits.apks.list({packageName: packageName, editId: editId});

    let found = uploadedApks.data.apks?.find((obj) => obj.versionCode == versionCode);

    if (found) {
      return true;
    }

    const uploadedBundles =
        await this._googlePlayApi.edits.bundles.list({packageName: packageName, editId: editId});

    found = uploadedBundles.data.bundles?.find((obj) => obj.versionCode == versionCode);

    if (found) {
      return true;
    }

    return false;
  }

  /**
   * This fetches the Android client using the bubblewrap configuration file.
   * @param serviceAccountJsonFilePath - The file path to the service account file. This allows
   *   communication to the Play Publisher API.
   */
  private getAndroidClient(serviceAccountJsonFilePath: string): androidPublisher.Androidpublisher {
    // Initialize the Google API Client from service account credentials
    const jwtClient = new google.auth.JWT({
      keyFile: serviceAccountJsonFilePath,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    });

    // Connect to the Google Play Developer API with JWT Client
    return google.androidpublisher({
      version: 'v3',
      auth: jwtClient,
    });
  }
}
