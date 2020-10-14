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

import {existsSync, promises as fsPromises} from 'fs';
import {Config} from '../Config';
import * as path from 'path';
import {executeFile} from '../util';
import {Result} from '../Result';
import {ValidatePathError} from '../errors/ValidatePathError';

type JoinPathFunction = (...paths: string[]) => string;

/**
 * Helps getting information relevant to the JDK installed, including
 * the approprite environment needed to run Java commands on the JDK
 */
export class JdkHelper {
  private process: NodeJS.Process;
  private config: Config;
  private joinPath: JoinPathFunction;
  private pathSeparator: string;
  private pathEnvironmentKey: string;

  /**
   * Constructs a new instance of JdkHelper.
   *
   * @param {NodeJS.Process} process information from the OS process
   * @param {Config} config the bubblewrap general configuration
   */
  constructor(process: NodeJS.Process, config: Config) {
    this.process = process;
    this.config = config;
    if (process.platform === 'win32') {
      this.joinPath = path.win32.join;
      this.pathSeparator = ';';
      this.pathEnvironmentKey = 'Path';
    } else {
      this.joinPath = path.posix.join;
      this.pathSeparator = ':';
      this.pathEnvironmentKey = 'PATH';
    }
  }

  /**
   * Runs the `java` command, passing args as parameters.
   */
  async runJava(args: string[]): Promise<{stdout: string; stderr: string}> {
    const java = this.process.platform === 'win32' ? '/bin/java.exe' : '/bin/java';
    const runJavaCmd = this.joinPath(this.getJavaHome(),
        java);
    return await executeFile(runJavaCmd, args, this.getEnv());
  }

  /**
   * Returns information from the JAVA_HOME, based on the config and platform.
   */
  getJavaHome(): string {
    return JdkHelper.getJavaHome(this.config.jdkPath, this.process);
  }

  /**
   * Returns information from the JAVA_HOME, based on the config and platform.
   * @param {Config} config The bubblewrap general configuration
   * @param {NodeJS.Process} process Information from the OS process
   */
  static getJavaHome(jdkPath: string, process: NodeJS.Process): string {
    const joinPath = (process.platform === 'win32') ? path.win32.join : path.posix.join;
    if (process.platform === 'darwin') {
      return joinPath(jdkPath, '/Contents/Home/');
    } else if (process.platform === 'linux' || process.platform === 'win32') {
      return joinPath(jdkPath, '/');
    }
    throw new Error(`Unsupported Platform: ${process.platform}`);
  }

  private static getJoinPath(process: NodeJS.Process): JoinPathFunction {
    switch (process.platform) {
      case 'win32': return path.win32.join;
      default: return path.posix.join;
    }
  }

  /**
   * Checks if the given jdkPath is valid.
   * @param {string} jdkPath the path to the jdk.
   */
  static async validatePath(jdkPath: string, currentProcess: NodeJS.Process = process):
      Promise<Result<string, ValidatePathError>> {
    const join = JdkHelper.getJoinPath(currentProcess);
    if (!existsSync(jdkPath)) {
      return Result.error(new ValidatePathError(
          `jdkPath "${jdkPath}" does not exist.`, 'PathIsNotCorrect'));
    };
    const javaHome = JdkHelper.getJavaHome(jdkPath, currentProcess);
    try {
      const releaseFilePath = join(javaHome, 'release');
      const file = await fsPromises.readFile(releaseFilePath, 'utf-8');
      if (file.indexOf('JAVA_VERSION="1.8') < 0) { // Checks if the jdk's version is 8 as needed
        return Result.error(new ValidatePathError(
            'JDK version not supported. JDK version 1.8 is required.', 'PathIsNotSupported'));
      }
    } catch (e) {
      return Result.error(new ValidatePathError(
          `Error reading the "release" file for the JDK at "${jdkPath}", with error: ${e} `,
          'PathIsNotCorrect'));
    }
    return Result.ok(jdkPath);
  }

  /**
   * Returns information from the Java executable location, based on the config and platform.
   * @returns {string} the value where the Java executables can be found
   */
  getJavaBin(): string {
    return this.joinPath(this.getJavaHome(), 'bin/');
  }

  /**
   * Returns a copy of process.env, customized with the correct JAVA_HOME and PATH.
   * @returns {NodeJS.ProcessEnv} an env object configure to run JDK commands
   */
  getEnv(): NodeJS.ProcessEnv {
    const env: NodeJS.ProcessEnv = Object.assign({}, this.process.env);
    env['JAVA_HOME'] = this.getJavaHome();
    // Concatenates the Java binary path to the existing PATH environment variable.
    env[this.pathEnvironmentKey] =
        this.getJavaBin() + this.pathSeparator + env[this.pathEnvironmentKey];
    return env;
  }
}
