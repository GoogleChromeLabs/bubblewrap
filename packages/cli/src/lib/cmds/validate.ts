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
import {Log} from '@bubblewrap/core';
import {ParsedArgs} from 'minimist';

const log = new Log('validate');

export async function validate(args: ParsedArgs): Promise<void> {
  log.info('Validating URL: ', args.url);
  const validationResult = await PwaValidator.validate(new URL(args.url));
  console.log(validationResult);
}
