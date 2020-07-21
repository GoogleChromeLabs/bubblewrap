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

import {JdkHelper} from './JdkHelper';
import {executeFile} from '../util';
import {SigningKeyInfo} from '../../lib/TwaManifest';

const JARSIGNER_CMD = 'jarsigner';
const SIGNATURE_ALGORITHM = 'SHA256withRSA';
const DIGEST_ALGORITHM = 'SHA-256';

/**
 * Wraps the Java `jarsigner` CLI tool.
 */
export class JarSigner {
  constructor(private jdkHelper: JdkHelper) {}

  /**
   * Signs a file
   */
  async sign(signingKeyInfo: SigningKeyInfo, storepass: string, keypass: string,
      inputFile: string, outputFile: string): Promise<void> {
    const env = this.jdkHelper.getEnv();
    await executeFile(JARSIGNER_CMD, [
      '-verbose',
      '-sigalg',
      SIGNATURE_ALGORITHM,
      '-digestalg',
      DIGEST_ALGORITHM,
      '-keystore',
      signingKeyInfo.path,
      inputFile,
      signingKeyInfo.alias,
      '-storepass',
      storepass,
      '-keypass',
      keypass,
      '-signedjar',
      outputFile,
    ], env);
  };
}
