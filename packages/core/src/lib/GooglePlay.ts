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

export enum Track {
    internal,
    alpha,
    beta,
    production,
}

export class GooglePlay {
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
    this.gradleWrapper.executeGradleCommand(['bootstrap']);
  }

  /**
   * This calls the publish bundle command and publishes an existing artifact to Google
   * Play.
   * https://github.com/Triple-T/gradle-play-publisher#uploading-a-pre-existing-artifact
   * @param track - Specifies the track that the user would like to publish to.
   */
  async publishBundle(track: Track, filepath: string): Promise<void> {
    // Uploads the artifact to the default internal track.
    this.gradleWrapper.executeGradleCommand(
        ['publishBundle', '--artifact-dir', filepath, '--track', Track[track].toLowerCase()]);
  }
}
