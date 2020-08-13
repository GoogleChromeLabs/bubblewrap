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
 * A class which usef for testing and which mocks user's input.
 */
export class MockPrompt implements Prompt {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  async printMessage(): Promise<void> {
  }

  /**
   * Sets the output to be the given message.
   * @param message the message to be returned.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async promptInput<T>(message: string): Promise<any> {
    const result = Promise.resolve({
      result: message,
    });
    return (await result).result;
  }

  /**
   * Sets the output to be the given message.
   * @param message the message to be returned.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async promptChoice<T>(message: string): Promise<any> {
    const result = Promise.resolve({
      result: message,
    });
    return (await result).result;
  }

  /**
   * Sets the output to be the given message.
   * @param defaultValue the value to be returned
   */
  async promptConfirm(message: string, defaultValue: boolean): Promise<boolean> {
    return defaultValue;
  }

  /**
   * Sets the output to be the givven message.
   * @param message the message to be returned.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async promptPassword(message: string): Promise<any> {
    const result = Promise.resolve({
      result: message,
    });
    return (await result).result;
  }
}
