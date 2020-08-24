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

import {ConsoleLog, Log, Config} from '@bubblewrap/core';
import {join} from 'path';
import {existsSync, promises as fsPromises} from 'fs';
import {loadOrCreateConfig} from '../config';
import {enUS as messages} from '../strings';

async function jdkDoctor(config: Config, log: Log): Promise<boolean> {
  const jdkPath = config.jdkPath;
  // Checks if the path given is valid.
  if (!existsSync(jdkPath)) {
    log.error(messages.jdkPathIsNotCorrect);
    return false;
  };
  try {
    const file = await fsPromises.readFile(join(jdkPath, 'release'), 'utf-8');
    if (file.indexOf('JAVA_VERSION="1.8') < 0) { // Checks if the jdk's version is 8 as needed
      log.error(messages.jdkIsNotSupported);
      return false;
    }
  } catch {
    log.error(messages.jdkPathIsNotCorrect);
    return false;
  }
  return true;
}

async function androidSdkDoctor(config: Config, log: Log): Promise<boolean> {
  const androidSdkPath = config.androidSdkPath;
  // Checks if the path given is valid.
  if (!existsSync(join(androidSdkPath, 'build-tools')) || !existsSync(androidSdkPath)) {
    log.error(messages.androidSdkPathIsNotCorrect);
    return false;
  };
  return true;
}

export async function doctor(log: Log = new ConsoleLog('doctor')): Promise<boolean> {
  const config = await loadOrCreateConfig();
  const jdkResult = await jdkDoctor(config, log);
  const androidSdkResult = await androidSdkDoctor(config, log);
  if (jdkResult && androidSdkResult) {
    log.info(messages.bothPathsAreValid);
  }
  return jdkResult && androidSdkResult;
}
