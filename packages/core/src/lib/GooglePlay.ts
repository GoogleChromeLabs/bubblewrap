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
   * @param serviceAccountJsonFilePath This is the service account file to communicate with the
   *   play publisher API.
   */
  constructor(private gradleWrapper: GradleWrapper, serviceAccountJsonFilePath?: string) {
    if (serviceAccountJsonFilePath) {
      this._googlePlayApi = this.getAndroidClient(serviceAccountJsonFilePath);
    }
  }

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
  async publishBundleWithGradle(track: PlayStoreTrack, filepath: string): Promise<void> {
    // Uploads the artifact to the default internal track.
    await this.gradleWrapper.executeGradleCommand(
        ['publishBundle', '--artifact-dir', filepath, '--track', track]);
  }

  /**
   * This calls the publish bundle command and publishes an existing artifact to Google
   * Play.
   * Calls the following Play API commands in order:
   * Edits.Insert
   * Edits.Bunldes.Upload
   * Edits.Tracks.Update
   * Edits.Commit
   * https://developers.google.com/android-publisher/api-ref/rest/v3/edits.bundles/upload
   * https://developers.google.com/android-publisher/edits#workflow
   * @param track - Specifies the track that the user would like to publish to.
   * @param filepath - Filepath of the App bundle you would like to upload.
   * @param packageName - packageName of the bundle.
   * @param retainedBundles - all bundles that should be retained on upload. This is useful for
   *   ChromeOS only releases.
   */
     async publishBundle(
      track: PlayStoreTrack,
      filepath: string,
      packageName: string,
      retainedBundles: number[],
  ): Promise<void> {
    // TODO(@nohe427): Remove this check when refactor is finished.
    if (!this._googlePlayApi) {
      return;
    }
    const edit = await this._googlePlayApi.edits.insert({packageName: packageName});
    const editId = edit.data.id;
    const result = await this._googlePlayApi.edits.bundles.upload(
        {
          ackBundleInstallationWarning: false,
          editId: editId!,
          packageName: packageName,
          media: {
            body: createReadStream(filepath),
          },
        },
        {
          timeout: 160000,
        });

    const versionCodeUploaded = result.data.versionCode;
    const retainedBundlesStr = retainedBundles.map(((n) => n.toString()));
    await this.addBundleToTrack(
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

  /**
   * This calls the Edits.Tracks.Update play publisher api command. This will do the updating of
   * the user selected track for the reelase to the play store.
   * @param track - Specifies the track that the user would like to publish to.
   * @param versionCodes - Specifies all versions of the app bundle to be included on release
   *   (including retained artifacts).
   * @param packageName - packageName of the bundle.
   * @param editId - The current edit hosted on Google Play.
   */
  async addBundleToTrack(
      track: PlayStoreTrack,
      versionCodes: string[],
      packageName: string,
      editId: string): Promise<void> {
        // TODO(@nohe427): Remove this check when refactor is finished.
    if (!this._googlePlayApi) {
      return;
    }
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
  async getLargestVersionCode(packageName: string): Promise<number> {
    // TODO(@nohe427): Remove this check when refactor is finished.
    if (!this._googlePlayApi) {
      return 0;
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
