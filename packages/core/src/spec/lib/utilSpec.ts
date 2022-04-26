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
import * as mockFs from 'mock-fs';
import {existsSync} from 'fs';

describe('util', () => {
  describe('#findSuitableIcon', () => {
    it('returns null for an empty icon list', () => {
      const result = util.findSuitableIcon([], 'any');
      expect(result).toBeNull();
    });

    it('returns null for an undefined icon list', () => {
      expect(util.findSuitableIcon(undefined, 'any')).toBeNull();
    });

    it('Accepts SVG Icons by mime-type', () => {
      const result = util.findSuitableIcon(
          [{
            'src': '/favicons/android-chrome-192x192.svg',
            'sizes': '192x192',
            'mimeType': 'image/svg',
          }], 'any');
      expect(result).not.toBeNull();
    });

    it('Accepts SVG Icons by extension', () => {
      const result = util.findSuitableIcon(
          [{
            'src': '/favicons/android-chrome-192x192.svg',
            'sizes': '192x192',
          }], 'any');
      expect(result).not.toBeNull();
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
    it('returns null for empty input', () => {
      expect(util.generatePackageId('')).toBeNull();
    });

    it('returns null for input that generates an empty package', () => {
      expect(util.generatePackageId('..')).toBeNull();
    });

    it('returns null for input that outputs packages with sectons starting with numbers', () => {
      expect(util.generatePackageId('1pwadirectory')).toBe('1pwadirectory.twa');
    });

    it('handles input with multiple dashes', () => {
      const result = util.generatePackageId('pwa-directory-test.appspot.com');
      expect(result).toBe('com.appspot.pwa_directory_test.twa');
    });

    it('handles input with spaces', () => {
      const result = util.generatePackageId('pwa directory test.appspot.com');
      expect(result).toBe('com.appspot.pwa_directory_test.twa');
    });

    it('handles input that generates empty section', () => {
      expect(util.generatePackageId('.pwadirectory')).toBe('pwadirectory.twa');
      expect(util.generatePackageId('pwadirectory.')).toBe('pwadirectory.twa');
      expect(util.generatePackageId('pwa..directory.')).toBe('directory.pwa.twa');
    });
  });

  describe('#validateNotEmpty', () => {
    it('throws Error for empty strings', async () => {
      expect(util.validateNotEmpty('', 'Error')).not.toBeNull();
      expect(util.validateNotEmpty('  ', 'Error')).not.toBeNull();
      expect(util.validateNotEmpty(null, 'Error')).not.toBeNull();
      expect(util.validateNotEmpty(undefined, 'Error')).not.toBeNull();
    });

    it('returns true for non-empty input', async () => {
      expect(util.validateNotEmpty('a', 'Error')).toBeNull();
    });
  });

  describe('#validatePackageId', () => {
    it('returns true for valid packages', () => {
      expect(util.validatePackageId('com.pwa_directory.appspot.com')).toBeNull();
      expect(util.validatePackageId('com.pwa1directory.appspot.com')).toBeNull();
    });

    it('returns false for packages with invalid characters', () => {
      expect(util.validatePackageId('com.pwa-directory.appspot.com')).not.toBeNull();
      expect(util.validatePackageId('com.pwa@directory.appspot.com')).not.toBeNull();
      expect(util.validatePackageId('com.pwa*directory.appspot.com')).not.toBeNull();
      expect(util.validatePackageId('com․pwa-directory.appspot.com')).not.toBeNull();
    });

    it('returns false for packages empty sections', () => {
      expect(util.validatePackageId('com.example.')).not.toBeNull();
      expect(util.validatePackageId('.com.example')).not.toBeNull();
      expect(util.validatePackageId('com..example')).not.toBeNull();
    });

    it('packages with less than 2 sections return false', () => {
      expect(util.validatePackageId('com')).not.toBeNull();
      expect(util.validatePackageId('')).not.toBeNull();
    });

    it('packages starting with non-letters return false', () => {
      expect(util.validatePackageId('com.1char.twa')).not.toBeNull();
      expect(util.validatePackageId('1com.char.twa')).not.toBeNull();
      expect(util.validatePackageId('com.char.1twa')).not.toBeNull();
      expect(util.validatePackageId('_com.char.1twa')).not.toBeNull();
    });
  });

  describe('rmdirs', () => {
    it('Deletes a single file', async () => {
      mockFs({'/app.txt': 'Test Content'});
      await util.rmdir('/app.txt');
      expect(existsSync('/app.txt')).toBeFalse();
      mockFs.restore();
    });

    it('Deletes a directory', async () => {
      mockFs({
        '/test': {
          'app.txt': 'Test Content',
          'subdirectory': {
            'file2.txt': 'Test Content 2',
          },
        },
        '/other-file.txt': 'This should not be deleted',
      });
      await util.rmdir('/test');
      expect(existsSync('/test')).toBeFalse();
      expect(existsSync('/other-file.txt')).toBeTrue();
      mockFs.restore();
    });

    it('Skips empty directory', async () => {
      mockFs({});
      await expectAsync(util.rmdir('/app.txt')).toBeResolved();
      mockFs.restore();
    });
  });

  describe('#toAndroidScreenOrientation', () => {
    it('Returns the correct orientation', () => {
      expect(util.toAndroidScreenOrientation('portrait'))
          .toEqual('ActivityInfo.SCREEN_ORIENTATION_USER_PORTRAIT');
      expect(util.toAndroidScreenOrientation('portrait-primary'))
          .toEqual('ActivityInfo.SCREEN_ORIENTATION_PORTRAIT');
      expect(util.toAndroidScreenOrientation('portrait-secondary'))
          .toEqual('ActivityInfo.SCREEN_ORIENTATION_REVERSE_PORTRAIT');
      expect(util.toAndroidScreenOrientation('landscape'))
          .toEqual('ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE');
      expect(util.toAndroidScreenOrientation('landspace-primary'))
          .toEqual('ActivityInfo.SCREEN_ORIENTATION_USER_LANDSCAPE');
      expect(util.toAndroidScreenOrientation('landscape-secondary'))
          .toEqual('ActivityInfo.SCREEN_ORIENTATION_REVERSE_LANDSCAPE');
      expect(util.toAndroidScreenOrientation('default'))
          .toEqual('ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED');
      expect(util.toAndroidScreenOrientation('any'))
          .toEqual('ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED');
      expect(util.toAndroidScreenOrientation('natural'))
          .toEqual('ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED');
    });

    it('Returns unspecified for invalid values', () => {
      expect(util.toAndroidScreenOrientation(''))
          .toEqual('ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED');
    });
  });

  describe('#escapeGradleString', () => {
    it('Escapes single quotes', () => {
      expect(util.escapeGradleString('Single quote \''))
          .toEqual('Single quote \\\\\\\'');
    });

    it('Escapes backwards slashes', () => {
      expect(util.escapeGradleString('Backwards slash \\'))
          .toEqual('Backwards slash \\\\\\\\');
    });
  });

  describe('#escapeDoubleQuotedShellString', () => {
    it('Escapes \\, `, $, and "', () => {
      expect(util.escapeDoubleQuotedShellString('"$Hello\\Wo`eld"'))
          .toEqual('\\"\\$Hello\\\\Wo\\`eld\\"');
    });
  });

  describe('#escapeJsonString combined with #escapeGradleString returns the expected results',
   () => {
    it ('Escapes double and single quotes', () => {
      // String.raw prevents escape characters from being applied, so we can simplify howe we write
      // the expected value.
      let expected = String.raw`\\"Hello Worl\\\'d\\"`;
      expect(util.escapeJsonString(util.escapeGradleString(`"Hello Worl'd"`)))
          .toEqual(expected);
    });
  });
});
