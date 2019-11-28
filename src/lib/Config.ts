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

const {promisify} = require('util');
const fs = require('fs');
const homedir = require('os').homedir();
const path = require('path');
const fileExists = promisify(fs.exists);
const userPrompt = require('prompt');
userPrompt.get = promisify(userPrompt.get);

const CONFIG_FILE_NAME = path.join(homedir, '/.llama-pack/llama-pack-config.json');

export class Config {
  jdkPath: string ;
  androidSdkPath: string;

  constructor(jdkPath: string, androidSdkPath: string) {
    this.jdkPath = jdkPath;
    this.androidSdkPath = androidSdkPath;
  }

  async saveConfig() {
    await fs.promises.mkdir(path.join(homedir, '/.llama-pack'));
    await fs.promises.writeFile(CONFIG_FILE_NAME, JSON.stringify(this));
  }

  async check() {
    if (!await fileExists(this.jdkPath)) {
      throw new Error(`${this.jdkPath} does not exist. Check the jdkPath on your config`);
    }
    if (!await fileExists(this.androidSdkPath)) {
      throw new Error(
          `${this.androidSdkPath} does not exist. Check the androidSdkPath on your config`);
    };
  }

  static async createConfig(): Promise<Config> {
    const schema = {
      properties: {
        jdkPath: {
          name: 'jdkPath',
          description: 'Path to the JDK:',
          required: true,
          conform: fs.existsSync,
        },
        androidSdkPath: {
          name: 'androidSdkPath',
          description: 'Path to the Android SDK:',
          required: true,
          conform: fs.existsSync,
        },
      },
    };
    const result = await userPrompt.get(schema);
    return new Config(result.jdkPath, result.androidSdkPath);
  }

  static async loadConfig(): Promise<Config | null> {
    if (!await fileExists(CONFIG_FILE_NAME)) {
      return null;
    }
    const config = JSON.parse(await fs.promises.readFile(CONFIG_FILE_NAME));
    return new Config(config.jdkPath, config.androidSdkPath);
  }

  static async loadOrCreate(): Promise<Config> {
    let config: Config | null = await Config.loadConfig();
    if (config == null) {
      config = await Config.createConfig();
      await config.saveConfig();
    }
    return config;
  }
}
