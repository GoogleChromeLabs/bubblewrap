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

import {JdkHelper} from '../../../lib/jdk/JdkHelper';
import {Config} from '../../../lib/Config';
import {vol} from 'memfs';

const WIN32_PROCESS = {
  platform: 'win32',
  env: {
    'Path': '',
  },
} as unknown as NodeJS.Process;

const LINUX_PROCESS = {
  platform: 'linux',
  env: {
    'PATH': '',
  },
} as unknown as NodeJS.Process;

const MACOS_PROCESS = {
  platform: 'darwin',
  env: {
    'PATH': '',
  },
} as unknown as NodeJS.Process;

describe('JdkHelper', () => {
  describe('getEnv()', () => {
    it('Creates the correct environment for Linux', () => {
      const config = new Config('/home/user/jdk8', '/home/user/sdktools');
      const jdkHelper = new JdkHelper(LINUX_PROCESS, config);
      const env = jdkHelper.getEnv();
      expect(env['PATH']).toBe('/home/user/jdk8/bin/:');
      expect(env['JAVA_HOME']).toBe('/home/user/jdk8/');
    });

    it('Creates the correct environment for MacOSX', () => {
      const config = new Config('/home/user/jdk8', '/home/user/sdktools');
      const jdkHelper = new JdkHelper(MACOS_PROCESS, config);
      const env = jdkHelper.getEnv();
      expect(env['JAVA_HOME']).toBe('/home/user/jdk8/Contents/Home/');
      expect(env['PATH']).toBe('/home/user/jdk8/Contents/Home/bin/:');
    });

    it('Creates the correct environment for Windows', () => {
      const config = new Config('C:\\Users\\user\\jdk8', 'C:\\Users\\user\\sdktools');
      const jdkHelper = new JdkHelper(WIN32_PROCESS, config);
      const env = jdkHelper.getEnv();
      expect(env['Path']).toBe('C:\\Users\\user\\jdk8\\bin\\;');
      expect(env['JAVA_HOME']).toBe('C:\\Users\\user\\jdk8\\');
    });
  });

  describe('validatePath', () => {
    it('Creates a Linux environment and checks that a valid path will pass', async () => {
      vol.fromNestedJSON({
        'jdk': {
          'release': 'JAVA_VERSION="17.0.1',
        }});
      expect((await JdkHelper.validatePath('jdk', LINUX_PROCESS)).isOk()).toBeTrue();
      vol.reset();
    });

    it('Creates a Linux environment and checks that an invalid path will not pass', async () => {
      vol.fromNestedJSON({
        'jdk': {
          'release': {},
        }});
      expect((await JdkHelper.validatePath('jdk', LINUX_PROCESS)).isError()).toBeTrue();
      expect((await JdkHelper.validatePath('release', LINUX_PROCESS)).isError()).toBeTrue();
      vol.reset();
    });

    it('Creates a MacOS environment and checks that a valid path will pass', async () => {
      vol.fromNestedJSON({
        'jdk': {
          'Contents': {
            'Home': {
              'release': 'JAVA_VERSION="17.0.1"',
            },
          },
        }});
      expect((await JdkHelper.validatePath('jdk', MACOS_PROCESS)).isOk()).toBeTrue();
      vol.reset();
    });

    it('Creates a MacOS environment and checks that an invalid path will not pass', async () => {
      vol.fromNestedJSON({
        'jdk': {
          'Contents': {
            'Home': {
              'release': 'JAVA_VERSION="1.9"',
            },
          },
        }});
      expect((await JdkHelper.validatePath('jdk', MACOS_PROCESS)).isError()).toBeTrue();
      expect((await JdkHelper.validatePath('release', MACOS_PROCESS)).isError()).toBeTrue();
      vol.reset();
    });
  });

  describe('getJavaHome', () => {
    it('Creates a Windows environment and checks that the correct Home is returned', async () => {
      vol.fromNestedJSON({
        'jdk8u265-b01': {
          'bin': {},
          'include': {},
          'jre': {},
          'release': 'JAVA_VERSION="1.8.0_265',
        }});
      expect(JdkHelper.getJavaHome('jdk8u265-b01', WIN32_PROCESS)).toEqual('jdk8u265-b01\\');
      vol.reset();
    });

    it('Creates a MacOSX environment and checks that the correct Home is returned', async () => {
      vol.fromNestedJSON({
        'jdk8u265-b01': {
          '_CodeSignature': {},
          'Home': {
            'bin': {},
            'include': {},
            'jre': {},
            'release': 'JAVA_VERSION="1.8.0_265',
          },
          'MacOS': {},
          'info.plist': {},
        }});
      expect(JdkHelper.getJavaHome('jdk8u265-b01', MACOS_PROCESS))
          .toEqual('jdk8u265-b01/Contents/Home/');
      vol.reset();
    });

    it('Creates a Linux environment and checks that the correct Home is returned', async () => {
      vol.fromNestedJSON({
        'jdk8u265-b01': {
          'bin': {},
          'include': {},
          'jre': {},
          'release': 'JAVA_VERSION="1.8.0_265',
        }});
      expect(JdkHelper.getJavaHome('jdk8u265-b01', LINUX_PROCESS)).toEqual('jdk8u265-b01/');
      vol.reset();
    });
  });
});
