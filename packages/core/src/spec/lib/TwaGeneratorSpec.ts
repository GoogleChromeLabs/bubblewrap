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

import {TwaGenerator} from '../../lib/TwaGenerator';
import * as mockFs from 'mock-fs';
import {existsSync} from 'fs';

describe('TwaGenerator', () => {
  it('Builds an instance of TwaGenerator', () => {
    const twaGenerator = new TwaGenerator();
    expect(twaGenerator).not.toBeNull();
  });

  describe('#removeTwaProject', () => {
    it('Removes project files', async () => {
      mockFs({
        '/root': {
          'app': {
            'build.gradle': 'build.gradle content',
            'src': {
              'AndroidManifest.xml': 'Android Manifest',
            },
          },
          'gradle': {
            'gradlew.bat': 'gradlew content',
          },
          'settings.gradle': 'settings.gradle',
          'gradle.properties': 'gradle.properties',
          'build.gradle': 'build.gradle',
          'gradlew': 'gradlew',
          'gradlew.bat': 'gradle.bat',
          'twa-manifest.json': 'twa-manifest.json',
          'android.keystore': 'keystore',
        },
      });

      const twaGenerator = new TwaGenerator();
      await twaGenerator.removeTwaProject('/root');
      expect(existsSync('/root/app')).toBeFalse();
      expect(existsSync('/root/gradle')).toBeFalse();
      expect(existsSync('/root/settings.gradle')).toBeFalse();
      expect(existsSync('/root/build.gradle')).toBeFalse();
      expect(existsSync('/root/gradlew')).toBeFalse();
      expect(existsSync('/root/gradlew.bat')).toBeFalse();
      expect(existsSync('/root/twa-manifest.json')).toBeTrue();
      expect(existsSync('/root/android.keystore')).toBeTrue();
      mockFs.restore();
    });
  });
});
