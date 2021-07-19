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

import {join} from 'path';
import {homedir} from 'os';
import {existsSync} from 'fs';
import {promises as fsPromises} from 'fs';
import {loadOrCreateConfig} from '../lib/config';
import {MockLog, JdkHelper, Result, AndroidSdkTools} from '@bubblewrap/core';
import * as mock from 'mock-fs';
import {MockPrompt} from './mock/MockPrompt';

const DEFAULT_CONFIG_FOLDER = join(homedir(), '.bubblewrap');
const DEFAULT_CONFIG_NAME = 'config.json';
const DEFAULT_CONFIG_FILE_PATH = join(DEFAULT_CONFIG_FOLDER, DEFAULT_CONFIG_NAME);
const LEGACY_CONFIG_FOLDER = join(homedir(), '.llama-pack');
const LEGACY_CONFIG_NAME = 'llama-pack-config.json';
const LEGACY_CONFIG_FILE_PATH = join(LEGACY_CONFIG_FOLDER, LEGACY_CONFIG_NAME);

describe('config', () => {
  describe('#loadOrCreateConfig', () => {
    beforeAll(() => {
      spyOn(JdkHelper, 'validatePath').and.returnValue(Promise.resolve(Result.ok('/path/to/jdk')));
      spyOn(AndroidSdkTools, 'validatePath').and.returnValue(Promise.resolve(Result.ok(
          '/path/to/android-sdk')));
    });

    it('checks if the file\'s name was changed in case it has the old name', async () => {
      // Creates a mock file system.
      mock({
        [LEGACY_CONFIG_FOLDER]: {
          'llama-pack-config.json': '{"jdkPath":"/path/to/jdk","androidSdkPath":"/path/to/android-sdk"}',
        }});
      const mockLog = new MockLog();
      await loadOrCreateConfig(mockLog);
      // Checks if the file name was changed.
      expect(existsSync(DEFAULT_CONFIG_FILE_PATH)).toBeTrue();
      expect(existsSync(LEGACY_CONFIG_FILE_PATH)).toBeFalse();
      // Checks that the old folder was deleted.
      expect(existsSync(LEGACY_CONFIG_FOLDER)).toBeFalse();
      mock.restore();
    });

    it('checks if the old config folder isn\'t deleted in case there are other files there'
        , async () => {
          // Creates a mock file systes.
          mock({
            [LEGACY_CONFIG_FOLDER]: {
              'llama-pack-config.json': '{"jdkPath":"/path/to/jdk","androidSdkPath":"/path/to/android-sdk"}',
              'another file.exe': '{}',
            }});
          const mockLog = new MockLog();
          await loadOrCreateConfig(mockLog);
          // Checks if the file name was changed.
          expect(existsSync(DEFAULT_CONFIG_FILE_PATH)).toBeTrue();
          expect(existsSync(LEGACY_CONFIG_FILE_PATH)).toBeFalse();
          // Checks that the old folder was not deleted.
          expect(existsSync(LEGACY_CONFIG_FOLDER)).toBeTrue();
          mock.restore();
        });

    it('checks if a config file is created in case there is no config file', async () => {
      // Creates a mock file systes.
      mock({
        [homedir()]: {},
      });
      const mockLog = new MockLog();
      const mockPrompt = new MockPrompt();
      // Since 'createConfig' will be called, we push 3 future answers to 'mockPrompt'.
      mockPrompt.addMessage('false'); // Should bubblewrap download the JDK?
      mockPrompt.addMessage('jdk'); // The path of the jdk. (not really used).
      mockPrompt.addMessage('false'); // Should bubblewrap download Android SDK?
      mockPrompt.addMessage('sdk'); // The path of the androidSdk. (not really used).
      await loadOrCreateConfig(mockLog, mockPrompt);
      // Checks if the file name was created.
      expect(existsSync(DEFAULT_CONFIG_FILE_PATH)).toBeTrue();
      mock.restore();
    });

    it('checks if both of the files exists in case there are old and new config files',
        async () => {
          // Creates a mock file systes.
          mock({
            [LEGACY_CONFIG_FOLDER]: {
              'llama-pack-config.json': '{"content":"some old content", "jdkPath":"/path/to/jdk","androidSdkPath":"/path/to/android-sdk"}',
            },
            [DEFAULT_CONFIG_FOLDER]: {
              'config.json': '{"content":"some old content", "jdkPath":"/path/to/jdk","androidSdkPath":"/path/to/android-sdk"}',
            }});
          const mockLog = new MockLog();
          await loadOrCreateConfig(mockLog);
          // Checks if both of the files exists.
          expect(existsSync(DEFAULT_CONFIG_FILE_PATH)).toBeTrue();
          expect(existsSync(LEGACY_CONFIG_FILE_PATH)).toBeTrue();
          // checks if the contents of the files didn't change.
          const file1 = await fsPromises.readFile(LEGACY_CONFIG_FILE_PATH, 'utf8');
          const file2 = await fsPromises.readFile(DEFAULT_CONFIG_FILE_PATH, 'utf8');
          expect(file1).toEqual('{\"content\":\"some old content\"}');
          expect(file2).toEqual('{\"content\":\"some new content\"}');
          mock.restore();
        });
  });
});
