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
import {init, InitArgs} from './cmds/init';
import {validate} from './cmds/validate';
import {install} from './cmds/install';
import {loadOrCreateConfig} from './config';
import {major} from 'semver';
import {version} from './cmds/version';
import {BUBBLEWRAP_LOGO} from './constants';
import {updateConfig} from './cmds/updateConfig';
import {doctor} from './cmds/doctor';
import {merge} from './cmds/merge';
import {fingerprint} from './cmds/fingerprint';
import {play, PlayArgs} from './cmds/play';
import {fetchUtils} from '@bubblewrap/core';

export class Cli {
  async run(args: string[]): Promise<boolean> {
    console.log(BUBBLEWRAP_LOGO);
    if (major(process.versions.node) < 12) {
      throw new Error(`Current Node.js version is ${process.versions.node}.` +
          ' Node.js version 12 or above is required to run bubblewrap.');
    }
    const parsedArgs = minimist(args);
    if (parsedArgs.fetchEngine &&
        (parsedArgs.fetchEngine == 'node-fetch' || parsedArgs.fetchEngine == 'fetch-h2')) {
      fetchUtils.setFetchEngine(parsedArgs.fetchEngine);
    }

    const config = await loadOrCreateConfig(undefined, undefined, parsedArgs.config);

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

    // If no command is given, default to 'help'.
    if (!command) {
      command = 'help';
    }

    switch (command) {
      case 'help':
        return await help(parsedArgs);
      case 'init':
        return await init(parsedArgs as unknown as InitArgs, config);
      case 'update':
        return await update(parsedArgs);
      case 'build':
        return await build(config, parsedArgs);
      case 'validate':
        return await validate(parsedArgs);
      case 'version': {
        return await version();
      }
      case 'install':
        return await install(parsedArgs, config);
      case 'updateConfig':
        return await updateConfig(parsedArgs);
      case 'doctor':
        return await doctor();
      case 'merge':
        return await merge(parsedArgs);
      case 'fingerprint':
        return await fingerprint(parsedArgs);
      case 'play':
        return await play(config, parsedArgs as unknown as PlayArgs);
      default:
        throw new Error(
            `"${command}" is not a valid command! Use 'bubblewrap help' for a list of commands`);
    }
  }
}
