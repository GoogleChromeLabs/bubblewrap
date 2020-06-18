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

import {join} from 'path';
import {homedir} from 'os';
import {existsSync} from 'fs';
import {loadOrCreateConfig} from '../lib/config';
import * as mock from 'mock-fs';

describe('config', () => {
  describe('#loadOrCreateConfig', () => {
    it('checks if the file\'s name was changed in case it has the old name', async () => {
      const dir = join(homedir(), '.llama-pack');
      // creates a mock file systes
      mock({
        [dir]: {
          'llama-pack-config.json': '{}',
        }});
      await loadOrCreateConfig();
      expect(existsSync(join(homedir(), '/.bubblewrap-config/bubblewrap-config.json'))).toBeTrue();
      expect(existsSync(join(homedir(), '/.llama-pack/llama-pack-config.json'))).toBeFalse();
      mock.restore();
    });
  });
});
