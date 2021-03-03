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

export class DigitalAssetLinks {
  static generateAssetLinks(applicationId: string, ...sha256Fingerprints: string[]): string {
    const assetlinks = new Array<string>();
    assetlinks.push('[');
    sha256Fingerprints.forEach((sha256Fingerprint, index) => {
      if (index > 0) {
        assetlinks.push(',');
      }
      assetlinks.push(`{
        "relation": ["delegate_permission/common.handle_all_urls"],
        "target" : { "namespace": "android_app", "package_name": "${applicationId}",
                     "sha256_cert_fingerprints": ["${sha256Fingerprint}"] }
      }\n`);
    });
    assetlinks.push(']');
    return assetlinks.join('');
  }
}
