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

import * as inputHelpers from '../lib/inputHelpers';

const VALID_FINGERPRINT =
  '5F:7B:3E:88:A1:1E:13:96:88:34:5E:78:41:56:C1:90:75:7D:DB:CE:2E:7D:93:19:40:37:1D:1D:AA:F7:F3:F8';

describe('inputHelpers', () => {
  describe('#createValidateString', () => {
    it('Passes validations without constraints', async () => {
      const validate = inputHelpers.createValidateString();
      expect((await validate('')).isOk()).toBeTrue();
      expect((await validate('1234567890')).isOk()).toBeTrue();
    });

    it('Fails validations below minimum length', async () => {
      const validate = inputHelpers.createValidateString(3);
      expect((await validate('')).isError()).toBeTrue();
      expect((await validate('1')).isError()).toBeTrue();
      expect((await validate('12')).isError()).toBeTrue();
    });

    it('Passes validations above or equal minimum length', async () => {
      const validate = inputHelpers.createValidateString(3);
      expect((await validate('123')).isOk()).toBeTrue();
      expect((await validate('1234')).isOk()).toBeTrue();
    });

    it('Fails validations above maximum length', async () => {
      const validate = inputHelpers.createValidateString(undefined, 3);
      expect((await validate('1234')).isError()).toBeTrue();
      expect((await validate('12345')).isError()).toBeTrue();
    });

    it('Passes validations below or equal to maximum length', async () => {
      const validate = inputHelpers.createValidateString(undefined, 3);
      expect((await validate('123')).isOk()).toBeTrue();
      expect((await validate('12')).isOk()).toBeTrue();
      expect((await validate('1')).isOk()).toBeTrue();
      expect((await validate('')).isOk()).toBeTrue();
    });

    it('minLength and maxLength can be applied at the same time', async () => {
      const validate = inputHelpers.createValidateString(2, 3);
      expect((await validate('')).isError()).toBeTrue();
      expect((await validate('1')).isError()).toBeTrue();
      expect((await validate('12')).isOk()).toBeTrue();
      expect((await validate('123')).isOk()).toBeTrue();
      expect((await validate('1234')).isError()).toBeTrue();
    });
  });

  describe('#validatePackageId', () => {
    it('returns Ok for valid package ids', async () => {
      expect((await inputHelpers.validatePackageId('com.pwa_directory.appspot.com'))
          .isOk()).toBeTrue();
      expect((await inputHelpers.validatePackageId('com.pwa1directory.appspot.com'))
          .isOk()).toBeTrue();
    });

    it('returns Error for invalid package ids', async () => {
      expect((await inputHelpers.validatePackageId('com.pwa@directory.appspot.com'))
          .isError()).toBeTrue();
      expect((await inputHelpers.validatePackageId('com..example')).isError()).toBeTrue();
      expect((await inputHelpers.validatePackageId('')).isError()).toBeTrue();
      expect((await inputHelpers.validatePackageId('com.1char.twa')).isError()).toBeTrue();
    });
  });

  describe('#validateColor', () => {
    it('returns true for valid colors', async () => {
      expect((await inputHelpers.validateColor('#FF0033')).isOk()).toBeTrue();
      expect((await inputHelpers.validateColor('blue')).isOk()).toBeTrue();
      expect((await inputHelpers.validateColor('rgb(255, 0, 30)')).isOk()).toBeTrue();
    });

    it('throws Error for invalid colors', async () => {
      expect((await inputHelpers.validateColor('')).isError()).toBeTrue();
      expect((await inputHelpers.validateColor('abc')).isError()).toBeTrue();
      expect((await inputHelpers.validateColor('rgb(23, 0 30')).isError()).toBeTrue();
    });
  });

  describe('#validateDisplayMode', () => {
    it('returns Ok for valid display modes', async () => {
      expect((await inputHelpers.validateDisplayMode('fullscreen')).isOk()).toBeTrue();
      expect((await inputHelpers.validateDisplayMode('standalone')).isOk()).toBeTrue();
    });
    it('returns Error for invalid display modes', async () => {
      expect((await inputHelpers.validateDisplayMode('')).isError()).toBeTrue();
      expect((await inputHelpers.validateDisplayMode('immersive')).isError()).toBeTrue();
    });
  });

  describe('#validateUrl', () => {
    it('returns Ok for valid urls', async () => {
      expect((await inputHelpers.validateUrl('https://www.example.com')).isOk()).toBeTrue();
      expect((await inputHelpers.validateUrl('http://example.com')).isOk()).toBeTrue();
    });

    it('returns Error for invalid urls', async () => {
      expect((await inputHelpers.validateUrl('')).isError()).toBeTrue();
      expect((await inputHelpers.validateUrl('ftp://example.com')).isError()).toBeTrue();
    });
  });

  describe('#validateImageUrl', () => {
    it('returns Ok for valid urls', async () => {
      expect((await inputHelpers.validateImageUrl('https://www.example.com/test.png')).isOk())
          .toBeTrue();
      expect((await inputHelpers.validateImageUrl('http://example.com/sub/test.jpg'))
          .isOk()).toBeTrue();
    });

    it('returns Error for invalid urls', async () => {
      expect((await inputHelpers.validateImageUrl('')).isError()).toBeTrue();
      expect((await inputHelpers.validateImageUrl('ftp://example.com')).isError()).toBeTrue();
    });

    it('returns Error for non-image mime-types', async () => {
      expect((await inputHelpers.validateImageUrl('https://www.example.com/html.svg'))
          .isError()).toBeTrue();
    });

    it('returns Error for SVG images', async () => {
      expect((await inputHelpers.validateImageUrl('https://www.example.com/test.svg'))
          .isError()).toBeTrue();
    });
  });

  describe('#validateOptionalImageUrl', () => {
    it('returns Ok for valid urls', async () => {
      expect((await inputHelpers.validateImageUrl('https://www.example.com/test.png'))
          .isOk()).toBeTrue();
      expect((await inputHelpers.validateImageUrl('http://example.com/sub/test.jpg'))
          .isOk()).toBeTrue();
      expect((await inputHelpers.validateOptionalUrl('')).isOk()).toBeTrue();
      expect((await inputHelpers.validateOptionalUrl('')).unwrap()).toBeNull();
    });

    it('returns Error for invalid urls', async () => {
      expect((await inputHelpers.validateImageUrl('ftp://example.com')).isError()).toBeTrue();
    });

    it('returns Error for non-image mime-types', async () => {
      expect((await inputHelpers.validateImageUrl('https://www.example.com/html.svg'))
          .isError()).toBeTrue();
    });

    it('returns Error for SVG images', async () => {
      expect((await inputHelpers.validateImageUrl('https://www.example.com/test.svg'))
          .isError()).toBeTrue();
    });
  });

  describe('#validateOptionalUrl', () => {
    it('returns Ok for valid urls', async () => {
      expect((await inputHelpers.validateOptionalUrl('https://www.example.com'))
          .isOk()).toBeTrue();
      expect((await inputHelpers.validateOptionalUrl('http://example.com')).isOk()).toBeTrue();
      expect((await inputHelpers.validateOptionalUrl('')).isOk()).toBeTrue();
      expect((await inputHelpers.validateOptionalUrl('')).unwrap()).toBeNull();
    });

    it('returns Error for invalid urls', async () => {
      expect((await inputHelpers.validateOptionalUrl('ftp://example.com')).isError()).toBeTrue();
    });
  });

  describe('#validateHost', () => {
    it('returns Ok for valid urls', async () => {
      expect((await inputHelpers.validateHost('https://www.example.com')).isOk()).toBeTrue();
      expect((await inputHelpers.validateHost('example.com')).isOk()).toBeTrue();
      expect((await inputHelpers.validateHost('münich.com')).isOk()).toBeTrue();
    });
    it('returns Error for invalid hosts', async () => {
      expect((await inputHelpers.validateHost('http://www.example.com')).isError()).toBeTrue();
      expect((await inputHelpers.validateHost('ftp://www.example.com')).isError()).toBeTrue();
      expect((await inputHelpers.validateHost('')).isError()).toBeTrue();
      expect((await inputHelpers.validateHost('a b c')).isError()).toBeTrue();
    });
  });

  describe('#validateSha256Fingerprint', () => {
    it('Succeeds for valid fingerprints', async () => {
      expect((await inputHelpers.validateSha256Fingerprint(VALID_FINGERPRINT)).isOk()).toBeTrue();
    });
    it('Fails for invalid fingerprints', async () => {
      expect((await inputHelpers.validateSha256Fingerprint('abc123')).isError()).toBeTrue();
    });
  });
});
