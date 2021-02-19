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

import {KeyTool, CreateKeyOptions, KeyOptions} from '../../../lib/jdk/KeyTool';
import {Config} from '../../../lib/Config';
import util = require('../../../lib/util');
import {JdkHelper} from '../../../lib/jdk/JdkHelper';
import * as fs from 'fs';
import {MockLog} from '../../..';

const SHA1 = '38:03:D6:95:91:7C:9C:EE:4A:A0:58:43:A7:43:A5:D2:76:52:EF:9B';
const SHA256 = 'F5:08:9F:8A:D4:C8:4A:15:6D:0A:B1:3F:61:96:BE:C7:87:8C:DE:05:59:92:B2:A3:2D:05:' +
    '05:A5:62:A5:2F:34';

const LIST_OUTPUT = `Alias name: key0
Creation date: 28 Jan 2019
Entry type: PrivateKeyEntry
Certificate chain length: 1
Certificate[1]:
Owner: CN=Test Test, OU=Test, O=Test, L=London, ST=London, C=GB
Issuer: CN=Test Test, OU=Test, O=Test, L=London, ST=London, C=GB
Serial number: ea67d3d
Valid from: Mon Jan 28 14:58:00 GMT 2019 until: Fri Jan 22 14:58:00 GMT 2044
Certificate fingerprints:
   SHA1: ${SHA1}
   SHA256: ${SHA256}
Signature algorithm name: SHA256withRSA
Subject Public Key Algorithm: 2048-bit RSA key
Version: 3
`;

describe('KeyTool', () => {
  const config = new Config('/home/user/jdk8', '/home/user/sdktools');
  const process = {
    platform: 'linux',
    env: {
      'PATH': '',
    },
  } as unknown as NodeJS.Process;
  const jdkHelper = new JdkHelper(process, config);

  describe('#createSigningKey', () => {
    const keyOptions = {
      path: '/',
      alias: 'keyalias',
      keypassword: 'keypass',
      password: 'pass',
      fullName: 'Test, User',
      organization: 'Test, Organization',
      organizationalUnit: 'Tes,ters',
      country: 'GB',
    } as CreateKeyOptions;

    it('Executes the correct command to create a key', async () => {
      const keyTool = new KeyTool(jdkHelper, new MockLog());
      spyOn(fs, 'existsSync').and.returnValue(false);
      spyOn(util, 'execute').and.stub();
      await keyTool.createSigningKey(keyOptions);
      expect(util.execute).toHaveBeenCalledWith([
        'keytool',
        '-genkeypair',
        '-dname "cn=Test\\, User, ou=Tes\\,ters, ' +
            `o=Test\\, Organization, c=${keyOptions.country}"`,
        `-alias "${keyOptions.alias}"`,
        `-keypass "${keyOptions.keypassword}"`,
        `-keystore "${keyOptions.path}"`,
        `-storepass "${keyOptions.password}"`,
        '-validity 20000',
        '-keyalg RSA',
      ], jdkHelper.getEnv());
    });

    it('Skips creation when a key already exists', async () => {
      const keyTool = new KeyTool(jdkHelper, new MockLog());
      spyOn(fs, 'existsSync').and.returnValue(true);
      spyOn(util, 'execute').and.stub();
      await keyTool.createSigningKey(keyOptions);
      expect(util.execute).not.toHaveBeenCalled();
    });

    it('Deletes and writes a new key when overwrite = true', async () => {
      const keyTool = new KeyTool(jdkHelper, new MockLog());
      spyOn(fs, 'existsSync').and.returnValue(true);
      spyOn(fs.promises, 'unlink').and.resolveTo();
      spyOn(util, 'execute').and.stub();
      await keyTool.createSigningKey(keyOptions, true);
      expect(fs.promises.unlink).toHaveBeenCalledWith(keyOptions.path);
      expect(util.execute).toHaveBeenCalled();
    });
  });

  describe('#list', () => {
    const keyOptions = {
      path: '/',
      alias: 'keyalias',
      keypassword: 'keypass',
      password: 'pass',
    } as KeyOptions;

    it('Executes the correct command to list keys', async () => {
      const keyTool = new KeyTool(jdkHelper, new MockLog());
      spyOn(fs, 'existsSync').and.returnValue(true);
      spyOn(util, 'execute').and.resolveTo({stdout: '', stderr: ''});
      await keyTool.list(keyOptions);
      expect(util.execute).toHaveBeenCalledWith([
        'keytool',
        '-J-Duser.language=en',
        '-list',
        '-v',
        '-keystore "/"',
        '-alias "keyalias"',
        '-storepass "pass"',
        '-keypass "keypass"',
      ], jdkHelper.getEnv());
    });

    it('Throws error if keyOptions.path doesn\'t exist', async () => {
      const keyTool = new KeyTool(jdkHelper, new MockLog());
      spyOn(fs, 'existsSync').and.returnValue(false);
      await expectAsync(keyTool.list(keyOptions)).toBeRejectedWithError();
    });
  });

  describe('#parseKeyInfo', () => {
    it('parses fingerprints', () => {
      const keyInfo = KeyTool.parseKeyInfo(LIST_OUTPUT);
      expect(keyInfo.fingerprints.size).toBe(2);
      expect(keyInfo.fingerprints.get('SHA1')).toBe(SHA1);
      expect(keyInfo.fingerprints.get('SHA256')).toBe(SHA256);
    });
  });
});
