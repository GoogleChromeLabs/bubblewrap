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

describe('JdkHelper', () => {
  describe('getEnv()', () => {
    it('Creates the correct environment for Linux', () => {
      const config = {
        jdkPath: '/home/user/jdk8',
      };
      const process = {
        platform: 'linux',
        env: {
          'PATH': '',
        },
      };
      const jdkHelper = new JdkHelper(process, config);
      const env = jdkHelper.getEnv();
      expect(env['PATH']).toBe('/home/user/jdk8/bin/:');
      expect(env['JAVA_HOME']).toBe('/home/user/jdk8/');
    });

    it('Creates the correct environment for MacOSX', () => {
      const config = {
        jdkPath: '/home/user/jdk8',
      };
      const process = {
        platform: 'darwin',
        env: {
          'PATH': '',
        },
      };
      const jdkHelper = new JdkHelper(process, config);
      const env = jdkHelper.getEnv();
      expect(env['JAVA_HOME']).toBe('/home/user/jdk8/Contents/Home/');
      expect(env['PATH']).toBe('/home/user/jdk8/Contents/Home/bin/:');
    });

    it('Creates the correct environment for Windows', () => {
      const config = {
        jdkPath: 'C:\\Users\\user\\jdk8',
      };
      const process = {
        platform: 'win32',
        env: {
          'Path': '',
        },
      };
      const jdkHelper = new JdkHelper(process, config);
      const env = jdkHelper.getEnv();
      expect(env['Path']).toBe('C:\\Users\\user\\jdk8\\bin\\;');
      expect(env['JAVA_HOME']).toBe('C:\\Users\\user\\jdk8\\');
    });
  });
});
