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

const extract = require('extract-zip');
const fetch = require('node-fetch');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const tar = require('tar');

async function execute(cmd, env) {
  await exec(cmd.join(' '), {env: env});
}

async function downloadFile(url, path) {
  const result = await fetch(url);
  const fileStream = fs.createWriteStream(path);

  await new Promise((resolve, reject) => {
    result.body.pipe(fileStream);
    result.body.on('error', (err) => {
      reject(err);
    });
    fileStream.on('finish', () => {
      resolve();
    });
  });
}

function unzipFile(zipFile, destinationPath, deleteZipWhenDone = false) {
  return new Promise((resolve, reject) => {
    extract(zipFile, {dir: destinationPath}, (err) => {
      if (err) {
        reject(err);
        return;
      }
      if (deleteZipWhenDone) {
        fs.unlinkSync(zipFile);
      }
      resolve();
    });
  });
}

async function untar(tarFile, destinationPath, deleteZipWhenDone = false) {
  console.log(`Extracting ${tarFile} to ${destinationPath}`);
  await tar.x({
    file: tarFile,
    cwd: destinationPath,
  });
  if (deleteZipWhenDone) {
    fs.unlinkSync(tarFile);
  }
}

function execInteractive(cwd, args, env) {
  const {spawn} = require('child_process');
  const shell = spawn(`"${cwd}"`, args, {
    stdio: 'inherit',
    env: env,
    shell: true,
  });
  return new Promise((resolve, reject) => {
    shell.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(code);
      }
    });
  });
}

/**
 * Fetches data for the largest icon from the web app manifest with a given purpose.
 * @param {Array<WebManifestIcon>|undefined} icons List of the manifest icons.
 * @param {string} purpose Purpose filter that the icon must match.
 * @param {number=} minSize The minimum required icon size enforced id provided.
 */
function findSuitableIcon(icons, purpose, minSize) {
  if (!icons) {
    return null;
  }

  let largestIcon = null;
  for (const icon of icons) {
    const size = (icon.sizes || '0x0').split(' ')
        .map((size) => Number.parseInt(size, 10))
        .reduce((max, size) => Math.max(max, size), 0);
    const purposes = new Set((icon.purpose || 'any').split(' '));
    if (purposes.has(purpose) && (!largestIcon || largestIcon.size < size)) {
      largestIcon = icon;
      largestIcon.size = size;
    }
  }

  if (!largestIcon || (minSize && largestIcon.size < minSize)) {
    return null;
  }

  return largestIcon;
}

module.exports = {
  execute: execute,
  downloadFile: downloadFile,
  unzipFile: unzipFile,
  untar: untar,
  execInteractive: execInteractive,
  findSuitableIcon: findSuitableIcon,
};
