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
  describe('#notEmpty', () => {
    it('throws Error for empty strings', async () => {
      await expectAsync(inputHelpers.notEmpty('', 'Error')).toBeRejectedWithError();
      await expectAsync(inputHelpers.notEmpty('  ', 'Error')).toBeRejectedWithError();
    });

    it('returns true for non-empty input', async () => {
      expect(await inputHelpers.notEmpty('a', 'Error')).toBeTrue();
    });
  });

  describe('#validateKeyPassword', () => {
    it('throws Error for empty string', async () => {
      await expectAsync(inputHelpers.validateKeyPassword('')).toBeRejectedWithError();
      await expectAsync(inputHelpers.validateKeyPassword(' ')).toBeRejectedWithError();
    });

    it('throws Error input with less than 6 characters', async () => {
      await expectAsync(inputHelpers.validateKeyPassword('a')).toBeRejectedWithError();
      await expectAsync(inputHelpers.validateKeyPassword('abc')).toBeRejectedWithError();
      await expectAsync(inputHelpers.validateKeyPassword('abcde')).toBeRejectedWithError();
      await expectAsync(inputHelpers.validateKeyPassword('abcde ')).toBeRejectedWithError();
    });

    it('returns true for valid input', async () => {
      expect(await inputHelpers.validateKeyPassword('abcdef')).toBeTrue();
      expect(await inputHelpers.validateKeyPassword('abcdef ')).toBeTrue();
    });
  });

  describe('#validateColor', () => {
    it('returns true for valid colors', async () => {
      expect(await inputHelpers.validateColor('#FF0033'));
      expect(await inputHelpers.validateColor('blue'));
      expect(await inputHelpers.validateColor('rgb(255, 0, 30)'));
    });

    it('throws Error for invalid colors', async () => {
      await expectAsync(inputHelpers.validateColor('')).toBeRejectedWithError();
      await expectAsync(inputHelpers.validateColor('abc')).toBeRejectedWithError();
      await expectAsync(
          inputHelpers.validateColor('rgb(23, 0 30')).toBeRejectedWithError();
    });
  });
});
