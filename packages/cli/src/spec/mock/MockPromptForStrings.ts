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

import {Prompt, ValidateFunction} from '../../lib/Prompt';

/**
 * A class which used for testing and which mocks user's input.
 */
export class MockPromptForStrings implements Prompt {
  private responses: string[] = [];

  /**
   * Sets the next answer of this class to be the given message.
   * @param message the message to be returned in the next prompt message.
   */
  addMessage(message: string): void {
    this.responses.push(message);
  }

  async printMessage(): Promise<void> {
    // An empty function for testing.
  }

  /**
   * Sets the output to be the given message.
   * @param message the message to be prompt. Not relevant for tests.
   * @param {string | null} defaultValue a default value or null.
   * @param {ValidateFunction<T>} validateFunction a function to validate the input.
   * @returns {Promise<T>} a {@link Promise} that resolves to the validated loaded message,
   * converted to `T` by the `validateFunction`.
   */
  async promptInput<T>(_message: string,
      _defaultValue: string | null,
      validateFunction: ValidateFunction<T>): Promise<T> {
    const nextResponse = this.getNextMessage();
    return (await validateFunction(nextResponse)).unwrap();
  }

  /**
   * Sets the output to be the given message.
   * @param message the message to be prompt. Not relevant for tests.
   * @param {string[]} choices a list of choices. Not relevant for testing.
   * @param {string | null} defaultValue a default value or null.
   * @param {ValidateFunction<T>} validateFunction a function to validate the input.
   * @returns {Promise<T>} a {@link Promise} that resolves to the validated loaded message,
   * converted to `T` by the `validateFunction`.
   */
  async promptChoice<T>(_message: string,
      _choices: string[],
      _defaultValue: string | null,
      validateFunction: ValidateFunction<T>): Promise<T> {
    const nextResponse = this.getNextMessage();
    return (await validateFunction(nextResponse)).unwrap();
  }

  /**
   * Sets the output to be the given message.
   * @param message the message to be prompt. Not relevant for tests.
   * @param defaultValue the value to be returned
   * @returns {Promise<boolean>} a {@link Promise} that resolves to a {@link boolean} value. The
   * value will the `true` if the user answers `Yes` and `false` for `No`.
   */
  async promptConfirm(_message: string, defaultValue: boolean): Promise<boolean> {
    return defaultValue;
  }

  /**
   * Sets the output to be the given message.
   * @param message the message to be prompt. Not relevant for tests.
   * @param {ValidateFunction<T>} validateFunction a function to validate the input.
   * @returns {Promise<string>} a {@link Promise} that resolves to the user input validated by
   * `validateFunction`.
   */
  async promptPassword(_message: string, validateFunction: ValidateFunction<string>,
  ): Promise<string> {
    const nextResponse = this.getNextMessage();
    return (await validateFunction(nextResponse)).unwrap();
  }

  /**
   * Sets the output to be the given message.
   * @param {ValidateFunction<T>} validateFunction a function to validate the input.
   * @returns {string} which is the next message to be prompted`.
   */
  private getNextMessage(): string {
    if (this.responses.length < 0) {
      throw new Error('No answer was given. Please use addMessage(NextResponse) before' +
      ' using this function');
    }
    const nextResponse = this.responses[this.responses.length];
    this.responses.pop();
    return nextResponse;
  }
}
