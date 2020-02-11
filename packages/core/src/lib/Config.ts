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

import {promisify} from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as inquirer from 'inquirer';

const homedir = os.homedir();
const fileExists = promisify(fs.exists);

const CONFIG_FILE_NAME = path.join(homedir, '/.llama-pack/llama-pack-config.json');

export class Config {
  jdkPath: string ;
  androidSdkPath: string;

  constructor(jdkPath: string, androidSdkPath: string) {
    this.jdkPath = jdkPath;
    this.androidSdkPath = androidSdkPath;
  }

  async saveConfig(): Promise<void> {
    await fs.promises.mkdir(path.join(homedir, '/.llama-pack'), {recursive: true});
    await fs.promises.writeFile(CONFIG_FILE_NAME, JSON.stringify(this));
  }

  async check(): Promise<void> {
    if (!await fileExists(this.jdkPath)) {
      throw new Error(`${this.jdkPath} does not exist. Check the jdkPath on your config`);
    }
    if (!await fileExists(this.androidSdkPath)) {
      throw new Error(
          `${this.androidSdkPath} does not exist. Check the androidSdkPath on your config`);
    };
  }

  static async createConfig(): Promise<Config> {
    // TODO(andreban): Move this prompt from '/lib' to '/cli'.
    const result = await inquirer.prompt([
      {
        name: 'jdkPath',
        message: 'Path to the JDK:',
        validate: fs.existsSync,
      }, {
        name: 'androidSdkPath',
        message: 'Path to the Android SDK:',
        validate: fs.existsSync,
      },
    ]);
    return new Config(result.jdkPath, result.androidSdkPath);
  }

  static async loadConfig(): Promise<Config> {
    const config = JSON.parse((await fs.promises.readFile(CONFIG_FILE_NAME)).toString());
    return new Config(config.jdkPath, config.androidSdkPath);
  }

  static async loadOrCreate(): Promise<Config> {
    if (await fileExists(CONFIG_FILE_NAME)) {
      return await Config.loadConfig();
    }
    const config = await Config.createConfig();
    await config.saveConfig();
    return config;
  }
}
