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

'use strict';

import {Config} from '../Config';
import * as path from 'path';

/**
 * Helps getting information relevant to the JDK installed, including
 * the approprite environment needed to run Java commands on the JDK
 */
export class JdkHelper {
  private process: NodeJS.Process;
  private config: Config;
  private joinPath: (...paths: string[]) => string;
  private pathSeparator: string;
  private pathEnvironmentKey: string;

  /**
   * Constructs a new instance of JdkHelper.
   *
   * @param {NodeJS.Process} process information from the OS process
   * @param {Config} config the llama-pack general configuration
   */
  constructor(process: NodeJS.Process, config: Config) {
    this.process = process;
    this.config = config;
    if (process.platform === 'win32') {
      this.joinPath = path.win32.join;
      this.pathSeparator = ';';
      this.pathEnvironmentKey = 'Path';
    } else {
      this.joinPath = path.posix.join;
      this.pathSeparator = ':';
      this.pathEnvironmentKey = 'PATH';
    }
  }

  /**
   * Returns information from the JAVA_HOME, based on the config and platform.
   * @returns {string} the value for the JAVA_HOME
   */
  getJavaHome(): string {
    if (this.process.platform === 'darwin') {
      return this.joinPath(this.config.jdkPath, '/Contents/Home/');
    } else if (this.process.platform === 'linux' || this.process.platform === 'win32') {
      return this.joinPath(this.config.jdkPath, '/');
    }
    throw new Error(`Unsupported Platform: ${this.process.platform}`);
  }

  /**
   * Returns information from the Java executable location, based on the config and platform.
   * @returns {string} the value where the Java executables can be found
   */
  getJavaBin(): string {
    return this.joinPath(this.getJavaHome(), 'bin/');
  }

  /**
   * Returns a copy of process.env, customized with the correct JAVA_HOME and PATH.
   * @returns {NodeJS.ProcessEnv} an env object configure to run JDK commands
   */
  getEnv(): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = Object.assign({}, this.process.env);
    env['JAVA_HOME'] = this.getJavaHome();
    // Concatenates the Java binary path to the existing PATH environment variable.
    env[this.pathEnvironmentKey] =
        this.getJavaBin() + this.pathSeparator + env[this.pathEnvironmentKey];
    return env;
  }
}
