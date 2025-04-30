/*
 * Copyright 2025 Google Inc. All Rights Reserved.
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

import {FileHandlingFeature} from '../../../lib/features/FileHandlingFeature';

describe('FileHandlingFeature', () => {
  describe('#constructor', () => {
    // variables is the only field dynamically generated.
    it('Generates correct variables for application', () => {
      const fileHandlers = [
        {
          'actionUrl': 'https://pwa-directory.com/',
          'mimeTypes': ['text/plain'],
        },
        {
          'actionUrl': 'https://pwa-directory.com/?image',
          'mimeTypes': ['image/jpg', 'image/jpeg'],
        },
      ];
      const fileHandlingFeature = new FileHandlingFeature(fileHandlers);
      const activityAliases = fileHandlingFeature.androidManifest.components;
      expect(activityAliases).toHaveSize(2);
      expect(activityAliases[0].match(/<data android:mimeType="text\/plain" \/>/g)).toHaveSize(1);
      expect(activityAliases[1].match(/<data android:mimeType="image\/.*" \/>/g)).toHaveSize(2);
      expect(fileHandlingFeature.buildGradle.configs).toEqual([
        'resValue "string", "fileHandlingActionUrl0", "https://pwa-directory.com/"',
        'resValue "string", "fileHandlingActionUrl1", "https://pwa-directory.com/?image"',
      ]);
    });
  });
});
