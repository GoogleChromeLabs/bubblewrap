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

const packageName = 'com.test.twa';

describe('DigitalAssetLinks', () => {
  describe('#generateAssetLinks', () => {
    it('Generates the assetlinks markup', () => {
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

    it('Generates empty assetlinks.json', () => {
      const digitalAssetLinks =
        JSON.parse(DigitalAssetLinks.generateAssetLinks(packageName, ...new Array<string>()));
      expect(digitalAssetLinks.length).toBe(0);
    });

    it('Supports multiple fingerprints', () => {
      const digitalAssetLinks =
        JSON.parse(DigitalAssetLinks.generateAssetLinks(packageName, '123', '456'));
      expect(digitalAssetLinks.length).toBe(2);
      expect(digitalAssetLinks[0].relation[0]).toBe('delegate_permission/common.handle_all_urls');
      expect(digitalAssetLinks[0].target.namespace).toBe('android_app');
      expect(digitalAssetLinks[0].target.package_name).toBe(packageName);
      expect(digitalAssetLinks[0].target.sha256_cert_fingerprints.length).toBe(1);
      expect(digitalAssetLinks[0].target.sha256_cert_fingerprints[0]).toBe('123');
      expect(digitalAssetLinks[1].relation[0]).toBe('delegate_permission/common.handle_all_urls');
      expect(digitalAssetLinks[1].target.namespace).toBe('android_app');
      expect(digitalAssetLinks[1].target.package_name).toBe(packageName);
      expect(digitalAssetLinks[1].target.sha256_cert_fingerprints.length).toBe(1);
      expect(digitalAssetLinks[1].target.sha256_cert_fingerprints[0]).toBe('456');
    });
  });
});
