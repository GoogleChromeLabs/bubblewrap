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
  private lastMessageIndex = -1;

  /**
   * Sets the next answer of this class to be the given message.
   * @param message the message to be returned in the next prompt message.
   */
  addMessage(message: string): void {
    this.responses.push(message);
    this.lastMessageIndex++;
  }

  async printMessage(): Promise<void> {
    // An empty function for testing.
  }

  /**
   * Sets the output to be the given message.
   * @param message the message to be returned.
   * @param {string | null} defaultValue a default value or null.
   * @param {ValidateFunction<T>} validateFunction a function to validate the input.
   */
  async promptInput<T>(message: string,
      _defaultValue: string | null,
      validateFunction: ValidateFunction<T>): Promise<T> {
    if (this.lastMessageIndex < 0) {
      throw new Error('No answer was given. Please use addMessage(NextResponse) before' +
      ' using this function');
    }
    const nextResponse = this.responses[this.lastMessageIndex--];
    this.responses.pop();
    return (await validateFunction(nextResponse)).unwrap();
  }


  /**
   * Sets the output to be the given message.
   * @param message the message to be returned.
   * @param {string[]} choices a list of choices. Not important for testing.
   * @param {string | null} defaultValue a default value or null.
   * @param {ValidateFunction<T>} validateFunction a function to validate the input.
   */

  async promptChoice<T>(
      _message: string,
      _choices: string[],
      _defaultValue: string | null,
      validateFunction: ValidateFunction<T>): Promise<T> {
    if (this.lastMessageIndex < 0) {
      throw new Error('No answer was given. Please use addMessage(NextResponse) before' +
      ' using this function');
    }
    const nextResponse = this.responses[this.lastMessageIndex--];
    this.responses.pop();
    return (await validateFunction(nextResponse)).unwrap();
  }

  /**
   * Sets the output to be the given message.
   * @param defaultValue the value to be returned
   */
  async promptConfirm(_message: string, defaultValue: boolean): Promise<boolean> {
    return defaultValue;
  }

  /**
   * Sets the output to be the givven message.
   * @param message the message to be returned.
   * @param {ValidateFunction<T>} validateFunction a function to validate the input.
   */

  async promptPassword(_message: string, validateFunction: ValidateFunction<string>,
  ): Promise<string> {
    if (this.lastMessageIndex < 0) {
      throw new Error('No answer was given. Please use addMessage(NextResponse) before' +
      ' using this function');
    }
    const nextResponse = this.responses[this.lastMessageIndex--];
    this.responses.pop();
    return (await validateFunction(nextResponse)).unwrap();
  }
}
