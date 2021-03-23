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

import {Log, ConsoleLog} from '@bubblewrap/core';
import {ParsedArgs} from 'minimist';
import {enUS as messages} from '../strings';

const HELP_MESSAGES = new Map<string, string>(
    [
      ['main', [
        'bubblewrap [command] <options>',
        '',
        '',
        'build ............... generates an Android APK from a TWA Project',
        'help ................ shows this menu',
        'init ................ initializes a new TWA Project',
        'update .............. updates an existing TWA Project with the latest bubblewrap template',
        'validate ............ validates if an URL matches the PWA Quality Criteria for Trusted' +
            ' Web Activity',
        'install ............. installs the output application to a connected device',
        'updateConfig ........ sets the paths of the jdk or the androidSdk to the given paths',
        'doctor .............. checks that the jdk and the androidSdk are in place and at the' +
            ' correct version',
        'merge ............... merges your web manifest into twaManifest.json',
        'fingerprint ......... generates the assetlinks.json file and manages keys',
      ].join('\n')],
      ['init', [
        'Usage:',
        '',
        '',
        'bubblewrap init --manifest=[web-manifest-url]',
        '',
        '',
        'Options:',
        '--directory ........... path where to generate the project. Defaults to the current' +
            ' directory',
        '--chromeosonly ........ specifies that the build will be used for Chrome OS only and' +
            ' prevents non-Chrome OS devices from installing the app.',
        '--alphaDependencies ... enables features that depend on upcoming version of the ' +
            ' Android library for Trusted Web Activity or that are still unstable.',
      ].join('\n')],
      ['build', [
        'Usage:',
        '',
        '',
        'bubblewrap build',
        '',
        '',
        'Options:',
        '--skipPwaValidation ....... skips validating the wrapped PWA against the Quality Criteria',
        '--skipSigning ............. skips signing the built APK and App Bundle',
        '--manifest ................ directory where the client should look for twa-manifest.json',
      ].join('\n')],
      ['update', [
        'Usage:',
        '',
        '',
        'bubblewrap update',
        '',
        '',
        'Options:',
        '--appVersionName ........... version name to be used on on the upgrade. Ignored if ' +
            '--skipVersionUpgrade is used',
        '--skipVersionUpgrade ....... skips upgrading appVersion and appVersionCode',
        '--manifest ................. directory where the client should look for twa-manifest.json',
      ].join('\n')],
      ['validate', [
        'Usage:',
        '',
        '',
        'bubblewrap validate --url=[pwa-url]',
      ].join('\n')],
      ['install', [
        'Usage:',
        '',
        '',
        'bubblewrap install',
        '',
        '',
        'Options: ',
        '--apkFile ................. path to the APK file to be installed. Defaults to ' +
            '"./app-release-signed.apk"',
        '--verbose ................. prints the adb command being executed',
      ].join('\n')],
      ['updateConfig', [
        messages.updateConfigUsage,
        '',
        '',
        'Options: ',
        '',
        '',
        '--jdkPath ................. sets the jdk\'s path to the path given',
        '--androidSdkPath .......... sets the androidSdk\'s path to the path given',
      ].join('\n')],
      ['doctor', [
        'Usage:',
        '',
        '',
        'bubblewrap doctor',
      ].join('\n')],
      ['merge', [
        'Usage:',
        '',
        '',
        'bubblewrap merge',
        '',
        '',
        'Options: ',
        '--appVersionName ........... version name to be used on on the upgrade. Ignored if ' +
            '--skipVersionUpgrade is used',
        '--skipVersionUpgrade ....... skips upgrading appVersion and appVersionCode',
        '--ignore [fields-list]................. the fields which you would like to keep the same.',
        'You can enter each key from your Web Manifest.',
      ].join('\n')],
      ['fingerprint', [
        'Usage:',
        '',
        '',
        'bubblewrap fingerprint [subcommand]',
        '',
        '  Global fingerprint flags: ',
        '  --manifest=<manifest> ........ Path to the Trusted Web Activity configuration.',
        '',
        '',
        ' - add: adds a fingerprint to the project configuration.',
        '   Usage:',
        '     bubblewrap fingerprint add [SHA-256 fingerprint] <flags>',
        '',
        '   Flags:',
        '     --name=<name> ...... a name for the fingerprint',
        '',
        '',
        ' - remove:  removes a fingerprint from the project configuration.',
        '   Usage:',
        '     bubblewrap fingerprint remove [SHA-256 fingerprint] <flags>',
        '',
        '',
        ' - list: lists the fingerprints in the project configuration',
        '   Usage:',
        '     bubblewrap fingerprint list <flags>',
        '',
        '',
        ' - generateAssetLinks:  Generates an AssetLinks file from the project configuration.',
        '   Usage:',
        '     bubblewrap fingerprint generateAssetLinks <flags>',
        '',
        '   Flags:',
        '     --output=<name> .... path from where to load the project configuration.',
        '',
      ].join('\n')],
    ],
);

export async function help(args: ParsedArgs, log: Log = new ConsoleLog('help')): Promise<boolean> {
  // minimist uses an `_` object to store details.
  const command = args._[1];
  const message = HELP_MESSAGES.get(command) || HELP_MESSAGES.get('main');

  // We know we have a message for 'main', in case the command is invalid.
  log.info(message!);
  return true;
}
