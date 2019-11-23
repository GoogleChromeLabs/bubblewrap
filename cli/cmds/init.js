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
const TwaManifest = require('../../lib/TwaManifest');
const {jdkHelper} = require('../../lib/jdk');
const {promisify} = require('util');
const util = require('../../lib/util');
const colors = require('colors/safe');
const prompt = require('prompt');
const validUrl = require('valid-url');
const fs = require('fs');
prompt.get = promisify(prompt.get);

async function confirmTwaConfig(twaManifest) {
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
        pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
        default: twaManifest.themeColor,
      },
      backgroundColor: {
        name: 'backgroundColor',
        description: 'Color to be used for the splash screen background:',
        message: 'Must use a color in hex format',
        required: true,
        pattern: '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$',
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

// keytool -genkeypair -dname "cn=Mark Jones, ou=JavaSoft, o=Sun, c=US" -alias business -keypass kpi135 -keystore /working/android.keystore -storepass ab987c -validity 20000
async function createSigningKey(twaManifest) {
  console.log(twaManifest);
  if (fs.existsSync(twaManifest.signingKey.path)) {
    return;
  }

  console.log('You will need a Signing Key when building the Android App. Let\'s create one now');
  const env = jdkHelper.getEnv();

  prompt.message = colors.green('[llama-pack-init]');
  prompt.delimiter = ' ';
  prompt.start();

  const schema = {
    properties: {
      cn: {
        name: 'cn',
        required: true,
        description: 'First and Last names (eg: John Doe):',
      },
      ou: {
        name: 'ou',
        required: true,
        description: 'Organizational Unit (eg: Engineering Dept):',
      },
      o: {
        name: 'o',
        required: true,
        description: 'Organization: (eg: Company Name)',
      },
      c: {
        name: 'c',
        required: true,
        description: 'Country (2 letter code):',
      },
      password: {
        name: 'password',
        required: true,
        description: 'Password for the Key Store',
        hidden: true,
        replace: '*',
      },
    },
  };
  const result = await prompt.get(schema);
  const keytoolCmd = [
    'keytool',
    '-genkeypair',
    `-dname "cn=${result.cn}, ou=${result.ou}, o=${result.o}}, c=${result.c}"`,
    `-alias ${twaManifest.signingKey.alias}`,
    `-keypass ${result.password}`,
    `-keystore ${twaManifest.signingKey.path}`,
    `-storepass ${result.password}`,
    '-validity 20000',
    '-keyalg RSA',
  ];
  await util.execute(keytoolCmd, env);
  console.log('Signing Key created successfully');
}

module.exports = init;
