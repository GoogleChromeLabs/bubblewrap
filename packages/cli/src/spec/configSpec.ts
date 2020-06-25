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
import * as mock from 'mock-fs';
import * as inquirer from 'inquirer';

const DEFAULT_CONFIG_FOLDER = join(homedir(), '.bubblewrap-config');
const DEFAULT_CONFIG_NAME = 'bubblewrap-config.json';
const LEGACY_CONFIG_FOLDER = join(homedir(), '.llama-pack');
const LEGACY_CONFIG_NAME = 'llama-pack-config.json';

beforeAll(() => {
  const fakeResult = Promise.resolve({
    jdkPath: '/path/to/jdk',
    androidSdkPath: '/path/to/android-sdk',
  }) as any; // eslint-disable-line @typescript-eslint/no-explicit-any
  spyOn(inquirer, 'prompt').and.returnValue(fakeResult);
});


describe('config', () => {
  describe('#loadOrCreateConfig', () => {
    it('checks if the file\'s name was changed in case it has the old name', async () => {
      // creates a mock file systes
      mock({
        [LEGACY_CONFIG_FOLDER]: {
          'llama-pack-config.json': '{}',
        }});
      await loadOrCreateConfig();
      // checks if the file name was changed
      expect(existsSync(join(DEFAULT_CONFIG_FOLDER, DEFAULT_CONFIG_NAME))).toBeTrue();
      expect(existsSync(join(LEGACY_CONFIG_FOLDER, LEGACY_CONFIG_NAME))).toBeFalse();
      // checks that the old folder was deleted
      expect(existsSync(LEGACY_CONFIG_FOLDER)).toBeFalse();
      mock.restore();
    });

    it('checks if the old config folder isn\'t deleted in case there are other files there'
        , async () => {
          // creates a mock file systes
          mock({
            [LEGACY_CONFIG_FOLDER]: {
              'llama-pack-config.json': '{}',
              'another file.exe': '{}',
            }});
          await loadOrCreateConfig();
          // checks if the file name was changed
          expect(existsSync(join(DEFAULT_CONFIG_FOLDER, DEFAULT_CONFIG_NAME))).toBeTrue();
          expect(existsSync(join(LEGACY_CONFIG_FOLDER, LEGACY_CONFIG_NAME))).toBeFalse();
          // checks that the old folder was not deleted
          expect(existsSync(LEGACY_CONFIG_FOLDER)).toBeTrue();
          mock.restore();
        });

    it('checks if a config file is created in case there is no config file', async () => {
      // creates a mock file systes
      mock({
        [homedir()]: {},
      });
      await loadOrCreateConfig();
      // checks if the file name was changed
      expect(existsSync(join(DEFAULT_CONFIG_FOLDER, DEFAULT_CONFIG_NAME))).toBeTrue();
      mock.restore();
    });

    it('checks if both of the files exists in case there are old and new config files'
        , async () => {
          // creates a mock file systes
          mock({
            [LEGACY_CONFIG_FOLDER]: {
              'llama-pack-config.json': '{"content":"some old content"}',
            },
            [DEFAULT_CONFIG_FOLDER]: {
              'bubblewrap-config.json': '{"content":"some new content"}',
            }});
          await loadOrCreateConfig();
          // checks if the file name was changed
          expect(existsSync(join(DEFAULT_CONFIG_FOLDER, DEFAULT_CONFIG_NAME))).toBeTrue();
          expect(existsSync(join(LEGACY_CONFIG_FOLDER, LEGACY_CONFIG_NAME))).toBeTrue();
          const file1 =await fsPromises.readFile(
              join(LEGACY_CONFIG_FOLDER, LEGACY_CONFIG_NAME), 'utf8');
          const file2 =await fsPromises.readFile(
              join(DEFAULT_CONFIG_FOLDER, DEFAULT_CONFIG_NAME), 'utf8');
          expect(file1).toEqual('{\"content\":\"some old content\"}');
          expect(file2).toEqual('{\"content\":\"some new content\"}');
          mock.restore();
        });
  });
});
