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

import * as fs from 'fs';
import Color = require('color');
import * as inquirer from 'inquirer';
import {Config, DisplayModes, JdkHelper, KeyTool, Log, TwaGenerator, TwaManifest,
  util} from '@bubblewrap/core';
import {validateColor, validateKeyPassword, validateUrl, notEmpty} from '../inputHelpers';
import {ParsedArgs} from 'minimist';
import {APP_NAME} from '../constants';

const log = new Log('init');

export interface InitArgs {
  manifest: string;
  directory?: string;
}

async function confirmTwaConfig(twaManifest: TwaManifest): Promise<TwaManifest> {
  const result = await inquirer.prompt([
    {
      name: 'host',
      type: 'input',
      message: 'Domain being opened in the TWA:',
      default: twaManifest.host,
      validate: async (input): Promise<boolean> => notEmpty(input, 'host'),
    }, {
      name: 'name',
      type: 'input',
      message: 'Name of the application:',
      default: twaManifest.name,
      validate: async (input): Promise<boolean> => notEmpty(input, 'name'),
    }, {
      name: 'launcherName',
      type: 'input',
      message: 'Name to be shown on the Android Launcher:',
      default: twaManifest.launcherName,
      validate: async (input): Promise<boolean> => notEmpty(input, 'Launcher name'),
    }, {
      name: 'display',
      type: 'list',
      message: 'Display mode to be used:',
      default: twaManifest.display,
      choices: DisplayModes,
    }, {
      name: 'themeColor',
      type: 'input',
      message: 'Color to be used for the status bar:',
      default: twaManifest.themeColor.hex(),
      validate: validateColor,
    }, {
      name: 'backgroundColor',
      type: 'input',
      message: 'Color to be used for the splash screen background:',
      default: twaManifest.backgroundColor.hex(),
      validate: validateColor,
    }, {
      name: 'startUrl',
      type: 'input',
      message: 'Relative path to open the TWA:',
      default: twaManifest.startUrl,
      validate: async (input): Promise<boolean> => notEmpty(input, 'URL'),
    }, {
      name: 'iconUrl',
      type: 'input',
      message: 'URL to an image that is at least 512x512px:',
      default: twaManifest.iconUrl,
      validate: validateUrl,
    }, {
      name: 'maskableIconUrl',
      type: 'input',
      message:
        'URL to an image that is at least 512x512px to be used when generating maskable icons.' +
        '\n\nMaskable icons should look good when their edges are removed by an icon mask. ' +
        'They will be used to display adaptive launcher icons on the Android home screen.',
      default: twaManifest.maskableIconUrl,
      filter: (input): string | undefined => input.length === 0 ? undefined : input,
      validate: async (input): Promise<boolean> => input === undefined || await validateUrl(input),
    }, {
      name: 'monochromeIconUrl',
      type: 'input',
      message:
        'URL to an image that is at least 48x48px to be used when generating monochrome icons.' +
        '\n\nMonochrome icons should look good when displayed with a single color,' +
        'the PWA\' theme_color. They will be used for notification icons.',
      default: twaManifest.monochromeIconUrl,
      filter: (input): string | undefined => input.length === 0 ? undefined : input,
      validate: async (input): Promise<boolean> => input === undefined || await validateUrl(input),
    }, {
      name: 'shortcuts',
      type: 'confirm',
      message: 'Include app shortcuts?\n' + JSON.stringify(twaManifest.shortcuts, null, 2),
      default: true,
    }, {
      name: 'packageId',
      type: 'input',
      message: 'Android Package Name (or Application ID):',
      default: twaManifest.packageId,
      validate: async (input): Promise<boolean> => {
        const result = util.validatePackageId(input);
        if (result !== null) {
          throw new Error(result);
        }
        return true;
      },
    }, {
      name: 'keyPath',
      type: 'input',
      message: 'Location of the Signing Key:',
      default: twaManifest.signingKey.path,
      validate: async (input): Promise<boolean> =>
        notEmpty(input, 'KeyStore location'),
    }, {
      name: 'keyAlias',
      type: 'input',
      message: 'Key name:',
      default: twaManifest.signingKey.alias,
      validate: async (input): Promise<boolean> => notEmpty(input, 'Key alias'),
    },
  ]);

  // TODO(andreban): This is modifying the twaManifest passed as parameter. Need to refactor
  // and change to create a new TwaManifest.
  twaManifest.host = result.host;
  twaManifest.name = result.name;
  twaManifest.launcherName = result.launcherName;
  twaManifest.display = result.display;
  twaManifest.themeColor = new Color(result.themeColor);
  twaManifest.backgroundColor = new Color(result.backgroundColor);
  twaManifest.startUrl = result.startUrl;
  twaManifest.iconUrl = result.iconUrl;
  twaManifest.maskableIconUrl = result.maskableIconUrl;
  twaManifest.monochromeIconUrl = result.monochromeIconUrl;
  twaManifest.shortcuts = result.shortcuts ? twaManifest.shortcuts : [];
  twaManifest.packageId = result.packageId;
  twaManifest.signingKey = {
    alias: result.keyAlias,
    path: result.keyPath,
  };
  twaManifest.generatorApp = APP_NAME;
  return twaManifest;
}

