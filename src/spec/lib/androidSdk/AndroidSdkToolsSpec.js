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

const JdkHelper = require('../../../lib/jdk/JdkHelper');
const AndroidSdkTools = require('../../../lib/androidSdk/AndroidSdkTools');

describe('AndroidSdkTools', () => {
  describe('#getEnv()', () => {
    it('Sets the correct ANDROID_HOME on Linux', () => {
      const config = {
        jdkPath: '/home/user/jdk8',
        androidSdkPath: '/home/user/android-sdk',
      };
      const process = {
        platform: 'linux',
        env: {
          'PATH': '',
        },
      };
      const jdkHelper = new JdkHelper(process, config);
      const androidSdkTools = new AndroidSdkTools(process, config, jdkHelper);
      const env = androidSdkTools.getEnv();
      expect(env['ANDROID_HOME']).toBe('/home/user/android-sdk/');
    });

    it('Sets the correct ANDROID_HOME on MacOSX', () => {
      const config = {
        jdkPath: '/home/user/jdk8',
        androidSdkPath: '/home/user/android-sdk',
      };
      const process = {
        platform: 'darwin',
        env: {
          'PATH': '',
        },
      };
      const jdkHelper = new JdkHelper(process, config);
      const androidSdkTools = new AndroidSdkTools(process, config, jdkHelper);
      const env = androidSdkTools.getEnv();
      expect(env['ANDROID_HOME']).toBe('/home/user/android-sdk/');
    });

    it('Sets the correct ANDROID_HOME on Windows', () => {
      const config = {
        jdkPath: 'C:\\Users\\user\\jdk8',
        androidSdkPath: 'C:\\Users\\user\\android-sdk',
      };
      const process = {
        platform: 'win32',
        env: {
          'PATH': '',
        },
      };
      const jdkHelper = new JdkHelper(process, config);
      const androidSdkTools = new AndroidSdkTools(process, config, jdkHelper);
      const env = androidSdkTools.getEnv();
      expect(env['ANDROID_HOME']).toBe('C:\\Users\\user\\android-sdk\\');
    });
  });
});
