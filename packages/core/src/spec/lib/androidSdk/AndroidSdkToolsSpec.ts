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

import {Config} from '../../../lib/Config';
import {JdkHelper} from '../../../lib/jdk/JdkHelper';
import {AndroidSdkTools} from '../../../lib/androidSdk/AndroidSdkTools';
import util = require('../../../lib/util');

function buildMockConfig(platform: string): Config {
  if (platform === 'linux' || platform == 'darwin') {
    return {
      jdkPath: '/home/user/jdk8',
      androidSdkPath: '/home/user/android-sdk',
    } as unknown as Config;
  }

  if (platform === 'win32') {
    return {
      jdkPath: 'C:\\Users\\user\\jdk8',
      androidSdkPath: 'C:\\Users\\user\\android-sdk',
    } as unknown as Config;
  }

  throw new Error('Unsupported Platform: ' + platform);
}

function buildMockProcess(platform: string): NodeJS.Process {
  if (platform === 'linux') {
    return {
      platform: 'linux',
      env: {
        'PATH': '',
      },
    } as unknown as NodeJS.Process;
  }

  if (platform === 'darwin') {
    return {
      platform: 'darwin',
      env: {
        'PATH': '',
      },
    } as unknown as NodeJS.Process;
  }

  if (platform === 'win32') {
    return {
      platform: 'win32',
      env: {
        'PATH': '',
      },
    } as unknown as NodeJS.Process;
  }

  throw new Error('Unsupported Platform: ' + platform);
}

describe('AndroidSdkTools', () => {
  describe('#getEnv()', () => {
    const tests = [
      {platform: 'linux', expectedAndroidHome: '/home/user/android-sdk/'},
      {platform: 'darwin', expectedAndroidHome: '/home/user/android-sdk/'},
      {platform: 'win32', expectedAndroidHome: 'C:\\Users\\user\\android-sdk\\'},
    ];

    tests.forEach((test) => {
      it(`Sets the correct ANDROID_HOME on ${test.platform}`, () => {
        const config = buildMockConfig(test.platform);
        const process = buildMockProcess(test.platform);
        const jdkHelper = new JdkHelper(process, config);
        const androidSdkTools = new AndroidSdkTools(process, config, jdkHelper);
        const env = androidSdkTools.getEnv();
        expect(env['ANDROID_HOME']).toBe(test.expectedAndroidHome);
      });
    });
  });

  describe('#installBuildTools', () => {
    const tests = [
      {platform: 'linux',
        expectedSdkRoot: '"/home/user/android-sdk/"',
        expectedCwd: '/home/user/android-sdk/tools/bin/sdkmanager'},
      {platform: 'darwin',
        expectedSdkRoot: '"/home/user/android-sdk/"',
        expectedCwd: '/home/user/android-sdk/tools/bin/sdkmanager'},
      {platform: 'win32',
        expectedSdkRoot: 'C:\\Users\\user\\android-sdk\\',
        expectedCwd: 'C:\\Users\\user\\android-sdk\\tools\\bin\\sdkmanager'},
    ];

    tests.forEach((test) => {
      it(`Build the correct command-line on ${test.platform}`, () => {
        const config = buildMockConfig(test.platform);
        const process = buildMockProcess(test.platform);
        const jdkHelper = new JdkHelper(process, config);
        const androidSdkTools = new AndroidSdkTools(process, config, jdkHelper);
        spyOn(util, 'execInteractive').and.stub();
        androidSdkTools.installBuildTools();
        expect(util.execInteractive).toHaveBeenCalledWith(
            test.expectedCwd,
            ['--install', '"build-tools;29.0.2"', `--sdk_root=${test.expectedSdkRoot}`],
            androidSdkTools.getEnv());
      });
    });
  });
});
