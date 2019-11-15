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

const util = require('../../lib/util');

describe('util', () => {
  describe('findSuitableIcon', () => {
    it('returns null for an null manifest', () => {
      const result = util.findSuitableIcon(null, 'any');
      expect(result).toBeNull();
    });

    it('returns null for an empty manifest', () => {
      const result = util.findSuitableIcon({}, 'any');
      expect(result).toBeNull();
    });

    it('returns null for an empty icon list', () => {
      const result = util.findSuitableIcon({
        icons: [],
      }, 'any');
      expect(result).toBeNull();
    });

    it('returns null for a list with invalid icons', () => {
      const result = util.findSuitableIcon({
        icons: [{
          'src': '/favicons/android-chrome-192x192.png',
          'sizes': '192x192',
          'type': 'image/png',
        }],
      }, 'any');
      expect(result).toBeNull();
    });

    it('returns a icon suitable icon', () => {
      const result = util.findSuitableIcon({
        icons: [{
          'src': '/favicons/android-chrome-512x512.png',
          'sizes': '512x512',
          'type': 'image/png',
        }],
      }, 'any');
      expect(result.src).toBe('/favicons/android-chrome-512x512.png');
      expect(result.sizes).toBe('512x512');
      expect(result.type).toBe('image/png');
      expect(result.size).toBe(512);
    });

    it('returns null when not maskable icon is available', () => {
      const result = util.findSuitableIcon({
        icons: [{
          'src': '/favicons/android-chrome-512x512.png',
          'sizes': '512x512',
          'type': 'image/png',
        }],
      }, 'maskable');
      expect(result).toBeNull();
    });

    it('returns icon when not maskable icon is available', () => {
      const result = util.findSuitableIcon({
        icons: [{
          'src': '/favicons/android-chrome-512x512.png',
          'sizes': '512x512',
          'type': 'image/png',
        }, {
          'src': '/favicons/icon-maskable-7a2eb399.png',
          'sizes': '512x512',
          'type': 'image/png',
          'purpose': 'maskable',
        }],
      }, 'maskable');
      expect(result.src).toBe('/favicons/icon-maskable-7a2eb399.png');
      expect(result.sizes).toBe('512x512');
      expect(result.type).toBe('image/png');
      expect(result.purpose).toBe('maskable');
      expect(result.size).toBe(512);
    });
  });
});
