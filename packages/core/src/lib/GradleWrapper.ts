/*
 * Copyright 2019 Google Inc. All Rights Reserved.
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

import {executeFile} from './util';
import {AndroidSdkTools} from './androidSdk/AndroidSdkTools';

/**
 * A Wrapper around the Gradle commands.
 */
export class GradleWrapper {
  private process: NodeJS.Process;
  private androidSdkTools: AndroidSdkTools;
  private projectLocation: string;
  private gradleCmd: string;

  /**
   * Builds a new GradleWrapper
   * @param {NodeJS.Process} process NodeJS process information.
   * @param {AndroidSdkTools} androidSdkTools Android SDK to be used when building a project.
   * @param {string} projectLocation The location of the Android project.
   */
  constructor(
      process: NodeJS.Process, androidSdkTools: AndroidSdkTools, projectLocation?: string) {
    this.process = process;
    this.androidSdkTools = androidSdkTools;
    this.projectLocation = projectLocation || this.process.cwd();

    if (process.platform === 'win32') {
      this.gradleCmd = 'gradlew.bat';
    } else {
      this.gradleCmd = './gradlew';
    }
  }

  /**
   * Invokes `gradle bundleRelease` for the Android project.
   */
  async bundleRelease(): Promise<void> {
    this.executeGradleCommand(['bundleRelease', '--stacktrace']);
  }

  /**
   * Invokes `gradle assembleRelease` for the Android project.
   */
  async assembleRelease(): Promise<void> {
    this.executeGradleCommand(['assembleRelease', '--stacktrace']);
  }

  /**
   * Executes gradle commands with custom arguments.
   * @param args - Arguments supplied to gradle, also considered gradle tasks.
   */
  async executeGradleCommand(args: string[]): Promise<void> {
    const env = this.androidSdkTools.getEnv();
    await executeFile(
        this.gradleCmd, args, env, undefined, this.projectLocation);
  }
}