async function createSigningKey(twaManifest: TwaManifest, config: Config): Promise<void> {
  // Signing Key already exists. Skip creation.
  if (fs.existsSync(twaManifest.signingKey.path)) {
    return;
  }

  const jdkHelper = new JdkHelper(process, config);
  const keytool = new KeyTool(jdkHelper);

  // Ask user if they want to create a signing key now.
  const question = await inquirer.prompt([{
    name: 'createKey',
    type: 'confirm',
    message: `Signing Key could not be found at "${twaManifest.signingKey.path}". Do you want to` +
    ' create one now?',
    default: true,
  }]);

  if (!question.createKey) {
    return;
  }

  const result = await inquirer.prompt([
    {
      name: 'fullName',
      type: 'input',
      message: 'First and Last names (eg: John Doe):',
      validate: async (input): Promise<boolean> => notEmpty(input, 'First and Last names'),
    }, {
      name: 'organizationalUnit',
      type: 'input',
      message: 'Organizational Unit (eg: Engineering Dept):',
      validate: async (input): Promise<boolean> => notEmpty(input, 'Organizational Unit'),
    }, {
      name: 'organization',
      type: 'input',
      message: 'Organization (eg: Company Name):',
      validate: async (input): Promise<boolean> => notEmpty(input, 'Organization'),
    }, {
      name: 'country',
      type: 'input',
      message: 'Country (2 letter code):',
      validate: async (input): Promise<boolean> => notEmpty(input, 'Country'),
    }, {
      name: 'password',
      type: 'password',
      message: 'Password for the Key Store:',
      validate: validateKeyPassword,
    }, {
      name: 'keypassword',
      type: 'password',
      message: 'Password for the Key:',
      validate: validateKeyPassword,
    },
  ]);

  await keytool.createSigningKey({
    fullName: result.fullName,
    organizationalUnit: result.organizationalUnit,
    organization: result.organization,
    country: result.country,
    password: result.password,
    keypassword: result.keypassword,
    alias: twaManifest.signingKey.alias,
    path: twaManifest.signingKey.path,
  });
}

export async function init(args: ParsedArgs, config: Config): Promise<boolean> {
  log.info('Fetching Manifest: ', args.manifest);
  let twaManifest = await TwaManifest.fromWebManifest(args.manifest);
  twaManifest = await confirmTwaConfig(twaManifest);
  const twaGenerator = new TwaGenerator();
  const targetDirectory = args.directory || process.cwd();
  await twaManifest.saveToFile('./twa-manifest.json');
  await twaGenerator.createTwaProject(targetDirectory, twaManifest);
  await createSigningKey(twaManifest, config);
  log.info('');
  log.info('Project generated successfully. Build it by running "bubblewrap build"');
  return true;
}
