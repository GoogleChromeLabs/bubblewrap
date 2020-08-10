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
import * as fs from 'fs';
import {ConsoleLog} from '../../..';

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
  describe('#constructor', () => {
    it('Throws Error when the path to AndroidSdkHome doesn\'t exist', () => {
      spyOn(fs, 'existsSync').and.returnValue(false);
      const config = buildMockConfig('linux');
      const process = buildMockProcess('linux');
      const jdkHelper = new JdkHelper(process, config);
      expect(() => {
        new AndroidSdkTools(process, config, jdkHelper);
      }).toThrowError();
    });
  });

  describe('#getEnv()', () => {
    const tests = [
      {platform: 'linux', expectedAndroidHome: '/home/user/android-sdk/'},
      {platform: 'darwin', expectedAndroidHome: '/home/user/android-sdk/'},
      {platform: 'win32', expectedAndroidHome: 'C:\\Users\\user\\android-sdk\\'},
    ];

    tests.forEach((test) => {
      it(`Sets the correct ANDROID_HOME on ${test.platform}`, () => {
        spyOn(fs, 'existsSync').and.returnValue(true);
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
        expectedCwd: 'C:\\Users\\user\\android-sdk\\tools\\bin\\sdkmanager.bat'},
    ];

    tests.forEach((test) => {
      it(`Build the correct command-line on ${test.platform}`, async () => {
        spyOn(fs, 'existsSync').and.returnValue(true);
        const config = buildMockConfig(test.platform);
        const process = buildMockProcess(test.platform);
        const jdkHelper = new JdkHelper(process, config);
        const androidSdkTools = new AndroidSdkTools(process, config, jdkHelper);
        spyOn(util, 'execInteractive').and.stub();
        await androidSdkTools.installBuildTools();
        expect(util.execInteractive).toHaveBeenCalledWith(
            test.expectedCwd,
            ['--install', '"build-tools;29.0.2"', `--sdk_root=${test.expectedSdkRoot}`],
            androidSdkTools.getEnv());
      });
    });

    it('Throws an Error when sdkmanager doesn\'t exist in the filesystem', () => {
      const fsSpy = spyOn(fs, 'existsSync');

      // Set existsSync to return true so the AndroidSdkTools can be created.
      fsSpy.and.returnValue(true);
      const config = buildMockConfig(tests[0].platform);
      const process = buildMockProcess(tests[0].platform);
      const jdkHelper = new JdkHelper(process, config);
      const androidSdkTools = new AndroidSdkTools(process, config, jdkHelper);

      // Set existsSync to return false so check for sdkmanager fails.
      fsSpy.and.returnValue(false);
      expectAsync(androidSdkTools.installBuildTools()).toBeRejectedWithError();
    });
  });

  describe('#install', () => {
    const tests = [
      {platform: 'linux',
        expectedCwd: [
          '"/home/user/android-sdk/platform-tools/adb"',
          'install',
          '-r',
          'app-release-signed.apk',
        ]},
      {platform: 'darwin',
        expectedCwd: [
          '"/home/user/android-sdk/platform-tools/adb"',
          'install',
          '-r',
          'app-release-signed.apk',
        ]},
      {platform: 'win32',
        expectedCwd: [
          '"C:\\Users\\user\\android-sdk\\platform-tools\\adb"',
          'install',
          '-r',
          'app-release-signed.apk',
        ]},
    ];

    tests.forEach((test) => {
      it(`Build the correct install command on ${test.platform}`, async () => {
        spyOn(fs, 'existsSync').and.returnValue(true);
        const config = buildMockConfig(test.platform);
        const process = buildMockProcess(test.platform);
        const jdkHelper = new JdkHelper(process, config);
        const log = new ConsoleLog('test');
        const androidSdkTools = new AndroidSdkTools(process, config, jdkHelper, log);
        spyOn(util, 'execute').and.stub();
        await androidSdkTools.install('app-release-signed.apk');
        expect(util.execute).toHaveBeenCalledWith(test.expectedCwd, androidSdkTools.getEnv(), log);
      });
    });

    it('Throws an error when the APK file name doesn\'t exist', () => {
      const fsSpy = spyOn(fs, 'existsSync');
      fsSpy.and.returnValue(true);

      const config = buildMockConfig(tests[0].platform);
      const process = buildMockProcess(tests[0].platform);
      const jdkHelper = new JdkHelper(process, config);
      const androidSdkTools = new AndroidSdkTools(process, config, jdkHelper);
      fsSpy.and.returnValue(false);
      expectAsync(androidSdkTools.install('./app-release-signed.apk')).toBeRejectedWithError();
    });
  });

  describe('#apksigner', () => {
    const tests = [
      {platform: 'linux',
        expectedCmd: '/home/user/android-sdk/build-tools/29.0.2/apksigner',
        expectedArgs: [
          'sign', '--ks', '/path/to/keystore.ks',
          '--ks-key-alias', 'alias',
          '--ks-pass', 'pass:kspass',
          '--key-pass', 'pass:keypass',
          '--out', 'signed.apk',
          'unsigned.apk',
        ]},
      {platform: 'darwin',
        expectedCmd: '/home/user/android-sdk/build-tools/29.0.2/apksigner',
        expectedArgs: [
          'sign', '--ks', '/path/to/keystore.ks',
          '--ks-key-alias', 'alias',
          '--ks-pass', 'pass:kspass',
          '--key-pass', 'pass:keypass',
          '--out', 'signed.apk',
          'unsigned.apk',
        ]},
      {platform: 'win32',
        expectedCmd: 'C:\\Users\\user\\jdk8\\bin\\java.exe',
        expectedArgs: [
          '-Xmx1024M',
          '-Xss1m',
          '-jar',
          'C:\\Users\\user\\android-sdk\\build-tools\\29.0.2\\lib\\apksigner.jar',
          'sign', '--ks', '/path/to/keystore.ks',
          '--ks-key-alias', 'alias',
          '--ks-pass', 'pass:kspass',
          '--key-pass', 'pass:keypass',
          '--out', 'signed.apk',
          'unsigned.apk',
        ]},
    ];

    tests.forEach((test) => {
      it(`Build the correct apksigner command on ${test.platform}`, async () => {
        spyOn(fs, 'existsSync').and.returnValue(true);
        const config = buildMockConfig(test.platform);
        const process = buildMockProcess(test.platform);
        const jdkHelper = new JdkHelper(process, config);
        const log = new ConsoleLog('test');
        const androidSdkTools = new AndroidSdkTools(process, config, jdkHelper, log);
        spyOn(util, 'executeFile').and.stub();
        await androidSdkTools.apksigner(
            '/path/to/keystore.ks', 'kspass', 'alias', 'keypass', 'unsigned.apk', 'signed.apk');
        const expectedEnv = test.platform === 'win32' ?
            jdkHelper.getEnv() : androidSdkTools.getEnv();
        expect(util.executeFile).toHaveBeenCalledWith(
            test.expectedCmd, test.expectedArgs, expectedEnv);
      });
    });
  });
});
