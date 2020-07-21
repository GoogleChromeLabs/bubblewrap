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

import {JarSigner} from '../../../lib/jdk/JarSigner';
import {JdkHelper} from '../../../lib/jdk/JdkHelper';
import {Config} from '../../../lib/Config';
import {SigningKeyInfo} from '../../../lib/TwaManifest';
import * as util from '../../../lib/util';
import * as fs from 'fs';

const CWD = '/path/to/twa-project/';
const PROCESS = {
  platform: 'linux',
  env: {
    'PATH': '',
  },
  cwd: () => CWD,
} as unknown as NodeJS.Process;

const SIGNING_KEY_INFO: SigningKeyInfo = {
  path: '/path/to/keystore/',
  alias: 'myalias',
};

const STORE_PASS = 'mystorepass';
const KEY_PASS = 'mykeypass';
const INPUT_AAB = '/path/to/input.aab';
const OUTPUT_AAB = './output.aab';

describe('JarSigner', () => {
  describe('#sign', () => {
    it('Invokes the correct signing command', async () => {
      spyOn(fs, 'existsSync').and.returnValue(true);
      const config = new Config('/home/user/jdk8', '/home/user/sdktools');
      const jdkHelper = new JdkHelper(PROCESS, config);
      const jarSigner = new JarSigner(jdkHelper);

      spyOn(util, 'executeFile').and.stub();
      await jarSigner.sign(SIGNING_KEY_INFO, STORE_PASS, KEY_PASS, INPUT_AAB, OUTPUT_AAB);
      expect(util.executeFile).toHaveBeenCalledWith('jarsigner', [
        '-verbose',
        '-sigalg',
        'SHA256withRSA',
        '-digestalg',
        'SHA-256',
        '-keystore',
        SIGNING_KEY_INFO.path,
        INPUT_AAB,
        SIGNING_KEY_INFO.alias,
        '-storepass',
        STORE_PASS,
        '-keypass',
        KEY_PASS,
        '-signedjar',
        OUTPUT_AAB,
      ], jdkHelper.getEnv());
    });
  });
});
