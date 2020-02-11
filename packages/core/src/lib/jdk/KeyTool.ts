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

import {existsSync, promises} from 'fs';
import {execute} from '../util';
import {JdkHelper} from './JdkHelper';
import Log from '../Log';

export interface CreateKeyOptions {
  path: string;
  alias: string;
  fullName: string;
  organizationalUnit: string;
  organization: string;
  country: string;
  keypassword: string;
  password: string;
}
/**
 * A Wrapper of the Java keytool command-line tool
 */
export class KeyTool {
  private jdkHelper: JdkHelper;
  private log: Log;

  constructor(jdkHelper: JdkHelper, log = new Log('keytool')) {
    this.jdkHelper = jdkHelper;
    this.log = log;
  }

  /**
   * Creates a new signing key.
   *
   * @param {CreateKeyOptions} keyOptions arguments to use to generate the key.
   * @param {boolean} overwrite true if an existing key should be overwriten.
   * @returns {Promise<void>}
   */
  async createSigningKey(keyOptions: CreateKeyOptions, overwrite = false): Promise<void> {
    this.log.debug('Generating Signature with keyOptions:', JSON.stringify(keyOptions));

    // Checks if the key already exists and deletes it, if overriting is enabled.
    if (existsSync(keyOptions.path)) {
      if (overwrite) {
        await promises.unlink(keyOptions.path);
      } else {
        return;
      }
    }

    // Execute Java Keytool
    const keytoolCmd = [
      'keytool',
      '-genkeypair',
      `-dname "cn=${keyOptions.fullName}, ou=${keyOptions.organizationalUnit}, ` +
          `o=${keyOptions.organization}, c=${keyOptions.country}"`,
      `-alias \"${keyOptions.alias}\"`,
      `-keypass \"${keyOptions.keypassword}\"`,
      `-keystore \"${keyOptions.path}\"`,
      `-storepass \"${keyOptions.password}\"`,
      '-validity 20000',
      '-keyalg RSA',
    ];
    const env = this.jdkHelper.getEnv();
    await execute(keytoolCmd, env);
    this.log.info('Signing Key created successfully');
  }
}
