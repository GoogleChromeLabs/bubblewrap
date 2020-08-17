/*
 * Copyright 2020 Google Inc. All Rights Reserved.
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

import {PwaValidator} from '@bubblewrap/validator';
import {Log, ConsoleLog} from '@bubblewrap/core';
import {ParsedArgs} from 'minimist';
import {printValidationResult} from '../pwaValidationHelper';

const log = new ConsoleLog('validate');

/**
 * Runs the PwaValidator to check a given URL agains the Quality criteria. More information on the
 * Quality Criteria available at: https://web.dev/using-a-pwa-in-your-android-app/#quality-criteria
 * @param {ParsedArgs} args
 */
export async function validate(args: ParsedArgs): Promise<boolean> {
  log.info('Validating URL: ', args.url);
  const validationResult = await PwaValidator.validate(new URL(args.url));
  printValidationResult(validationResult, log);
  return validationResult.status === 'PASS';
}
