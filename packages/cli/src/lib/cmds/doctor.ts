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

import {ConsoleLog} from '@bubblewrap/core';
import {join} from 'path';
import {existsSync, promises as fsPromises} from 'fs';
import {loadOrCreateConfig} from '../config';

async function jdkDoctor(log: ConsoleLog): Promise<boolean> {
  const config = loadOrCreateConfig();
  const jdkPath = (await config).jdkPath;
  // Checks if the given path is a real path.
  if (!existsSync(jdkPath)) {
    log.error('The jdkPath doesn\'t exist, please run the following command to update it:\n' +
    'bubblewrap updateConfig --jdkPath path/here. after thet run bubblewrap doctor again');
    return false;
  }
  const file = await fsPromises.readFile(join(jdkPath, 'release'), 'utf-8');
  if (!file) {
    log.error('The jdkPath isn\'t correct, please run the following command to update it:' +
    '\nbubblewrap updateConfig --jdkPath path/here, such that the folder "here" contains' +
    ' the file "release". after thet run bubblewrap doctor again');
    return false;
  };
  // Checks if the jdk's version is 8 as needed.
  if (file.indexOf('JAVA_VERSION="1.8') < 0) {
    log.error('Wrong jdk version. You should download "OpenJDK 8(LTS)" at the link below: \n' +
    'https://adoptopenjdk.net/releases.html?variant=openjdk8&jvmVariant=hotspot');
    return false;
  }
  return true;
}

async function androidSdkDoctor(log: ConsoleLog): Promise<boolean> {
  const config = loadOrCreateConfig();
  const androidSdkPath = (await config).androidSdkPath;
  // Checks if the given path is a real path.
  if (!existsSync(androidSdkPath)) {
    log.error('The androidSdkPath doesn\'t exist, please run the following command to update it:' +
    '\nbubblewrap updateConfig --androidSdkPath path/here. then run bubblewrap doctor again');
    return false;
  }
  // Checks if the path given is indeed
  if (!existsSync(join(androidSdkPath, 'build-tools'))) {
    log.error('The androidSdkPath isn\'t correct, please run the following command to update it:' +
    '\nbubblewrap updateConfig --jdkPath path/here, such that the folder "here" contains the ' +
    'folder "build-tools". then run bubblewrap doctor again');
    return false;
  };
  return true;
}

export async function doctor(log = new ConsoleLog('doctor')): Promise<boolean> {
  const jdkResult = jdkDoctor(log);
  const androidSdkResult = androidSdkDoctor(log);
  return jdkResult && androidSdkResult;
}
