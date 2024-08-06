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

import {Result} from '../../lib/Result';

describe('Result', () => {
  describe('#ok()', () => {
    it('creates an `ok` result', () => {
      const message = 'I am ok';
      const result: Result<string, Error> = Result.ok(message);
      expect(result.isOk()).toBeTrue();
      expect(result.isError()).toBeFalse();
      expect(result.unwrap()).toEqual(message);
    });
  });

  describe('#error()', () => {
    it('creates an `error` result', () => {
      const errorMessage = 'This might be an error...';
      const error = new Error(errorMessage);
      const result: Result<string, Error> = Result.error(error);
      expect(result.isOk()).toBeFalse();
      expect(result.isError()).toBeTrue();
      expect(result.unwrap).toThrowError();
    });
  });

  describe('#unwrapOr()', () => {
    it('returns value when result is `ok`', () => {
      const message = 'I am ok';
      const defaultMessage = 'I am not ok';
      const result: Result<string, Error> = Result.ok(message);
      expect(result.isOk()).toBeTrue();
      expect(result.isError()).toBeFalse();
      expect(result.unwrapOr(defaultMessage)).toEqual(message);
    });

    it('returns default value when result is `error`', () => {
      const defaultMessage = 'I am not ok';
      const result: Result<string, Error> = Result.error(new Error('oopsy'));
      expect(result.isOk()).toBeFalse();
      expect(result.isError()).toBeTrue();
      expect(result.unwrapOr(defaultMessage)).toEqual(defaultMessage);
    });
  });

  describe('#unwrapError()', () => {
    it('returns the Error when result is `error`', () => {
      const error = new Error('I am not ok');
      const result: Result<string, Error> = Result.error(error);
      expect(result.isOk()).toBeFalse();
      expect(result.isError()).toBeTrue();
      expect(result.unwrapError()).toEqual(error);
    });

    it('throws exception when result is `ok`', () => {
      const result: Result<string, Error> = Result.ok('I have bad feeling about this...');
      expect(result.unwrapError).toThrowError();
    });
  });
});

