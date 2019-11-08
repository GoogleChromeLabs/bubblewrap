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

const TWA_BOOTSTRAP_HOME = path.resolve(__dirname, '..');
const DOWNLOAD_SDK_ROOT = 'https://dl.google.com/android/repository/';
const WINDOWS_URL = 'sdk-tools-windows-4333796.zip';
const MAC_URL = 'sdk-tools-darwin-4333796.zip';
const LINUX_URL = 'sdk-tools-linux-4333796.zip';

class AndroidSdkToolsInstaller {
  async install() {
    let downloadFileName;
    switch (process.platform) {
      case 'darwin': {
        downloadFileName = MAC_URL;
        break;
      }
      case 'linux': {
        downloadFileName = LINUX_URL;
        break;
      }
      case 'win32':
      case 'win64': {
        downloadFileName = WINDOWS_URL;
        break;
      }
      default: throw new Error(`Unsupported Platform: ${process.platform}`);
    }

    const downloadUrl = DOWNLOAD_SDK_ROOT + downloadFileName;
    const localPath = path.join(TWA_BOOTSTRAP_HOME, downloadFileName);
    await util.downloadFile(downloadUrl, localPath);
    await util.unzipFile(localPath, path.join(TWA_BOOTSTRAP_HOME, '/android_sdk/'), true);
    await this.installBuildTools();
  }

  async ensureInstalled() {
    if (!this.isInstalled()) {
      await jdkInstaller.ensureInstalled();
      console.log('Android SDK not found. Downloading');
      await this.install();
    }
  }

  isInstalled() {
    return fs.existsSync(path.join(TWA_BOOTSTRAP_HOME, '/android_sdk/'));
  }
}

module.exports = new AndroidSdkToolsInstaller();
