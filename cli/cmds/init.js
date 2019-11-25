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

'use strict';

const colorString = require('color-string');
const TwaGenerator = require('../../lib/TwaGenerator');
const TwaManifest = require('../../lib/TwaManifest');
const {keytool} = require('../../lib/jdk');
const {promisify} = require('util');
const colors = require('colors/safe');
const prompt = require('prompt');
const validUrl = require('valid-url');
const fs = require('fs');
prompt.get = promisify(prompt.get);

async function confirmTwaConfig(twaManifest) {
  const validateColor = (color) => {
    return colorString.get(color) !== null;
  };

  prompt.message = colors.green('[llama-pack-init]');
  prompt.delimiter = ' ';
  prompt.start();
  const schema = {
    properties: {
      host: {
        name: 'host',
        description: 'Domain being opened in the TWA:',
        required: true,
        default: twaManifest.host,
      },
      name: {
        name: 'name',
        description: 'Name to be shown on the Android Launcher:',
        required: true,
        default: twaManifest.name,
      },
      themeColor: {
        name: 'themeColor',
        description: 'Color to be used for the status bar:',
        message: 'Must use a color in hex format',
        required: true,
        conform: validateColor,
        default: twaManifest.themeColor,
      },
      backgroundColor: {
        name: 'backgroundColor',
        description: 'Color to be used for the splash screen background:',
        message: 'Must use a color in hex format',
        required: true,
        conform: validateColor,
        default: twaManifest.backgroundColor,
      },
      startUrl: {
        name: 'startUrl',
        message: 'Must be relative to the root domain.',
        description: 'Relative path to open the TWA:',
        required: true,
        default: twaManifest.startUrl,
      },
      iconUrl: {
        name: 'iconUrl',
        description: 'URL to an image that is at least 512x512px',
        message: 'Must be a well-formed http or https URL.',
        required: true,
        default: twaManifest.iconUrl,
        conform: validUrl.isWebUri,
      },
      maskableIconUrl: {
        name: 'maskableIconUrl',
        description: 'URL to an image that is at least 512x512px to be used when generating ' +
            'maskable icons',
        message: 'Must be a well-formed http or https URL.',
        default: twaManifest.maskableIconUrl || undefined,
        conform: validUrl.isWebUri,
      },
      packageId: {
        name: 'packageId',
        description: 'Android Package Name (or Application ID):',
        required: true,
        default: twaManifest.packageId,
      },
      signingKey: {
        properties: {
          path: {
            name: 'path',
            description: 'Location of the Signing Key:',
            required: true,
            default: twaManifest.signingKey.path,
          },
          alias: {
            name: 'alias',
            description: 'Key name:',
            required: true,
            default: twaManifest.signingKey.alias,
          },
        },
      },
    },
  };
  const result = await prompt.get(schema);
  Object.assign(twaManifest, result);
  return twaManifest;
}

async function init(args) {
  console.log('Fetching Manifest: ', args.manifest);
  try {
    let twaManifest = await TwaManifest.fromWebManifest(args.manifest);
    twaManifest = await confirmTwaConfig(twaManifest);
    const twaGenerator = new TwaGenerator();
    const targetDirectory = args.directory || process.cwd();
    await twaManifest.saveToFile('./twa-manifest.json');
    await twaGenerator.createTwaProject(targetDirectory, twaManifest);
    await createSigningKey(twaManifest);
    return true;
  } catch (e) {
    console.error('Error Genearating TWA', e);
    return false;
  }
}

async function createSigningKey(twaManifest) {
  // Signing Key already exists. Skip creation.
  if (fs.existsSync(twaManifest.signingKey.path)) {
    return;
  }

  prompt.start();

  // Ask user if they want to create a signing key now.
  const property = {
    name: 'yesno',
    message: `Signing Key could not be found at "${twaManifest.signingKey.path}". Do you want to` +
        ' create one now?',
    validator: /y[es]*|n[o]?/,
    warning: 'Must respond yes or no',
    default: 'yes',
  };

  const result = await prompt.get(property);
  if (result.yesno === 'no') {
    return;
  }

  await keytool.createSigningKey(
      twaManifest.signingKey.path,
      twaManifest.signingKey.alias,
  );
}

module.exports = init;
