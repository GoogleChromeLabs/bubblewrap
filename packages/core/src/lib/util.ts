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

import * as extractZip from 'extract-zip';
import fetch from 'node-fetch';
import * as fs from 'fs';
import {join} from 'path';
import {promisify} from 'util';
import {exec, execFile, spawn} from 'child_process';
import {x as extractTar} from 'tar';
import {WebManifestIcon, WebManifestJson} from './types/WebManifest';
import {Log} from './Log';
import {Orientation} from './TwaManifest';

const execPromise = promisify(exec);
const execFilePromise = promisify(execFile);
const extractZipPromise = promisify(extractZip);

// Regex for disallowed characters on Android Packages, as per
// https://developer.android.com/guide/topics/manifest/manifest-element.html#package
const DISALLOWED_ANDROID_PACKAGE_CHARS_REGEX = /[^a-zA-Z0-9_\.]/g;
const VALID_PACKAGE_ID_SEGMENT_REGEX = /^[a-zA-Z][A-Za-z0-9_]*$/;

export async function execute(
    cmd: string[], env: NodeJS.ProcessEnv, log?: Log): Promise<{stdout: string; stderr: string}> {
  const joinedCmd = cmd.join(' ');
  if (log) {
    log.debug(`Executing shell: ${joinedCmd}`);
  }
  return await execPromise(joinedCmd, {env: env});
}

export async function executeFile(
    cmd: string, args: string[], env: NodeJS.ProcessEnv, log?: Log, cwd?: string,
): Promise<{stdout: string; stderr: string}> {
  if (log) {
    log.debug(`Executing command ${cmd} with args ${args}`);
  }
  return await execFilePromise(cmd, args, {env: env, cwd: cwd});
}

/**
 * Downloads a file from `url` and saves it to `path`. If a `progressCallback` function is passed, it
 * will be invoked for every chunk received. If the value of `total` parameter is -1, it means we
 * were unable to determine to total file size before starting the download.
 */
export async function downloadFile(url: string, path: string,
    progressCallback?: (current: number, total: number) => void): Promise<void> {
  const result = await fetch(url);

  // Try to determine the file size via the `Content-Length` header. This may not be available
  // for all cases.
  const contentLength = result.headers.get('content-length');
  const fileSize = contentLength ? parseInt(contentLength) : -1;

  const fileStream = fs.createWriteStream(path);
  let received = 0;

  await new Promise((resolve, reject) => {
    result.body.pipe(fileStream);

    // Even though we're piping the chunks, we intercept them to check for the download progress.
    if (progressCallback) {
      result.body.on('data', (chunk) => {
        received = received + chunk.length;
        progressCallback(received, fileSize);
      });
    }

    result.body.on('error', (err) => {
      reject(err);
    });
    fileStream.on('finish', () => {
      resolve();
    });
  });
}

export async function unzipFile(
    zipFile: string, destinationPath: string, deleteZipWhenDone = false): Promise<void> {
  await extractZipPromise(zipFile, {dir: destinationPath});
  if (deleteZipWhenDone) {
    fs.unlinkSync(zipFile);
  }
}

export async function untar(
    tarFile: string, destinationPath: string, deleteZipWhenDone = false): Promise<void> {
  console.log(`Extracting ${tarFile} to ${destinationPath}`);
  await extractTar({
    file: tarFile,
    cwd: destinationPath,
    unlink: true,
  });
  if (deleteZipWhenDone) {
    fs.unlinkSync(tarFile);
  }
}

