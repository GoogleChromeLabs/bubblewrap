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

const TwaGenerator = require('../../lib/TwaGenerator');
const {TwaManifest} = require('../../lib/TwaManifest');
const KeyTool = require('../../lib/jdk/KeyTool');
const JdkHelper = require('../../lib/jdk/JdkHelper');
const {promisify} = require('util');
const colors = require('colors/safe');
const prompt = require('prompt');
const validUrl = require('valid-url');
const fs = require('fs');
const Color = require('color');
prompt.get = promisify(prompt.get);

async function confirmTwaConfig(twaManifest) {
  const validateColor = (color) => {
    try {
      new Color(color);
      return true;
    } catch (_) {
      return false;
    }
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
        default: twaManifest.themeColor.hex(),
      },
      backgroundColor: {
        name: 'backgroundColor',
        description: 'Color to be used for the splash screen background:',
        message: 'Must use a color in hex format',
        required: true,
        conform: validateColor,
        default: twaManifest.backgroundColor.hex(),
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
      shortcuts: {
        name: 'shortcuts',
        validator: /y[es]*|n[o]?/,
        message: 'Include app shortcuts?\n' + twaManifest.shortcuts,
        description: 'App shortcuts to display for users TO quickly start common or recommended ' +
            'tasks within the app',
        warning: 'Must respond yes or no',
        default: 'yes',
        ask: () => twaManifest.shortcuts !== '[]',
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
<<<<<<< HEAD

  if (result.shortcuts === 'no') {
    result.shortcuts = '[]';
  } else {
    result.shortcuts = twaManifest.shortcuts;
  }

  Object.assign(twaManifest, result);
=======
  Object.assign(twaManifest, result, {
    themeColor: new Color(result.themeColor),
    backgroundColor: new Color(result.themeColor),
  });
>>>>>>> Replaces `color-string` with `color`
  return twaManifest;
}

async function init(args, config) {
  console.log('Fetching Manifest: ', args.manifest);
  try {
    let twaManifest = await TwaManifest.fromWebManifest(args.manifest);
    twaManifest = await confirmTwaConfig(twaManifest);
    const twaGenerator = new TwaGenerator();
    const targetDirectory = args.directory || process.cwd();
    await twaManifest.saveToFile('./twa-manifest.json');
    await twaGenerator.createTwaProject(targetDirectory, twaManifest);
    await createSigningKey(twaManifest, config);
    return true;
  } catch (e) {
    console.error('Error Genearating TWA', e);
    return false;
  }
}

async function createSigningKey(twaManifest, config) {
  // Signing Key already exists. Skip creation.
  if (fs.existsSync(twaManifest.signingKey.path)) {
    return;
  }

  const jdkHelper = new JdkHelper(process, config);
  const keytool = new KeyTool(jdkHelper);

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

  await keytool.createSigningKeyIfNeeded(
      twaManifest.signingKey.path,
      twaManifest.signingKey.alias,
  );
}

module.exports = init;
