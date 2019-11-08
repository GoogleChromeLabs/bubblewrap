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
  const shell = spawn(cwd, args, {
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

module.exports = {
  execute: execute,
  downloadFile: downloadFile,
  unzipFile: unzipFile,
  untar: untar,
  execInteractive: execInteractive,
};
