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

import {Cli} from './lib/Cli';
import {Log, consoleLog} from '@bubblewrap/core';

module.exports = async (): Promise<void> => {
  const cli = new Cli();
  const log = new consoleLog('cli');
  const args = process.argv.slice(2);

  let success;
  try {
    success = await cli.run(args);
  } catch (err) {
    log.error(err.message);
    success = false;
  }

  // If running the command fails, we terminate the process signaling an error has occured.
  // This helps if the CLI is being used as part of a build process and depends on its result
  // to abort the build.
  if (!success) {
    process.exit(1);
  }
};
