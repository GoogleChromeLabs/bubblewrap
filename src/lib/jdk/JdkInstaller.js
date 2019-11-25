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

const DOWNLOAD_JDK_ROOT = 'https://github.com/AdoptOpenJDK/openjdk8-binaries/releases/download/jdk8u232-b09/';
const TWA_BOOTSTRAP_HOME = path.resolve(__dirname, '..');
const JDK_FILE_NAME_MAC = 'OpenJDK8U-jdk_x64_mac_hotspot_8u232b09.tar.gz';
const JDK_FILE_NAME_WIN64 = 'OpenJDK8U-jdk_x64_windows_hotspot_8u232b09.zip';
const JDK_FILE_NAME_WIN32 = 'OpenJDK8U-jdk_x86-32_windows_hotspot_8u232b09.zip';
const JDK_FILE_NAME_LINUX64 = 'OpenJDK8U-jdk_x64_linux_hotspot_8u232b09.tar.gz';

class JdkInstaller {
  async install() {
    let downloadFile;
    let unzipFunction;
    switch (process.platform) {
      case 'darwin': {
        downloadFile = JDK_FILE_NAME_MAC;
        unzipFunction = util.untar;
        break;
      }
      case 'linux': {
        downloadFile = JDK_FILE_NAME_LINUX64;
        unzipFunction = util.untar;
        break;
      }
      case 'win32': {
        downloadFile = JDK_FILE_NAME_WIN32;
        unzipFunction = util.unzipFile;
        break;
      }
      case 'win32': {
        downloadFile = JDK_FILE_NAME_WIN64;
        unzipFunction = util.unzipFile;
        break;
      }
    }

    const downloadUrl = DOWNLOAD_JDK_ROOT + downloadFile;
    const localPath = TWA_BOOTSTRAP_HOME + '/' + downloadFile;
    await util.downloadFile(downloadUrl, localPath);
    await unzipFunction(localPath, TWA_BOOTSTRAP_HOME, true);
    return;
  }

  async ensureInstalled() {
    if (!this.isInstalled()) {
      console.log('JDK not found. Downloading JDK 8');
      await this.install();
    }
  }

  isInstalled() {
    return fs.existsSync(TWA_BOOTSTRAP_HOME + '/jdk8u232-b09');
  }
}

module.exports = new JdkInstaller();
