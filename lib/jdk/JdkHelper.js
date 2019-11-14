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

const path = require('path');

/**
 * Helps getting information relevant to the JDK installed, including
 * the approprite environment needed to run Java commands on the JDK
 */
class JdkHelper {
  constructor(process, config) {
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
   * @returns {String} the value for the JAVA_HOME
   */
  getJavaHome() {
    if (this.process.platform === 'darwin') {
      return this.joinPath(this.config.jdkPath, '/Contents/Home/');
    } else if (this.process.platform === 'linux' || this.process.platform === 'win32') {
      return this.joinPath(this.config.jdkPath, '/');
    }
    throw new Error(`Unsupported Platform: ${this.process.platform}`);
  }

  /**
   * @returns {String} the value where the Java executables can be found
   */
  getJavaBin() {
    return this.joinPath(this.getJavaHome(), 'bin/');
  }

  /**
   * @returns {Object} an env object configure to run JDK commands
   */
  getEnv() {
    const env = Object.assign({}, this.process.env);
    env['JAVA_HOME'] = this.getJavaHome();
    env[this.pathEnvironmentKey] =
        this.getJavaBin() + this.pathSeparator + env[this.pathEnvironmentKey];
    return env;
  }
}

module.exports = JdkHelper;
