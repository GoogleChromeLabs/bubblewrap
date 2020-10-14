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

import {FirstRunFlagConfig, FirstRunFlagFeature} from '../../../lib/features/FirstRunFlagFeature';

describe('FirstRunFlagFeature', () => {
  describe('#constructor', () => {
    it('Generates the correct variables', () => {
      const paramName = 'my_param_name';
      // variables is the only field dynamically generated.
      const config = {
        enabled: true,
        queryParameterName: paramName,
      } as FirstRunFlagConfig;
      const appsFlyerFeature = new FirstRunFlagFeature(config);
      expect(appsFlyerFeature.launcherActivity.variables)
          .toContain(`private static final String PARAM_FIRST_OPEN = "${paramName}";`);
    });
  });
});
