/*
 * Copyright 2020 Google Inc. All Rights Reserved.
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

import {ConsoleLog, Log} from '@bubblewrap/core';
import {join} from 'path';
import {existsSync, promises as fsPromises} from 'fs';
import {loadOrCreateConfig} from '../config';
import {enUS as messages} from '../strings';

async function jdkDoctor(log: Log): Promise<boolean> {
  const config = await loadOrCreateConfig();
  const jdkPath = config.jdkPath;
  if (!existsSync(jdkPath)) { // Checks if the given path is a real path.
    log.error(messages.jdkPathIsNotValid);
    return false;
  }
  const file = await fsPromises.readFile(join(jdkPath, 'release'), 'utf-8');
  if (!file) {
    log.error(messages.jdkPathIsNotCorrect);
    return false;
  };
  if (file.indexOf('JAVA_VERSION="1.8') < 0) { // Checks if the jdk's version is 8 as needed.
    log.error(messages.jdkIsNotsupported);
    return false;
  }
  return true;
}

async function androidSdkDoctor(log: Log): Promise<boolean> {
  const config = await loadOrCreateConfig();
  const androidSdkPath = config.androidSdkPath;
  if (!existsSync(androidSdkPath)) { // Checks if the given path is a real path.
    log.error(messages.androidSdkPathIsNotValid);
    return false;
  }
  if (!existsSync(join(androidSdkPath, 'build-tools'))) { // Checks if the path given is indeed.
    log.error(messages.androidSdkPathIsNotCorrect);
    return false;
  };
  return true;
}

export async function doctor(log: Log = new ConsoleLog('doctor')): Promise<boolean> {
  const jdkResult = await jdkDoctor(log);
  const androidSdkResult = await androidSdkDoctor(log);
  if (jdkResult && androidSdkResult) {
    log.info('Your jdkpath and androidSdkPath are valid.');
  }
  return jdkResult && androidSdkResult;
}
