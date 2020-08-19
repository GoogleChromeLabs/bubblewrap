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

import {AppsFlyerFeature, AppsFlyerConfig} from '../../../lib/features/AppsFlyerFeature';

describe('AppsFlyerFeature', () => {
  describe('#constructor', () => {
    // variables is the only field dynamically generated.
    it('Generates correct variables for application', () => {
      const config = {
        appsFlyerId: '12345',
      } as AppsFlyerConfig;
      const appsFlyerFeature = new AppsFlyerFeature(config);
      expect(appsFlyerFeature.applicationClass.variables)
          .toEqual(['private static final String AF_DEV_KEY = "12345";']);
    });
  });
});
