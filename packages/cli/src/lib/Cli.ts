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
import {update} from './cmds/update';
import {help} from './cmds/help';
import {build} from './cmds/build';
import {init} from './cmds/init';
import {validate} from './cmds/validate';
import {loadOrCreateConfig} from './config';

export class Cli {
  async run(args: string[]): Promise<void> {
    const config = await loadOrCreateConfig();

    const parsedArgs = minimist(args);
    const command = args[0] || 'help';
    switch (command) {
      case 'help':
        return await help(parsedArgs);
      case 'init':
        return await init(parsedArgs, config);
      case 'update':
        return await update(parsedArgs);
      case 'build':
        return await build(config);
      case 'validate':
        return await validate(parsedArgs);
      default:
        throw new Error(`"${command}" is not a valid command!`);
    }
  }
}
