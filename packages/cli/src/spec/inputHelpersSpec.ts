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

describe('inputHelpers', () => {
  describe('#createValidateString', () => {
    it('Passes validations without constraints', () => {
      const validate = inputHelpers.createValidateString();
      expect(validate('').isOk()).toBeTrue();
      expect(validate('1234567890').isOk()).toBeTrue();
    });

    it('Fails validations below minimum length', () => {
      const validate = inputHelpers.createValidateString(3);
      expect(validate('').isError()).toBeTrue();
      expect(validate('1').isError()).toBeTrue();
      expect(validate('12').isError()).toBeTrue();
    });

    it('Passes validations above or equal minimum length', () => {
      const validate = inputHelpers.createValidateString(3);
      expect(validate('123').isOk()).toBeTrue();
      expect(validate('1234').isOk()).toBeTrue();
    });

    it('Fails validations above maximum length', () => {
      const validate = inputHelpers.createValidateString(undefined, 3);
      expect(validate('1234').isError()).toBeTrue();
      expect(validate('12345').isError()).toBeTrue();
    });

    it('Passes validations below or equal to maximum length', () => {
      const validate = inputHelpers.createValidateString(undefined, 3);
      expect(validate('123').isOk()).toBeTrue();
      expect(validate('12').isOk()).toBeTrue();
      expect(validate('1').isOk()).toBeTrue();
      expect(validate('').isOk()).toBeTrue();
    });

    it('minLength and maxLength can be applied at the same time', () => {
      const validate = inputHelpers.createValidateString(2, 3);
      expect(validate('').isError()).toBeTrue();
      expect(validate('1').isError()).toBeTrue();
      expect(validate('12').isOk()).toBeTrue();
      expect(validate('123').isOk()).toBeTrue();
      expect(validate('1234').isError()).toBeTrue();
    });
  });

  describe('#validatePackageId', () => {
    it('returns Ok for valid package ids', () => {
      expect(inputHelpers.validatePackageId('com.pwa_directory.appspot.com').isOk()).toBeTrue();
      expect(inputHelpers.validatePackageId('com.pwa1directory.appspot.com').isOk()).toBeTrue();
    });

    it('returns Error for invalid package ids', () => {
      expect(inputHelpers.validatePackageId('com.pwa@directory.appspot.com').isError()).toBeTrue();
      expect(inputHelpers.validatePackageId('com..example').isError()).toBeTrue();
      expect(inputHelpers.validatePackageId('').isError()).toBeTrue();
      expect(inputHelpers.validatePackageId('com.1char.twa').isError()).toBeTrue();
    });
  });

  describe('#validateColor', () => {
    it('returns true for valid colors', () => {
      expect(inputHelpers.validateColor('#FF0033').isOk()).toBeTrue();
      expect(inputHelpers.validateColor('blue').isOk()).toBeTrue();
      expect(inputHelpers.validateColor('rgb(255, 0, 30)').isOk()).toBeTrue();
    });

    it('throws Error for invalid colors', () => {
      expect(inputHelpers.validateColor('').isError()).toBeTrue();
      expect(inputHelpers.validateColor('abc').isError()).toBeTrue();
      expect(inputHelpers.validateColor('rgb(23, 0 30').isError()).toBeTrue();
    });
  });

  describe('#validateDisplayMode', () => {
    it('returns Ok for valid display modes', () => {
      expect(inputHelpers.validateDisplayMode('fullscreen').isOk()).toBeTrue();
      expect(inputHelpers.validateDisplayMode('standalone').isOk()).toBeTrue();
    });
    it('returns Error for invalid display modes', () => {
      expect(inputHelpers.validateDisplayMode('').isError()).toBeTrue();
      expect(inputHelpers.validateDisplayMode('immersive').isError()).toBeTrue();
    });
  });

  describe('#validateUrl', () => {
    it('returns Ok for valid urls', () => {
      expect(inputHelpers.validateUrl('https://www.example.com').isOk()).toBeTrue();
      expect(inputHelpers.validateUrl('http://example.com').isOk()).toBeTrue();
    });

    it('returns Error for invalid urls', () => {
      expect(inputHelpers.validateUrl('').isError()).toBeTrue();
      expect(inputHelpers.validateUrl('ftp://example.com').isError()).toBeTrue();
    });
  });

  describe('#validateImageUrl', () => {
    it('returns Ok for valid urls', () => {
      expect(inputHelpers.validateImageUrl('https://www.example.com/test.png').isOk()).toBeTrue();
      expect(inputHelpers.validateImageUrl('http://example.com/sub/test.jpg').isOk()).toBeTrue();
    });

    it('returns Error for invalid urls', () => {
      expect(inputHelpers.validateImageUrl('').isError()).toBeTrue();
      expect(inputHelpers.validateImageUrl('ftp://example.com').isError()).toBeTrue();
    });

    it('returns Error for non-image mime-types', () => {
      expect(
          inputHelpers.validateImageUrl('https://www.example.com/html.svg').isError()).toBeTrue();
    });

    it('returns Error for SVG images', () => {
      expect(
          inputHelpers.validateImageUrl('https://www.example.com/test.svg').isError()).toBeTrue();
    });
  });

  describe('#validateOptionalImageUrl', () => {
    it('returns Ok for valid urls', () => {
      expect(inputHelpers.validateImageUrl('https://www.example.com/test.png').isOk()).toBeTrue();
      expect(inputHelpers.validateImageUrl('http://example.com/sub/test.jpg').isOk()).toBeTrue();
      expect(inputHelpers.validateOptionalUrl('').isOk()).toBeTrue();
      expect(inputHelpers.validateOptionalUrl('').unwrap()).toBeNull();
    });

    it('returns Error for invalid urls', () => {
      expect(inputHelpers.validateImageUrl('ftp://example.com').isError()).toBeTrue();
    });

    it('returns Error for non-image mime-types', () => {
      expect(
          inputHelpers.validateImageUrl('https://www.example.com/html.svg').isError()).toBeTrue();
    });

    it('returns Error for SVG images', () => {
      expect(
          inputHelpers.validateImageUrl('https://www.example.com/test.svg').isError()).toBeTrue();
    });
  });

  describe('#validateOptionalUrl', () => {
    it('returns Ok for valid urls', () => {
      expect(inputHelpers.validateOptionalUrl('https://www.example.com').isOk()).toBeTrue();
      expect(inputHelpers.validateOptionalUrl('http://example.com').isOk()).toBeTrue();
      expect(inputHelpers.validateOptionalUrl('').isOk()).toBeTrue();
      expect(inputHelpers.validateOptionalUrl('').unwrap()).toBeNull();
    });

    it('returns Error for invalid urls', () => {
      expect(inputHelpers.validateOptionalUrl('ftp://example.com').isError()).toBeTrue();
    });
  });

  describe('#validateHost', () => {
    it('returns Ok for valid urls', () => {
      expect(inputHelpers.validateHost('https://www.example.com').isOk()).toBeTrue();
      expect(inputHelpers.validateHost('example.com').isOk()).toBeTrue();
      expect(inputHelpers.validateHost('münich.com').isOk()).toBeTrue();
    });
    it('returns Error for invalid hosts', () => {
      expect(inputHelpers.validateHost('http://www.example.com').isError()).toBeTrue();
      expect(inputHelpers.validateHost('ftp://www.example.com').isError()).toBeTrue();
      expect(inputHelpers.validateHost('').isError()).toBeTrue();
      expect(inputHelpers.validateHost('a b c').isError()).toBeTrue();
    });
  });
});
