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

import * as minimist from 'minimist';
import * as fs from 'fs';
import * as path from 'path';
import {update} from './cmds/update';
import {help} from './cmds/help';
import {build} from './cmds/build';
import {init} from './cmds/init';
import {validate} from './cmds/validate';
import {install} from './cmds/install';
import {loadOrCreateConfig} from './config';
import {major} from 'semver';

export class Cli {
  async run(args: string[]): Promise<boolean> {
    if (major(process.versions.node) < 10) {
      throw new Error(`Current Node.js version is ${process.versions.node}.` +
          ' Node.js version 10 or above is required to run bubblewrap.');
    }
    const config = await loadOrCreateConfig();

    const parsedArgs = minimist(args);

    let command;
    if (parsedArgs._.length === 0) {
      // Accept --version and --help alternatives for the help and version commands.
      if (parsedArgs.version) {
        command = 'version';
      } else if (parsedArgs.help) {
        command = 'help';
      }
    } else {
      command = parsedArgs._[0];
    }

    switch (command) {
      case 'help':
        return await help(parsedArgs);
      case 'init':
        return await init(parsedArgs, config);
      case 'update':
        return await update(parsedArgs);
      case 'build':
        return await build(config, parsedArgs);
      case 'validate':
        return await validate(parsedArgs);
      case 'version': {
        const packageJsonFile = path.join(__dirname, '../../package.json');
        const packageJsonContents = await (await fs.promises.readFile(packageJsonFile)).toString();
        const packageJson = JSON.parse(packageJsonContents);
        console.log(packageJson.version);
        return true;
      }
      case 'install':
        return await install(parsedArgs, config);
      default:
        throw new Error(
            `"${command}" is not a valid command! Use 'bubblewrap help' for a list of commands`);
    }
  }
}
