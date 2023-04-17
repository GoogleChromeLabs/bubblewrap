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

import * as mock from 'mock-fs';
import {MockLog} from '@bubblewrap/core';
import {doctor} from '../lib/cmds/doctor';
import {enUS as messages} from '../lib/strings';

describe('doctor', () => {
  describe('#jdkDoctor', () => {
    it('checks that the expected error message is sent in case that the path given isn\'t' +
        ' valid', async () => {
      // Creates a mock file system.
      mock({
        'path/to/sdk': {
          'tools': {},
        },
        'path/to/config': '{"jdkPath":"path/to/jdk","androidSdkPath":"path/to/sdk"}',
      });

      const mockLog = new MockLog();
      await expectAsync(doctor(mockLog, 'path/to/config')).toBeResolvedTo(false);
      // Check that the correct message was sent.
      const logErrors: Array<string> = mockLog.getReceivedData();
      const lastMessage = logErrors[logErrors.length - 1];
      expect(lastMessage.indexOf('jdkPath isn\'t correct')).toBeGreaterThanOrEqual(0);
      mock.restore();
    });

  //   it('checks that the expected error message is sent in case that the jdk isn\'t' +
  //       ' supported', async () => {
  //     // Creates a mock file system.
  //     mock({
  //       'path/to/jdk': {
  //         'release': 'JAVA_VERSION="1.8',
  //       },
  //       'path/to/sdk': {
  //         'tools': {},
  //       },
  //       'path/to/config': '{"jdkPath":"path/to/jdk","androidSdkPath":"path/to/sdk"}',
  //     });

  //     const mockLog = new MockLog();
  //     await expectAsync(doctor(mockLog, 'path/to/config')).toBeResolvedTo(false);
  //     // Check that the correct message was sent.
  //     const logErrors: Array<string> = mockLog.getReceivedData();
  //     const lastMessage = logErrors[logErrors.length - 1];
  //     expect(lastMessage.indexOf('Unsupported jdk version')).toBeGreaterThanOrEqual(0);
  //     mock.restore();
  //   });
  // });

  describe('#androidSdkDoctor', () => {
    it('checks that the expected error message is sent in case that the path given isn\'t' +
        ' valid', async () => {
      // Creates a mock file system.
      mock({
        'path/to/jdk': {
          'release': 'JAVA_VERSION="1.8',
        },
        'path/to/config': '{"jdkPath":"path/to/jdk","androidSdkPath":"path/to/sdk"}',
      });

      const mockLog = new MockLog();

      await expectAsync(doctor(mockLog, 'path/to/config')).toBeResolvedTo(false);

      // Check that the correct message was sent.
      const logErrors: Array<string> = mockLog.getReceivedData();
      expect(logErrors[logErrors.length - 1]).toEqual(messages.androidSdkPathIsNotCorrect);
      mock.restore();
    });
  });
});
