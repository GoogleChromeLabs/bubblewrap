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
import {Log, ConsoleLog} from '../Log';

export interface KeyInfo {
  fingerprints: Map<string, string>;
}

export interface KeyOptions {
  path: string;
  alias: string;
  keypassword: string;
  password: string;
}

export interface CreateKeyOptions extends KeyOptions {
  fullName: string;
  organizationalUnit: string;
  organization: string;
  country: string;
}

/**
 * A Wrapper of the Java keytool command-line tool
 */
export class KeyTool {
  private jdkHelper: JdkHelper;
  private log: Log;

  constructor(jdkHelper: JdkHelper, log: Log = new ConsoleLog('keytool')) {
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
      `-dname "cn=${KeyTool.escapeDName(keyOptions.fullName)}, ` +
          `ou=${KeyTool.escapeDName(keyOptions.organizationalUnit)}, ` +
          `o=${KeyTool.escapeDName(keyOptions.organization)}, ` +
          `c=${KeyTool.escapeDName(keyOptions.country)}"`,
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

  /**
   * Runs `keytool --list` on the keystore / alias provided on the {@link KeyOptions}.
   *
   * @param {KeyOptions} keyOptions parameters for they key to be listed.
   * @returns {Promise<string>} the raw output of the `keytool --list` command
   */
  async list(keyOptions: KeyOptions): Promise<string> {
    if (!existsSync(keyOptions.path)) {
      throw new Error(`Couldn't find signing key at "${keyOptions.path}"`);
    }
    const keyListCmd = [
      'keytool',
      // Forces the language to 'en' in order to get the expected formatting.
      // The JVM seems to ignore the LANG and LC_ALL variables, so we set the value
      // when invoking the command. See https://github.com/GoogleChromeLabs/bubblewrap/issues/446
      // for more.
      '-J-Duser.language=en',
      '-list',
      '-v',
      `-keystore \"${keyOptions.path}\"`,
      `-alias \"${keyOptions.alias}\"`,
      `-storepass \"${keyOptions.password}\"`,
      `-keypass \"${keyOptions.keypassword}\"`,
    ];
    const env = this.jdkHelper.getEnv();
    const result = await execute(keyListCmd, env);
    return result.stdout;
  }

  /**
   * Runs `keytool --list` on the keystore / alias provided on the {@link KeyOptions}. Currently,
   * only extracting fingerprints is implemented.
   *
   * @param {KeyOptions} keyOptions parameters for they key to be listed.
   * @returns {Promise<KeyInfo>} the parsed output of the `keytool --list` command
   */
  async keyInfo(keyOptions: KeyOptions): Promise<KeyInfo> {
    const rawKeyInfo = await this.list(keyOptions);
    return KeyTool.parseKeyInfo(rawKeyInfo);
  }

  /**
   * The commas in the dname field from key tool must be escaped, so that 'te,st' becomes 'te\,st'.
   */
  private static escapeDName(input: string): string {
    return input.replace(/,/g, '\\,');
  }

  /**
   * Parses the output of `keytool --list` and returns a structured {@link KeyInfo}. Currently,
   * only extracts the fingerprints.
   */
  static parseKeyInfo(rawKeyInfo: string): KeyInfo {
    const lines = rawKeyInfo.split('\n');
    const fingerprints: Map<string, string> = new Map();
    const fingerprintTags = ['SHA1', 'SHA256'];

    lines.forEach((line) => {
      line = line.trim();
      fingerprintTags.forEach((tag) => {
        if (line.startsWith(tag)) {
          // a fingerprint line has the format <tag>: <value>. So, we account for the extra colon
          // when substringing and then trim to remove whitespaces.
          const value = line.substring(tag.length + 1, line.length).trim();
          fingerprints.set(tag, value);
        }
      });
    });
    return {
      fingerprints: fingerprints,
    } as KeyInfo;
  }
}
