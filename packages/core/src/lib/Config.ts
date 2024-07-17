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

import {promises as fs} from 'fs';
import {dirname} from 'path';

export class Config {
  jdkPath: string;
  androidSdkPath: string;

  constructor(jdkPath: string, androidSdkPath: string) {
    this.jdkPath = jdkPath;
    this.androidSdkPath = androidSdkPath;
  }

  serialize(): string {
    return JSON.stringify(this);
  }

  async saveConfig(path: string): Promise<void> {
    await fs.mkdir(dirname(path), {recursive: true});
    await fs.writeFile(path, this.serialize());
  }

  static deserialize(data: string): Config {
    const config = JSON.parse(data);
    return new Config(config.jdkPath, config.androidSdkPath);
  }

  static async loadConfig(path: string): Promise<Config | undefined> {
    try {
      const data = await fs.readFile(path, 'utf8');
      return Config.deserialize(data);
    } catch (err) {
      if (err instanceof Error) {
        // If config file does not exist
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
      }
      throw err;
    }
  }
}
