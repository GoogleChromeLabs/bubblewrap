/*
 * Copyright 2020 Google Inc. All Rights Reserved.
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

import {loadOrCreateConfig} from '../lib/config';
import * as mock from 'mock-fs';
import {updateConfig} from '../lib/cmds/updateConfig';
import {MockLog} from '@bubblewrap/core';
import minimist = require('minimist');
import {doctor} from '../lib/cmds/doctor';
import {MockPrompt} from './mock/MockPrompt';
import {enUS as messages} from '../lib/strings';

describe('doctor', () => {
  describe('#jdkDoctor', () => {
    it('checks if a currect error is sent in case that the path given isn\'n valid', async () => {
      // Creates a mock file systes.
      mock({
        'old/path/to/jdk': {
          'release': 'JAVA_VERSION="1.8.3',
        },
        'old/path/to/sdk': {
          'tools': {},
        },
        'new/path/to/jdk': {},
      });
      const mockLog = new MockLog();
      const mockPrompt = new MockPrompt();
      // Since 'createConfig' will be called, we push 3 future answers to 'mockPrompt'.
      mockPrompt.addMessage('false'); // Should bubblewrap download the JDK?
      mockPrompt.addMessage('old/path/to/jdk'); // The path of the jdk.
      mockPrompt.addMessage('old/path/to/sdk'); // The path of the androidSdk.
      // Create config file.
      await loadOrCreateConfig(mockLog, mockPrompt);
      expect(await doctor(mockLog)).toBeTrue();
      // Change the jdkPath of the config file to a path which isn't a valid jdkPath.
      const parsedMockArgs = minimist(['--jdkPath', 'new/path/to/jdk']);
      await updateConfig(parsedMockArgs, mockLog);
      expect(await doctor(mockLog)).toBeFalse();
      // Check that the correct message was sent.
      const logErrors: Array<string> = mockLog.getReceivedData();
      expect(logErrors[logErrors.length - 1]).toEqual(messages.jdkPathIsNotCorrect);
      mock.restore();
    });

    it('checks if a currect error is sent in case that the jdk isn\'t supported', async () => {
      // Creates a mock file systes.
      mock({
        'path/to/jdk': {
          'release': 'JAVA_VERSION="1.8',
        },
        'path/to/sdk': {
          'tools': {},
        },
        'new/path/to/jdk': {
          'release': 'JAVA_VERSION="1.7',
        },
      });
      const mockLog = new MockLog();
      const mockPrompt = new MockPrompt();
      // Since 'createConfig' will be called, we push 3 future answers to 'mockPrompt'.
      mockPrompt.addMessage('false'); // Should bubblewrap download the JDK?
      mockPrompt.addMessage('path/to/jdk'); // The path of the jdk.
      mockPrompt.addMessage('path/to/sdk'); // The path of the androidSdk.
      // Create config file.
      await loadOrCreateConfig(mockLog, mockPrompt);
      // Change the jdkPath of the config file to a path which isn't a supported jdkPath.
      const parsedMockArgs = minimist(['--jdkPath', 'new/path/to/jdk']);
      await updateConfig(parsedMockArgs, mockLog);
      expect(await doctor(mockLog)).toBeFalse();
      // Check that the correct message was sent.
      const logErrors: Array<string> = mockLog.getReceivedData();
      expect(logErrors[logErrors.length - 1]).toEqual(messages.jdkIsNotSupported);
      mock.restore();
    });
  });

  describe('#androidSdkDoctor', () => {
    it('checks if a currect error is sent in case that the path given isn\'n valid', async () => {
      // Creates a mock file systes.
      mock({
        'old/path/to/jdk': {
          'release': 'JAVA_VERSION="1.8.3',
        },
        'old/path/to/sdk': {
          'tools': {},
        },
        'new/path/to/sdk': {},
      });
      const mockLog = new MockLog();
      const mockPrompt = new MockPrompt();
      // Since 'createConfig' will be called, we push 3 future answers to 'mockPrompt'.
      mockPrompt.addMessage('false'); // Should bubblewrap download the JDK?
      mockPrompt.addMessage('old/path/to/jdk'); // The path of the jdk.
      mockPrompt.addMessage('old/path/to/sdk'); // The path of the androidSdk.
      // Create config file.
      await loadOrCreateConfig(mockLog, mockPrompt);
      // Change the androidSdkPath of the config file to a path which isn't a valid jdkPath.
      const parsedMockArgs = minimist(['--androidSdkPath', 'new/path/to/sdk']);
      await updateConfig(parsedMockArgs, mockLog);
      expect(await doctor(mockLog)).toBeFalse();
      // Check that the correct message was sent.
      const logErrors: Array<string> = mockLog.getReceivedData();
      expect(logErrors[logErrors.length - 1]).toEqual(messages.androidSdkPathIsNotCorrect);
      mock.restore();
    });
  });
});
