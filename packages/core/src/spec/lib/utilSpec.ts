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

import * as util from '../../lib/util';

describe('util', () => {
  describe('#findSuitableIcon', () => {
    it('returns null for an empty icon list', () => {
      const result = util.findSuitableIcon([], 'any');
      expect(result).toBeNull();
    });

    it('returns any icon if no minSize is provided', () => {
      const result = util.findSuitableIcon(
          [{
            'src': '/favicons/android-chrome-192x192.png',
            'sizes': '192x192',
            'mimeType': 'image/png',
          }], 'any');
      expect(result).not.toBeNull();
      // The test aborts when the expectation above fails, but `tsc` doesn't now it
      // and compilation fails pointing that `result` could be null on the tests below.
      //
      // TODO(andreban): Investigate if it's possible to get `tsc` to understand the tests below
      // don't run if the test above fails.
      if (result === null) return;
      expect(result.src).toBe('/favicons/android-chrome-192x192.png');
      expect(result.sizes).toBe('192x192');
      expect(result.mimeType).toBe('image/png');
      expect(result.size).toBe(192);
    });

    it('returns any icon if `sizes` is undefined', () => {
      const result = util.findSuitableIcon(
          [{
            'src': '/favicons/android-chrome-192x192.png',
            'mimeType': 'image/png',
          }], 'any');
      expect(result).not.toBeNull();

      // The test aborts when the expectation above fails, but `tsc` doesn't now it
      // and compilation fails pointing that `result` could be null on the tests below.
      //
      // TODO(andreban): Investigate if it's possible to get `tsc` to understand the tests below
      // don't run if the test above fails.
      if (result === null) return;
      expect(result.src).toBe('/favicons/android-chrome-192x192.png');
      expect(result.mimeType).toBe('image/png');
      expect(result.size).toBe(0);
    });

    it('returns null if an icon larger than minSize is not found', () => {
      const result = util.findSuitableIcon(
          [{
            'src': '/favicons/android-chrome-192x192.png',
            'sizes': '192x192',
            'mimeType': 'image/png',
          }], 'any', 512);
      expect(result).toBeNull();
    });

    it('returns a icon suitable icon', () => {
      const result = util.findSuitableIcon([{
        'src': '/favicons/android-chrome-512x512.png',
        'sizes': '512x512',
        'mimeType': 'image/png',
      }], 'any', 512);
      expect(result).not.toBeNull();
      // The test aborts when the expectation above fails, but `tsc` doesn't now it
      // and compilation fails pointing that `result` could be null on the tests below.
      //
      // TODO(andreban): Investigate if it's possible to get `tsc` to understand the tests below
      // don't run if the test above fails.
      if (result === null) return;
      expect(result.src).toBe('/favicons/android-chrome-512x512.png');
      expect(result.sizes).toBe('512x512');
      expect(result.mimeType).toBe('image/png');
      expect(result.size).toBe(512);
    });

    it('returns null when no maskable icon is available', () => {
      const result = util.findSuitableIcon(
          [{
            'src': '/favicons/android-chrome-512x512.png',
            'sizes': '512x512',
            'mimeType': 'image/png',
          }], 'maskable', 512);
      expect(result).toBeNull();
    });

    it('returns icon when a maskable icon is available', () => {
      const result = util.findSuitableIcon([{
        'src': '/favicons/android-chrome-512x512.png',
        'sizes': '512x512',
        'mimeType': 'image/png',
      }, {
        'src': '/favicons/icon-maskable-7a2eb399.png',
        'sizes': '512x512',
        'mimeType': 'image/png',
        'purpose': 'maskable',
      }], 'maskable', 512);
      expect(result).not.toBeNull();
      // The test aborts when the expectation above fails, but `tsc` doesn't now it
      // and compilation fails pointing that `result` could be null on the tests below.
      //
      // TODO(andreban): Investigate if it's possible to get `tsc` to understand the tests below
      // don't run if the test above fails.
      if (result === null) return;
      expect(result.src).toBe('/favicons/icon-maskable-7a2eb399.png');
      expect(result.sizes).toBe('512x512');
      expect(result.mimeType).toBe('image/png');
      expect(result.purpose).toBe('maskable');
      expect(result.size).toBe(512);
    });
  });

  describe('#generatePackageId', () => {
    it('handles URL with multiple dashes', () => {
      const result = util.generatePackageId('pwa-directory-test.appspot.com');
      expect(result).toBe('com.appspot.pwa_directory_test.twa');
    });
    it('handles URL with spaces', () => {
      const result = util.generatePackageId('pwa directory test.appspot.com');
      expect(result).toBe('com.appspot.pwa_directory_test.twa');
    });
  });

  describe('#validatePackageId', () => {
    it('returns true for valid packages', () => {
      expect(util.validatePackageId('com.pwa_directory.appspot.com')).toBeTrue();
      expect(util.validatePackageId('com.pwa1directory.appspot.com')).toBeTrue();
    });

    it('returns false for packages with invalid characters', () => {
      expect(util.validatePackageId('com.pwa-directory.appspot.com')).toBeFalse();
      expect(util.validatePackageId('com.pwa@directory.appspot.com')).toBeFalse();
      expect(util.validatePackageId('com.pwa*directory.appspot.com')).toBeFalse();
      expect(util.validatePackageId('com․pwa-directory.appspot.com')).toBeFalse();
    });

    it('returns false for packages empty sections', () => {
      expect(util.validatePackageId('com.example.')).toBeFalse();
      expect(util.validatePackageId('.com.example')).toBeFalse();
      expect(util.validatePackageId('com..example')).toBeFalse();
    });

    it('packages with less than 2 sections return false', () => {
      expect(util.validatePackageId('com')).toBeFalse();
      expect(util.validatePackageId('')).toBeFalse();
    });

    it('packages starting with non-letters return false', () => {
      expect(util.validatePackageId('com.1char.twa')).toBeFalse();
      expect(util.validatePackageId('1com.char.twa')).toBeFalse();
      expect(util.validatePackageId('com.char.1twa')).toBeFalse();
      expect(util.validatePackageId('_com.char.1twa')).toBeFalse();
    });
  });
});
