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

import * as path from 'path';
import {util} from '@bubblewrap/core';
import {Prompt} from './Prompt';
import {enUS as messages} from './strings';

const JDK_VERSION = '17.0.11+9';
const JDK_DIR = `jdk-${JDK_VERSION}`;
const DOWNLOAD_JDK_BIN_ROOT = `https://github.com/adoptium/temurin17-binaries/releases/download/jdk-${JDK_VERSION}/`;
const DOWNLOAD_JDK_SRC_ROOT = 'https://github.com/adoptium/jdk17u/archive/refs/tags/';
const JDK_BIN_VERSION = JDK_VERSION.replace('+', '_');
const JDK_FILE_NAME_MAC_INTEL = `OpenJDK17U-jdk_x64_mac_hotspot_${JDK_BIN_VERSION}.tar.gz`;
const JDK_FILE_NAME_MAC_APPLE = `OpenJDK17U-jdk_aarch64_mac_hotspot_${JDK_BIN_VERSION}.tar.gz`;
const JDK_FILE_NAME_WIN32 = `OpenJDK17U-jdk_x86-32_windows_hotspot_${JDK_BIN_VERSION}.zip`;
const JDK_FILE_NAME_LINUX64 = `OpenJDK17U-jdk_x64_linux_hotspot_${JDK_BIN_VERSION}.tar.gz`;
const JDK_SRC_ZIP = `jdk-${JDK_VERSION}.zip`;
const JDK_SOURCE_SIZE = 178978050;

/**
 * Install JDK 17 by downloading the binary and source code and
 * decompressing it. Source code is required
 * based on discussions with legal team about licensing.
 */
export class JdkInstaller {
  private process: NodeJS.Process;
  private downloadFile: string;
  private unzipFunction: (srcPath: string, dstPath: string, deleteWhenDone: boolean)
    => Promise<void>;
  private joinPath: (...paths: string[]) => string;

  /**
   * Constructs a new instance of JdkInstaller.
   *
   * @param process {NodeJS.Process} process information from the OS process.
   */
  constructor(process: NodeJS.Process, private prompt: Prompt) {
    this.process = process;
    this.unzipFunction = util.untar;
    this.joinPath = path.posix.join;
    switch (process.platform) {
      case 'win32': {
        this.downloadFile = JDK_FILE_NAME_WIN32;
        this.unzipFunction = util.unzipFile;
        this.joinPath = path.win32.join;
        break;
      }
      case 'darwin': {
        switch (process.arch) {
          case 'x64': {
            this.downloadFile = JDK_FILE_NAME_MAC_INTEL;
            break;
          }
          case 'arm64': {
            this.downloadFile = JDK_FILE_NAME_MAC_APPLE;
            break;
          }
          default:
            this.downloadFile = '';
            throw new Error(`Mac architecture unsupported: ${this.process.arch}`);
        }
        break;
      }
      case 'linux': {
        this.downloadFile = JDK_FILE_NAME_LINUX64;
        break;
      }
      default:
        this.downloadFile = '';
        throw new Error(`Platform not found or unsupported: ${this.process.platform}.`);
    }
  }

  /**
   * Downloads the platform-appropriate version of JDK 17, including
   * binary and source code.
   *
   * @param installPath {string} path to install JDK at.
   */
  async install(installPath: string): Promise<string> {
    const dstPath = path.resolve(installPath);
    const downloadSrcUrl = DOWNLOAD_JDK_SRC_ROOT + JDK_SRC_ZIP;
    const localSrcZipPath = this.joinPath(dstPath, JDK_SRC_ZIP);

    this.prompt.printMessage(messages.messageDownloadJdkSrc);

    // The sources don't return the file size in the headers, so we
    // set it statically.
    await this.prompt.downloadFile(downloadSrcUrl, localSrcZipPath, JDK_SOURCE_SIZE);

    this.prompt.printMessage(messages.messageDecompressJdkSrc);
    await util.unzipFile(localSrcZipPath, dstPath, true);

    const downloadBinUrl = DOWNLOAD_JDK_BIN_ROOT + this.downloadFile;
    const localBinPath = this.joinPath(dstPath, this.downloadFile);

    this.prompt.printMessage(messages.messageDownloadJdkBin);
    await this.prompt.downloadFile(downloadBinUrl, localBinPath);

    this.prompt.printMessage(messages.messageDecompressJdkBin);
    await this.unzipFunction(localBinPath, dstPath, true);

    return this.joinPath(dstPath, JDK_DIR);
  }
}