export function execInteractive(
    cwd: string, args: string[], env: NodeJS.ProcessEnv): Promise<number> {
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
 * @param {number} minSize The minimum required icon size enforced id provided.
 */
export function findSuitableIcon(
    icons: WebManifestIcon[] | undefined, purpose: string, minSize = 0): WebManifestIcon | null {
  if (icons == undefined || icons.length === 0) {
    return null;
  }

  let largestIcon: WebManifestIcon | null = null;
  let largestIconSize = 0;
  for (const icon of icons) {
    const size = (icon.sizes || '0x0').split(' ')
        .map((size) => Number.parseInt(size, 10))
        .reduce((max, size) => Math.max(max, size), 0);
    const purposes = new Set((icon.purpose || 'any').split(' '));
    if (purposes.has(purpose) && (!largestIcon || largestIconSize < size)) {
      largestIcon = icon;
      largestIconSize = size;
    }
  }

  if (largestIcon === null || (minSize > 0 && largestIconSize < minSize)) {
    return null;
  }

  largestIcon.size = largestIconSize;
  return largestIcon;
}

/**
 * Generates an Android Application Id / Package Name, using the reverse hostname as a base
 * and appending `.twa` to the end.
 *
 * Replaces invalid characters, as described in the Android documentation with `_`.
 *
 * https://developer.android.com/guide/topics/manifest/manifest-element.html#package
 *
 * @param {String} host the original hostname
 */
export function generatePackageId(host: string): string | null {
  host = host.trim();
  if (host.length === 0) {
    return null;
  }

  const parts = host.split('.').reverse();
  const packageId = [];
  for (const part of parts) {
    if (part.trim().length === 0) {
      continue;
    }
    packageId.push(part);
  }

  if (packageId.length === 0) {
    return null;
  }

  packageId.push('twa');
  return packageId.join('.').replace(DISALLOWED_ANDROID_PACKAGE_CHARS_REGEX, '_');
}

/**
 * Validates if a string is not null and not empty.
 * @param input the string to be validated
 * @param fieldName the field represented by the string
 * @returns {string | null} a description of the error or null if no erro is found.
 */
export function validateNotEmpty(
    input: string | null | undefined, fieldName: string): string | null {
  if (input === null || input === undefined || input.trim().length <= 0) {
    return `${fieldName} cannot be empty`;
  }
  return null;
}

/**
 * Validates a Package Id, according to the documentation at:
 * https://developer.android.com/studio/build/application-id
 *
 * Rules summary for the Package Id:
 * - It must have at least two segments (one or more dots).
 * - Each segment must start with a letter [a-zA-Z].
 * - All characters must be alphanumeric or an underscore [a-zA-Z0-9_].
 *
 * @param {string} input the package name to be validated
 * @returns {string | null} a description of the error or null if no erro is found.
 */
export function validatePackageId(input: string): string | null{
  const error = validateNotEmpty(input, 'packageId');
  if (error !== null) {
    return error;
  }

  const parts = input.split('.');
  if (parts.length < 2) {
    return 'packageId must have at least 2 sections separated by "."';
  }

  for (const part of parts) {
    if (part.match(VALID_PACKAGE_ID_SEGMENT_REGEX) === null) {
      return `Invalid packageId section: "${part}". Only alphanumeric characters and ` +
          'underscore [a-zA-Z0-9_] are allowed in packageId sections. Each section must ' +
          'start with a letter [a-zA-Z]';
    }
  }
  return null;
}

/**
 * Removes a file or directory. If the path is a directory, recursively deletes files and
 * directories inside it.
 */
export async function rmdir(path: string): Promise<void> {
  if (!fs.existsSync(path)) {
    return;
  }
  const stat = await fs.promises.stat(path);

  // This is a regular file. Just delete it.
  if (stat.isFile()) {
    await fs.promises.unlink(path);
    return;
  }

  // This is a directory. We delete files and sub directories inside it, then delete the
  // directory itself.
  const entries = fs.readdirSync(path);
  await Promise.all(entries.map((entry) => rmdir(join(path, entry))));
  await fs.promises.rmdir(path);
};

/**
   * Given a web manifest's URL, the function retrns the web manifest.
   *
   * @param {URL} webManifestUrl the URL where the webManifest is available.
   * @returns {Promise<WebManifestJson}
   */
export async function getWebManifest(webManifestUrl: URL): Promise<WebManifestJson> {
  const response = await fetch(webManifestUrl);
  if (response.status !== 200) {
    throw new Error(`Failed to download Web Manifest ${webManifestUrl}. ` +
        `Responded with status ${response.status}`);
  }
  return await response.json();
}

/**
 * Given a string of a JSON, the function retrns an escaped string representing that string.
 * eg: Turns every " instance into \\".
 *
 * @param {string} stringToReplace the string before the manipulation.
 * @returns {string} the string after the manipulation.
 */
export function escapeJsonString(stringToReplace: string): string {
  // The 'g' flag is for replacing all of the instances.
  const regExp = new RegExp('\"', 'g');
  return stringToReplace.replace(regExp, '\\\\\"');
}

// This is the value of the screenOrientation for the LauncherActivity which determines the
// orientation of the splash screen.
// This methods maps the Web Manifest orientation to the android screenOrientation:
//  - "portrait"            => "userPortrait"
//  - "portrait-primary"    => "portrait"
//  - "portrait-secondary"  => "reversePortrait"
//  - "landscape"           => "userLandscape"
//  - "landscape-primary"   => "landscape"
//  - "landscape-secondary" => "reverseLandscape"
//
// For more details, check the web orientation lock documentation at:
// https://developer.mozilla.org/en-US/docs/Web/API/Screen/lockOrientation
//
// And the Android screenOrientation at:
// https://developer.android.com/guide/topics/manifest/activity-element#screen
//
export function toAndroidScreenOrientation(orientation: Orientation): string {
  switch (orientation) {
    case 'portrait': return 'userPortrait';
    case 'portrait-primary': return 'portrait';
    case 'portrait-secondary': return 'reversePortrait';
    case 'landscape': return 'landscape';
    case 'landspace-primary': return 'userLandscape';
    case 'landscape-secondary': return 'reverseLandscape';
    default: return 'unspecified';
  }
}
