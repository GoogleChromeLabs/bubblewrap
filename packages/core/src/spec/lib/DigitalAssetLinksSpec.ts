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

import {DigitalAssetLinks} from '../../lib/DigitalAssetLinks';

describe('DigitalAssetLinks', () => {
  describe('#generateAssetLinks', () => {
    it('Generates the assetlinks markup', () => {
      const packageName = 'com.test.twa';
      const fingerprint = 'FINGERPRINT';
      const digitalAssetLinks =
        JSON.parse(DigitalAssetLinks.generateAssetLinks(packageName, fingerprint));
      expect(digitalAssetLinks.length).toBe(1);
      expect(digitalAssetLinks[0].relation.length).toBe(1);
      expect(digitalAssetLinks[0].relation[0]).toBe('delegate_permission/common.handle_all_urls');
      expect(digitalAssetLinks[0].target.namespace).toBe('android_app');
      expect(digitalAssetLinks[0].target.package_name).toBe(packageName);
      expect(digitalAssetLinks[0].target.sha256_cert_fingerprints.length).toBe(1);
      expect(digitalAssetLinks[0].target.sha256_cert_fingerprints[0]).toBe(fingerprint);
    });
  });
});
