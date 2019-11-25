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

'use strict';

const fs = require('fs');
const prompt = require('prompt');
const colors = require('colors/safe');
const util = require('../util');
const {promisify} = require('util');
prompt.get = promisify(prompt.get);

/**
 * A Wrapper of the Java keytool command-line tool
 */
class KeyTool {
  constructor(jdkHelper) {
    this.jdkHelper = jdkHelper;
  }

  /**
   * Creates a new signing key.
   *
   * @param {path} keyPath where the generated key will be saved
   * @param {String} alias the alias to be used for the key
   */
  async createSigningKeyIfNeeded(keyPath, alias, overwrite = false) {
    // Checks if the key already exists and deletes it, if overriting is enabled.
    if (fs.existsSync(keyPath)) {
      if (overwrite) {
        await fs.promises.unlink(keyPath);
      } else {
        return;
      }
    }

    prompt.message = colors.green('[keytool]');
    prompt.delimiter = ' ';
    prompt.start();

    // Ask user for keystore details
    const schema = {
      properties: {
        cn: {
          name: 'cn',
          required: true,
          description: 'First and Last names (eg: John Doe):',
        },
        ou: {
          name: 'ou',
          required: true,
          description: 'Organizational Unit (eg: Engineering Dept):',
        },
        o: {
          name: 'o',
          required: true,
          description: 'Organization (eg: Company Name):',
        },
        c: {
          name: 'c',
          required: true,
          description: 'Country (2 letter code):',
        },
        password: {
          name: 'password',
          required: true,
          description: 'Password for the Key Store:',
          hidden: true,
          replace: '*',
        },
        keypassword: {
          name: 'keypassword',
          required: true,
          description: 'Password for the Key:',
          hidden: true,
          replace: '*',
        },
      },
    };
    const result = await prompt.get(schema);

    // Execute Java Keytool
    const keytoolCmd = [
      'keytool',
      '-genkeypair',
      `-dname "cn=${result.cn}, ou=${result.ou}, o=${result.o}}, c=${result.c}"`,
      `-alias ${alias}`,
      `-keypass ${result.keypassword}`,
      `-keystore ${keyPath}`,
      `-storepass ${result.password}`,
      '-validity 20000',
      '-keyalg RSA',
    ];
    const env = this.jdkHelper.getEnv();
    await util.execute(keytoolCmd, env);
    console.log('Signing Key created successfully');
  }
}

module.exports = KeyTool;
