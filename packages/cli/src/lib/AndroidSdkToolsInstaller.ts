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

import * as path from 'path';
import {util} from '@bubblewrap/core';
import {Prompt} from './Prompt';
import {enUS as messages} from './strings';

const SDK_VERSION = '6858069';
const DOWNLOAD_SDK_ROOT = 'https://dl.google.com/android/repository/';
const WINDOWS_URL = `commandlinetools-win-${SDK_VERSION}_latest.zip`;
const MAC_URL = `commandlinetools-mac-${SDK_VERSION}_latest.zip`;
const LINUX_URL = `commandlinetools-linux-${SDK_VERSION}_latest.zip`;

/**
 * Install Android Command Line Tools by downloading the zip and
 * decompressing it.
 */
export class AndroidSdkToolsInstaller {
  constructor(private process: NodeJS.Process, private prompt: Prompt) {
  }

  /**
   * Downloads the platform-appropriate version of Android
   * Command Line Tools.
   *
   * @param installPath {string} path to install SDK at.
   */
  async install(installPath: string): Promise<void> {
    let downloadFileName;
    switch (this.process.platform) {
      case 'darwin': {
        downloadFileName = MAC_URL;
        break;
      }
      case 'linux': {
        downloadFileName = LINUX_URL;
        break;
      }
      case 'win32': {
        downloadFileName = WINDOWS_URL;
        break;
      }
      default: throw new Error(`Unsupported Platform: ${this.process.platform}`);
    }

    const dstPath = path.resolve(installPath);
    const downloadUrl = DOWNLOAD_SDK_ROOT + downloadFileName;
    const localPath = path.join(dstPath, downloadFileName);

    this.prompt.printMessage(messages.messageDownloadAndroidSdk);
    await this.prompt.downloadFile(downloadUrl, localPath);

    this.prompt.printMessage(messages.messageDecompressAndroidSdk);
    await util.unzipFile(localPath, dstPath, true);
  }
}
