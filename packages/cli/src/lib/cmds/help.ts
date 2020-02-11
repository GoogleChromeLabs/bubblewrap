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

import {Log} from '@llama-pack/core';
import {ParsedArgs} from 'minimist';

const HELP_MESSAGES = new Map<string, string>(
    [
      ['main', [
        'llama-pack [command] <options>',
        '',
        '',
        'build ............... generates an Android APK from a TWA Project',
        'help ................ shows this menu',
        'init ................ initializes a new TWA Project',
        'update .............. updates an existing TWA Project with the latest llama-pack template',
      ].join('\n')],
      ['init', [
        'Usage:',
        '',
        '',
        'lama-pack init --manifest=[web-manifest-url]',
        '',
        '',
        'Options:',
        '--directory ......... path where to generate the project. Defaults to the current' +
            ' directory',
      ].join('\n')],
      ['build', [
        'Usage:',
        '',
        '',
        'llama-pack build',
      ].join('\n')],
      ['update', [
        'Usage:',
        '',
        '',
        'llama-pack update',
        '',
        '',
        'Options:',
        '--appVersionName ........... version name to be used on on the upgrade. Ignored if ' +
            '--skipVersionUpgrade is used',
        '--skipVersionUpgrade ....... skips upgrading appVersion and appVersionCode',
        '--manifest ................. directory where the client should look for twa-manifest.json',
      ].join('\n')],
    ],
);

export async function help(args: ParsedArgs, log = new Log('help')): Promise<void> {
  // minimist uses an `_` object to store details.
  const command = args._[1];
  const message = HELP_MESSAGES.get(command) || HELP_MESSAGES.get('main');

  // We know we have a message for 'main', in case the command is invalid.
  log.info(message!);
  return;
}
