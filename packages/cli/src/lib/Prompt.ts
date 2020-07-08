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
import * as inquirer from 'inquirer';

export type ValidateFunction<T> = (input: string) => Result<T, Error>;

export interface Prompt {
  /**
   * Prompts for free text input
   * @param message a short description of the input
   * @param defaultValue a default value or null
   * @param convertFunction a function that converts from the input string to the return value.
   * @param validateFunction an option function to validate the input.
   */
  promptInput<T>(
    message: string,
    defaultValue: string | null,
    convertFunction: ValidateFunction<T>,
  ): Promise<T>;

  /**
   * Prompts for free text input
   * @param message a short description of the input
   * @param choices a list of choices to be displayed to the user
   * @param defaultValue a default value or null
   * @param convertFunction a function that converts from the input string to the return value.
   * @param validateFunction an option function to validate the input.
   */
  promptChoice<T>(
    message: string,
    choices: string[],
    defaultValue: string | null,
    convertFunction: ValidateFunction<T>,
  ): Promise<T>;

  /**
   * Prompts for a password
   */
  promptPassword(
    message: string,
    validateFunction?: ValidateFunction<string>,
  ): Promise<string>;

  /**
   * Prompts a Yes/No dialog. Returns `true` for yes and `false` for no.
   */
  promptConfirm(message: string, defaultValue: boolean): Promise<boolean>;
}

// Builds an Inquirer validate function from a `ValidateFunction<T>`. From the inquirer docs:
//
// validate: (Function) Receive the user input and answers hash. Should return true if the
//           value is valid, and an error message (String) otherwise. If false is returned,
//           a default error message is provided.
function buildInquirerValidate<T>(convertFunction: ValidateFunction<T>):
    (input: string) => boolean | string {
  return (input: string): boolean | string => {
    const result = convertFunction(input);

    if (result.isOk()) {
      return true;
    }

    return result.unwrapError().message;
  };
}

export class InquirerPrompt implements Prompt {
  async promptInput<T>(
      message: string,
      defaultValue: string | null,
      convertFunction: ValidateFunction<T>,
  ): Promise<T> {
    const validate = buildInquirerValidate(convertFunction);

    const result = await inquirer.prompt({
      name: 'question',
      type: 'input',
      message: message,
      default: defaultValue,
      validate: validate,
    });

    return convertFunction(result.question).unwrap();
  }

  async promptChoice<T>(
      message: string,
      choices: string[],
      defaultValue: string | null,
      convertFunction: ValidateFunction<T>,
  ): Promise<T> {
    const validate = buildInquirerValidate(convertFunction);
    const result = await inquirer.prompt({
      name: 'question',
      type: 'list',
      message: message,
      default: defaultValue,
      choices: choices,
      validate: validate,
    });
    return convertFunction(result.question).unwrap();
  }

  async promptConfirm(message: string, defaultValue: boolean): Promise<boolean> {
    const result = await inquirer.prompt({
      name: 'question',
      type: 'confirm',
      message: message,
      default: defaultValue,
    });
    return result.question;
  }

  async promptPassword(message: string, validateFunction: ValidateFunction<string>):
      Promise<string> {
    const validate = buildInquirerValidate(validateFunction);
    const result = await inquirer.prompt({
      name: 'question',
      type: 'password',
      message: message,
      validate: validate,
      mask: '*',
    });
    return validateFunction(result.question).unwrap();
  }
}
