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
const config = require('../Config');

class JdkInstaller {
  getJavaHome() {
    if (process.platform === 'darwin') {
      return path.join(config.jdkPath, '/Contents/Home/');
    } else if (process.platform === 'linux' || process.platform === 'win32') {
      return path.join(config.jdkPath, '/');
    }
    throw new Error(`Unsupported Platform: ${process.platform}`);
  }

  getJavaBin() {
    return path.join(this.getJavaHome(), 'bin/');
  }

  _getPathSeparator(platform) {
    if (platform === 'win32') {
      return ';';
    }
    return ':';
  }

  _getPathEnviromentKey(platform) {
    if (platform === 'win32') {
      return 'Path';
    }
    return 'PATH';
  }

  getEnv() {
    const pathSeparator = this._getPathSeparator(process.platform);
    const pathKey = this._getPathEnviromentKey(process.platform);
    const env = Object.assign({}, process.env);
    env['JAVA_HOME'] = this.getJavaHome();
    env[pathKey] = this.getJavaBin() + pathSeparator + env[pathKey];
    return env;
  }
}

module.exports = new JdkInstaller();
