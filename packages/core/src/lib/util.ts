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
import * as fs from 'fs';
import {join} from 'path';
import {promisify} from 'util';
import {exec, execFile, spawn} from 'child_process';
import {x as extractTar} from 'tar';
import {WebManifestIcon, WebManifestJson} from './types/WebManifest';
import {Log} from './Log';
import {Orientation} from './TwaManifest';
import {fetchUtils} from './FetchUtils';

const execPromise = promisify(exec);
const execFilePromise = promisify(execFile);
const extractZipPromise = promisify(extractZip);

// Regex for disallowed characters on Android Packages, as per
// https://developer.android.com/guide/topics/manifest/manifest-element.html#package
const DISALLOWED_ANDROID_PACKAGE_CHARS_REGEX = /[^a-zA-Z0-9_\.]/g;
const VALID_PACKAGE_ID_SEGMENT_REGEX = /^[a-zA-Z][A-Za-z0-9_]*$/;

// List of keywords for Java 11, as listed at
// https://docs.oracle.com/javase/specs/jls/se11/html/jls-3.html#jls-3.9.
const JAVA_KEYWORDS = [
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const',
  'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float',
  'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native',
  'new', 'package', 'private', 'protected', 'public', 'return', 'short', 'static', 'strictfp',
  'super', 'switch', 'synchronized', 'this', 'throw', 'throws', 'transient', 'try', 'void',
  'volatile', 'while',
];

export async function execute(
    cmd: string[], env: NodeJS.ProcessEnv, log?: Log): Promise<{stdout: string; stderr: string}> {
  const joinedCmd = cmd.join(' ');
  if (log) {
    log.debug(`Executing shell: ${joinedCmd}`);
  }
  return await execPromise(joinedCmd, {env: env, shell: true});
}

export async function executeFile(
    cmd: string, args: string[], env: NodeJS.ProcessEnv, log?: Log, cwd?: string,
): Promise<{stdout: string; stderr: string}> {
  if (log) {
    log.debug(`Executing command ${cmd} with args ${args}`);
  }
  return await execFilePromise(cmd, args, {env: env, cwd: cwd, shell: true});
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

    // Package names cannot contain Java keywords. The recommendation is adding an '_' before the
    // keyword. See https://docs.oracle.com/javase/tutorial/java/package/namingpkgs.html.
    if (JAVA_KEYWORDS.includes(part)) {
      packageId.push('_' + part);
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
export function validatePackageId(input: string): string | null {
  const error = validateNotEmpty(input, 'packageId');
  if (error !== null) {
    return error;
  }

  const parts = input.split('.');
  if (parts.length < 2) {
    return 'packageId must have at least 2 sections separated by "."';
  }

  for (const part of parts) {
    // Package names cannot contain Java keywords. The recommendation is adding an '_' before the
    // keyword. See https://docs.oracle.com/javase/tutorial/java/package/namingpkgs.html.
    if (JAVA_KEYWORDS.includes(part)) {
      return `Invalid packageId section: "${part}". ${part} is a Java keyword and cannot be used` +
          'as a package section. Consider adding an "_" before the section name.';
    }

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
 * Given a Web Manifest's URL, the function returns the web manifest as a JSON object.
 *
 * @param {URL} webManifestUrl the URL where the Web Manifest is available.
 * @returns {Promise<WebManifestJson}
 */
export async function getWebManifest(webManifestUrl: URL): Promise<WebManifestJson> {
  const response = await fetchUtils.fetch(webManifestUrl.toString());
  if (response.status !== 200) {
    throw new Error(`Failed to download Web Manifest ${webManifestUrl}. ` +
        `Responded with status ${response.status}`);
  }
  return await response.json();
}

/**
 * Given a JSON string, the function returns an escaped representation of the string.
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
//  - "default"             => "unspecified"
//  - "any"                 => "unspecified"
//  - "natural "            => "unspecified"
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
    case 'portrait': return 'ActivityInfo.SCREEN_ORIENTATION_USER_PORTRAIT';
    case 'portrait-primary': return 'ActivityInfo.SCREEN_ORIENTATION_PORTRAIT';
    case 'portrait-secondary': return 'ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT';
    case 'landscape': return 'ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE';
    case 'landspace-primary': return 'ActivityInfo.SCREEN_ORIENTATION_USER_LANDSCAPE';
    case 'landscape-secondary': return 'ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE';
    default: return 'ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED';
  }
}

/**
 * Escapes a string that will be written to the Gradle file. The characters need to be escaped
 * multiple times, as they also need to be escaped inside the Gradle file.
 *
 * As an example, "Andre's Code" needs to be written as "Andre\\\'s Code" to the Gradle file, so
 * it is properly escaped when passed to AAPT.
 */
export function escapeGradleString(input: string): string {
  return input.replace(/[\\']/g, '\\\\\\$&');
}

/**
 * Escapes a string that will be used inside a double quoted block in the shell. The characters
 * ", $, `, and \ need escaping even when the string is surrounded by double quotes.
 */
export function escapeDoubleQuotedShellString(input: string): string {
  return input.replace(/([\$"`\\])/g, '\\$1');
}
