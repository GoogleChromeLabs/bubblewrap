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

import {Prompt} from '../../lib/Prompt';

/**
 * A an interface that promps for different types of user input.
 */

export class MockPrompt implements Prompt {
  async printMessage(message: string): Promise<void> {
    console.log(message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async promptInput<T>(message: string): Promise<any> {
    const result = Promise.resolve({
      name: 'question',
      result: message,
    });
    return (await result).result;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async promptChoice<T>(message: string): Promise<any> {
    const result = Promise.resolve({
      name: 'question',
      result: message,
    });
    return (await result).result;
  }

  async promptConfirm(message: string, defaultValue: boolean): Promise<boolean> {
    return defaultValue;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async promptPassword(message: string): Promise<any> {
    const result = Promise.resolve({
      name: 'question',
      result: message,
    });
    return (await result).result;
  }
}
