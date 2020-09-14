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
import * as mock from 'mock-fs';

describe('JdkHelper', () => {
  describe('getEnv()', () => {
    it('Creates the correct environment for Linux', () => {
      const config = new Config('/home/user/jdk8', '/home/user/sdktools');
      const process = {
        platform: 'linux',
        env: {
          'PATH': '',
        },
      } as unknown as NodeJS.Process;
      const jdkHelper = new JdkHelper(process, config);
      const env = jdkHelper.getEnv();
      expect(env['PATH']).toBe('/home/user/jdk8/bin/:');
      expect(env['JAVA_HOME']).toBe('/home/user/jdk8/');
    });

    it('Creates the correct environment for MacOSX', () => {
      const config = new Config('/home/user/jdk8', '/home/user/sdktools');
      const process = {
        platform: 'darwin',
        env: {
          'PATH': '',
        },
      } as unknown as NodeJS.Process;
      const jdkHelper = new JdkHelper(process, config);
      const env = jdkHelper.getEnv();
      expect(env['JAVA_HOME']).toBe('/home/user/jdk8/Contents/Home/');
      expect(env['PATH']).toBe('/home/user/jdk8/Contents/Home/bin/:');
    });

    it('Creates the correct environment for Windows', () => {
      const config = new Config('C:\\Users\\user\\jdk8', 'C:\\Users\\user\\sdktools');
      const process = {
        platform: 'win32',
        env: {
          'Path': '',
        },
      } as unknown as NodeJS.Process;
      const jdkHelper = new JdkHelper(process, config);
      const env = jdkHelper.getEnv();
      expect(env['Path']).toBe('C:\\Users\\user\\jdk8\\bin\\;');
      expect(env['JAVA_HOME']).toBe('C:\\Users\\user\\jdk8\\');
    });
  });

  describe('validatePath', () => {
    it('Creates a Windows environment and checks that a valid path will pass', async () => {
      mock({
        'jdk': {
          'release': 'JAVA_VERSION="1.8',
        }});
      expect((await JdkHelper.validatePath('jdk')).isOk()).toBeTrue();
      mock.restore();
    });

    it('Creates a Windows environment and checks that an invalid path will not pass', async () => {
      mock({
        'jdk': {
          'release': {},
        }});
      expect((await JdkHelper.validatePath('jdk')).isError()).toBeTrue();
      expect((await JdkHelper.validatePath('release')).isError()).toBeTrue();
      mock.restore();
    });
  });

  describe('getJavaHome', () => {
    it('Creates a Windows environment and checks that the correct Home is returned', async () => {
      mock({
        'jdk8u265-b01': {
          'bin': {},
          'include': {},
          'jre': {},
          'release': 'JAVA_VERSION="1.8.0_265',
        }});
      const process = {
        platform: 'win32',
        env: {
          'Path': '',
        },
      } as unknown as NodeJS.Process;
      expect(JdkHelper.getJavaHome('jdk8u265-b01', process)).toEqual('jdk8u265-b01\\');
      mock.restore();
    });

    it('Creates a MacOSX environment and checks that the correct Home is returned', async () => {
      mock({
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
      const process = {
        platform: 'darwin',
        env: {
          'Path': '',
        },
      } as unknown as NodeJS.Process;
      expect(JdkHelper.getJavaHome('jdk8u265-b01', process)).toEqual('jdk8u265-b01/Contents/Home/');
      mock.restore();
    });

    it('Creates a Linux environment and checks that the correct Home is returned', async () => {
      mock({
        'jdk8u265-b01': {
          'bin': {},
          'include': {},
          'jre': {},
          'release': 'JAVA_VERSION="1.8.0_265',
        }});
      const process = {
        platform: 'linux',
        env: {
          'Path': '',
        },
      } as unknown as NodeJS.Process;
      expect(JdkHelper.getJavaHome('jdk8u265-b01', process)).toEqual('jdk8u265-b01/');
      mock.restore();
    });
  });
});
