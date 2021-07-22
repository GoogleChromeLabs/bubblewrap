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

import {GradleWrapper} from '..';
import {androidpublisher_v3 as androidPublisher, google} from 'googleapis';
import {createReadStream} from 'fs';

// Possible values for release tracks
const TRACK_VALUES = ['alpha', 'beta', 'internal', 'production'];
export type PlayStoreTrack = typeof TRACK_VALUES[number];
export const PlayStoreTracks: PlayStoreTrack[] = [...TRACK_VALUES];

export function asPlayStoreTrack(input?: string): PlayStoreTrack | null {
  if (!input) {
    return null;
  }
  return TRACK_VALUES.includes(input) ? input as PlayStoreTrack : null;
}

export class GooglePlay {
  private _googlePlayApi?: androidPublisher.Androidpublisher;

  /**
   * Constructs a Google Play object with the gradleWrapper so we can use a
   *   gradle plugin to communicate with Google Play.
   *
   * @param gradleWrapper This is the gradle wrapper object that supplies
   *   hooks into Gradle.
   */
  constructor(private gradleWrapper: GradleWrapper) {}

  /**
   * Initialized Google Play and loads the existing configruation from Google Play.
   * The resulting files are stored in the play folder in the src directory.
   * https://github.com/Triple-T/gradle-play-publisher#quickstart
   */
  async initPlay(): Promise<void> {
    await this.gradleWrapper.executeGradleCommand(['bootstrap']);
  }

  /**
   * This calls the publish bundle command and publishes an existing artifact to Google
   * Play.
   * https://github.com/Triple-T/gradle-play-publisher#uploading-a-pre-existing-artifact
   * @param track - Specifies the track that the user would like to publish to.
   */
  async publishBundle(
      track: PlayStoreTrack,
      filepath: string,
      packageName: string,
      serviceAccountJsonFilePath: string,
      retainedBundles: number[],
      progressCallback?: (progressevent: number) => {},
  ): Promise<void> {
    // Set the GooglePlayAPI up if its not configured already.
    if (!this._googlePlayApi) {
      this._googlePlayApi = this.getAndroidClient(serviceAccountJsonFilePath);
    }

    const edit = await this._googlePlayApi.edits.insert({packageName: packageName});
    const editId = edit.data.id;
    const result = await this._googlePlayApi.edits.bundles.upload(
        {
          ackBundleInstallationWarning: false,
          editId: editId!,
          packageName: packageName,
          media: {
            mimeType: 'application/zip',
            body: createReadStream(filepath),
          },
        },
        {
          timeout: 1000,
          onUploadProgress: progressCallback,
        });

    const versionCodeUploaded = result.data.versionCode;
    const retainedBundlesStr = retainedBundles.map(((n) => n.toString()));
    this.addBundleToTrack(
        track,
        [versionCodeUploaded?.toString()!, ...retainedBundlesStr],
        packageName,
      editId!,
    );
    await this._googlePlayApi.edits.commit(
        {
          changesNotSentForReview: false,
          editId: editId!,
          packageName: packageName,
        },
    );
  }

  async addBundleToTrack(
      track: PlayStoreTrack,
      versionCodes: string[],
      packageName: string,
      editId: string): Promise<void> {
    const tracksUpdate: androidPublisher.Params$Resource$Edits$Tracks$Update = {
      track: track,
      packageName: packageName,
      editId: editId,
      requestBody: {
        releases: [{versionCodes: versionCodes}],
        track: track,
      },
    };
    // const result =
    await this._googlePlayApi?.edits.tracks.update(tracksUpdate);
  }

  /**
   * Connects to the Google Play Console and retrieves a list of all Android App Bundles for the
   * given packageName. Finds the largest versionCode of those bundles and returns it. Considers
   * both ChromeOS and Android Releases.
   */
  async getLargestVersionCode(
      packageName: string,
      serviceAccountJsonFilePath: string,
  ): Promise<number> {
    if (!this._googlePlayApi) {
      this._googlePlayApi = this.getAndroidClient(serviceAccountJsonFilePath);
    }
    const edit = await this._googlePlayApi.edits.insert({packageName: packageName});
    const editId = edit.data.id!;
    const bundleResponse =
      await this._googlePlayApi.edits.bundles.list({packageName: packageName, editId: editId});
    const versionCode = Math.max(
        ...bundleResponse.data.bundles!!.map((bundle) => bundle.versionCode!!));
    // cleanup
    await this._googlePlayApi.edits.delete({editId: editId, packageName: packageName});

    return versionCode;
  }

  /**
   * This fetches the Android client using the bubblewrap configuration file.
   */
  private getAndroidClient(
      serviceAccountJsonFilePath: string,
  ): androidPublisher.Androidpublisher {
    // Initialize the Google API Client from service account credentials
    const jwtClient = new google.auth.JWT({
      keyFile: serviceAccountJsonFilePath,
      scopes: ['https://www.googleapis.com/auth/androidpublisher'],
    },
    );

    // Connect to the Google Play Developer API with JWT Client
    return google.androidpublisher({
      version: 'v3',
      auth: jwtClient,
    });
  }
}
