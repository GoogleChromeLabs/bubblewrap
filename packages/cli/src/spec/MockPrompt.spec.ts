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

import {Result} from '@bubblewrap/core';
import {MockPrompt} from './mock/MockPrompt';

async function validationFunction(message: string): Promise<Result<string, Error>> {
  return Result.ok(message);
}

describe('MockPrompt', () => {
  describe('#promptInput', () => {
    it('Checks if the correct messages are being prompted using promptInput', async () => {
      const mock = new MockPrompt();
      mock.addMessage('first');
      mock.addMessage('second');
      expect(await mock.promptInput('', null, validationFunction)).toBe('first');
      expect(await mock.promptInput('', null, validationFunction)).toBe('second');
      mock.addMessage('third');
      expect(await mock.promptInput('', null, validationFunction)).toBe('third');
    });
  });

  describe('#promptChoice', () => {
    it('Checks if the correct messages are being prompted using promptChoice', async () => {
      const mock = new MockPrompt();
      mock.addMessage('first');
      mock.addMessage('second');
      expect(await mock.promptChoice('', [], null, validationFunction)).toBe('first');
      expect(await mock.promptChoice('', [], null, validationFunction)).toBe('second');
      mock.addMessage('third');
      expect(await mock.promptChoice('', [], null, validationFunction)).toBe('third');
    });
  });

  describe('#promptPassword', () => {
    it('Checks if the correct messages are being prompted using promptPassword', async () => {
      const mock = new MockPrompt();
      mock.addMessage('first');
      mock.addMessage('second');
      expect(await mock.promptPassword('', validationFunction)).toBe('first');
      expect(await mock.promptPassword('', validationFunction)).toBe('second');
      mock.addMessage('third');
      expect(await mock.promptPassword('', validationFunction)).toBe('third');
    });
  });
});
