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

import * as fs from 'fs';
import * as path from 'path';
import {promisify} from 'util';
import {exec} from 'child_process';

import util = require('../util');
import {Config} from '../Config';
import {JdkHelper} from '../jdk/JdkHelper';

const execPromise = promisify(exec);

const BUILD_TOOLS_VERSION = '29.0.2';

/**
 * Wraps functionality of the Android SDK Tools and allows them to be invoked programatically.
 */
export class AndroidSdkTools {
  process: NodeJS.Process;
  config: Config;
  jdkHelper: JdkHelper;
  pathJoin: (...paths: string[]) => string;

  /**
   * Constructs a new instance of AndroidSdkTools.
   *
   * @param {NodeJS.Process} process information from the OS process
   * @param {Config} config the llama-pack general configuration
   * @param {jdkHelper} jdkHelper the JDK information to be used by the Android SDK
   */
  constructor(process: NodeJS.Process, config: Config, jdkHelper: JdkHelper) {
    this.process = process;
    this.config = config;
    this.jdkHelper = jdkHelper;
    if (this.process.platform === 'win32') {
      this.pathJoin = path.win32.join;
    } else {
      this.pathJoin = path.posix.join;
    }
  }

  /**
   * Installs the build tools into the the Android SDK. Equivalent to running
   *
   * `tools/bin/sdkmanager --install "build-tools;29.0.2"`
   */
  async installBuildTools(): Promise<void> {
    const env = this.getEnv();

    console.log('Installing Build Tools');
    await util.execInteractive(
        this.pathJoin(this.getAndroidHome(), '/tools/bin/sdkmanager'),
        ['--install',
          `"build-tools;${BUILD_TOOLS_VERSION}"`],
        env,
    );
  }

  /**
   * Verifies if the build-tools are installed on the Android SDK.
   */
  async checkBuildTools(): Promise<boolean> {
    const buildToolsPath =
        this.pathJoin(this.getAndroidHome(), '/build-tools/', BUILD_TOOLS_VERSION);
    return fs.existsSync(buildToolsPath);
  }

  async writeLicenseFile(): Promise<void> {
    const licensesPath = this.pathJoin(this.getAndroidHome(), '/licenses/');
    await fs.promises.mkdir(licensesPath, {recursive: true});
    const androidSdkLicenseFile = this.pathJoin(licensesPath, '/android-sdk-license');
    await fs.promises.writeFile(androidSdkLicenseFile, '24333f8a63b6825ea9c5514f83c2829b004d1fee');
  }

  /**
   * Returns the path to the Android SDK.
   * @returns {string} the path to the Android SDK.
   */
  getAndroidHome(): string {
    return this.pathJoin(this.config.androidSdkPath, '/');
  }

  /**
   * Creates a Node Process with the correct ANDROID_HOME information
   * @returns {NodeJS.ProcessEnv} the env with ANDROID_HOME set
   */
  getEnv(): NodeJS.ProcessEnv {
    const env = this.jdkHelper.getEnv();
    env['ANDROID_HOME'] = this.getAndroidHome();
    return env;
  }

  /**
   * Invokes the zipalign tool from the Android SDK
   * @param {string} input path to the input file.
   * @param {string} output path to the output file.
   */
  async zipalign(input: string, output: string): Promise<void> {
    const env = this.getEnv();
    const zipalignCmd = [
      `"${this.pathJoin(this.getAndroidHome(), '/build-tools/29.0.2/zipalign')}"`,
      '-v -f -p 4',
      input,
      output,
    ];
    await execPromise(zipalignCmd.join(' '), {env: env});
  }

  /**
   * Signs an Android APK, with they keystore
   * @param {string} keystore path to the keystore
   * @param {string} ksPass keystore password
   * @param {string} alias key alias
   * @param {string} keyPass key password
   * @param {string} input path to the input APK file
   * @param {string} output path where the signed APK will be generated
   */
  async apksigner(keystore: string, ksPass: string, alias: string, keyPass: string, input: string,
      output: string): Promise<void> {
    const env = this.getEnv();
    const apksignerCmd = [
      `"${this.pathJoin(this.getAndroidHome(), '/build-tools/29.0.2/apksigner')}"`,
      `sign --ks ${keystore}`,
      `--ks-key-alias ${alias}`,
      `--ks-pass pass:${ksPass}`,
      `--key-pass pass:${keyPass}`,
      `--out ${output}`,
      input,
    ];
    await execPromise(apksignerCmd.join(' '), {env: env});
  }
}
