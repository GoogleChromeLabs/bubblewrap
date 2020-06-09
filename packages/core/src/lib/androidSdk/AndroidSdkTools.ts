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
import util = require('../util');
import {Config} from '../Config';
import {JdkHelper} from '../jdk/JdkHelper';
import Log from '../../lib/Log';

const BUILD_TOOLS_VERSION = '29.0.2';

/**
 * Wraps functionality of the Android SDK Tools and allows them to be invoked programatically.
 */
export class AndroidSdkTools {
  private process: NodeJS.Process;
  private config: Config;
  private jdkHelper: JdkHelper;
  private pathJoin: (...paths: string[]) => string;

  /**
   * Constructs a new instance of AndroidSdkTools.
   *
   * @param {NodeJS.Process} process information from the OS process
   * @param {Config} config the bubblewrap general configuration
   * @param {jdkHelper} jdkHelper the JDK information to be used by the Android SDK
   */
  constructor(process: NodeJS.Process, config: Config, jdkHelper: JdkHelper,
       readonly log = new Log('AndroidSdkTools')) {
    if (!fs.existsSync(config.androidSdkPath)) {
      throw new Error(`androidSdkPath does not exist: ${config.androidSdkPath}`);
    }
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

    // The escape char allows us to pass a directory with spaces as sdk_root. On Windows,
    // those are not properly handled by the Android SDK, so we try running without wrapping the
    // value.
    // TODO(andreban): Check for spaces in the path and throw an Error if one is found.
    let sdkRootEscapeChar = '"';
    let sdkManagerPath = this.pathJoin(this.getAndroidHome(), '/tools/bin/sdkmanager');
    if (this.process.platform === 'win32') {
      sdkRootEscapeChar = '';
      sdkManagerPath += '.bat';
    }

    if (!fs.existsSync(sdkManagerPath)) {
      throw new Error(`Could not find sdkmanager at: ${sdkManagerPath}`);
    }

    this.log.info('Installing Build Tools');
    await util.execInteractive(
        sdkManagerPath,
        ['--install',
          `"build-tools;${BUILD_TOOLS_VERSION}"`,
          // setting ANDROID_HOME via this.getEnv() should be enough, but version 6200805 of the
          // the Android Command Line tools don't work properly if sdk_root is not set.
          `--sdk_root=${sdkRootEscapeChar}${this.getAndroidHome()}${sdkRootEscapeChar}`],
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
      `"${this.pathJoin(this.getAndroidHome(), `/build-tools/${BUILD_TOOLS_VERSION}/zipalign`)}"`,
      '-v -f -p 4',
      input,
      output,
    ];
    await util.execute(zipalignCmd, env);
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

    const apkSignerParams = [
      `sign --ks ${keystore}`,
      `--ks-key-alias ${alias}`,
      `--ks-pass pass:${ksPass}`,
      `--key-pass pass:${keyPass}`,
      `--out ${output}`,
      input,
    ];

    // This is a workaround for https://issuetracker.google.com/issues/150888434, where
    // find_java.bat is unable to find the java command on Windows.
    // We run apksigner.jar directly instead of invoking the bat.
    if (this.process.platform === 'win32') {
      const javaCmd = [
        '-Xmx1024M',
        '-Xss1m',
        '-jar',
        `"${this.pathJoin(this.getAndroidHome(),
            `/build-tools/${BUILD_TOOLS_VERSION}/lib/apksigner.jar`)}"`,
      ];
      javaCmd.push(...apkSignerParams);
      await this.jdkHelper.runJava(javaCmd);
      return;
    }

    const apksignerCmd = [
      `"${this.pathJoin(this.getAndroidHome(), `/build-tools/${BUILD_TOOLS_VERSION}/apksigner`)}"`,
    ];
    apksignerCmd.push(...apkSignerParams);
    await util.execute(apksignerCmd, env);
  }

  /**
   * Installs an APK on an a device connected to the computer.
   * @param apkFilePath the path to the APK to be installed
   */
  async install(apkFilePath: string, passthroughArgs: string[] = []): Promise<void> {
    if (!fs.existsSync(apkFilePath)) {
      throw new Error(`Could not find APK file at ${apkFilePath}`);
    }
    const env = this.getEnv();
    const installCmd = [
      `"${this.pathJoin(this.getAndroidHome(), '/platform-tools/adb')}"`,
      'install',
      '-r', // Replace app if another with the same package id already installed.
      ...passthroughArgs,
      apkFilePath,
    ];
    await util.execute(installCmd, env, this.log);
  }
}
