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

const {promisify} = require('util');
const fs = require('fs');
const fileExists = promisify(fs.exists);

class Config {
  async check() {
    if (!await fileExists(this.jdkPath)) {
      throw new Error(`${this.jdkPath} does not exist. Check the jdkPath on your config`);
    }
    if (!await fileExists(this.androidSdkPath)) {
      throw new Error(
          `${this.androidSdkPath} does not exist. Check the androidSdkPath on your config`);
    };
  }
}

module.exports = (() => {
  const config = new Config();
  Object.assign(config, require('../llama-pack-config'));
  return config;
})();
