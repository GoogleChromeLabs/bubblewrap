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

import {Result, fetchUtils} from '@bubblewrap/core';
import {Presets, Bar} from 'cli-progress';
import {green} from 'colors';
import * as inquirer from 'inquirer';

const KILOBYTE_SIZE = 1024;

/**
 * A function that takes a `string`, validates and tries to convert to the type `T`, and returns a
 * {@link Result}. If the conversion is successful, the result is `Ok` and unwrapping returns `T`.
 * Otherwise, the result is `Error` and `unwrapError()` returns the underlying error.
 * @param {string} input the value to be validated and converted.
 * @returns {Result<T, Error>} an `Ok` {@link Result} that unwraps `T` if the validation and
 * conversion are successful or an `Error` if it fails.
 */
export type ValidateFunction<T> = (input: string) => Promise<Result<T, Error>>;

/**
 * A an interface that promps for different types of user input.
 */
export interface Prompt {
  /**
   * Prints a message to the user.
   * @param message the message to be printed.
   */
  printMessage(message: string): Promise<void>;

  /**
   * Prompts for text input.
   * @param {string} message a short description of the input.
   * @param {string | null} defaultValue a default value or null.
   * @param {ValidateFunction<T>} validateFunction a function to validate the input.
   * @returns {Promise<T>} a {@link Promise} that resolves to the validated user input, converted
   * to `T` by the `validateFunction`.
   */
  promptInput<T>(
    message: string,
    defaultValue: string | null,
    validateFunction: ValidateFunction<T>,
  ): Promise<T>;

  /**
   * Displays a list of options to the user and prompts the user to choose one of them.
   * @param {string} message a short description of the input.
   * @param {string[]} choices a list of choices to be displayed to the user.
   * @param {string | null} defaultValue a default value or null.
   * @param {ValidateFunction<T>} validateFunction a function to validate the input.
   * @returns {Promise<T>} a {@link Promise} that resolves to the validated user input, converted
   * to `T` by the `validateFunction`.
   */
  promptChoice<T>(
    message: string,
    choices: string[],
    defaultValue: string | null,
    validateFunction: ValidateFunction<T>,
  ): Promise<T>;

  /**
   * Prompts the user for a password. The text typed by the user is hidden and replaced by the `*`
   * character.
   * @param {string} message a short description of the input.
   * @param {ValidateFunction<string>} validateFunction a function to validate the input.
   * @returns {Promise<string>} a {@link Promise} that resolves to the user input validated by
   * `validateFunction`.
   */
  promptPassword(
    message: string,
    validateFunction?: ValidateFunction<string>,
  ): Promise<string>;

  /**
   * Prompts a Yes/No dialog. Returns `true` for yes and `false` for no.
   * @param {string} message a short description of the input.
   * @param {boolean} defaultValue a default value.
   * @returns {Promise<boolean>} a {@link Promise} that resolves to a {@link boolean} value. The
   * value will the `true` if the user answers `Yes` and `false` for `No`.
   */
  promptConfirm(message: string, defaultValue: boolean): Promise<boolean>;

  /**
   * Downloads a file from `url` and saves it as `filename` and shows the download progress.
   * Optionaly, the total file size can be passed as `totalSize`.
   * @param url the url to download the file from.
   * @param filename the filename to save the file.
   * @param totalSize an optional total file size.
   */
  downloadFile(url: string, filename: string, totalSize?: number): Promise<void>;
}

// Builds an Inquirer validate function from a `ValidateFunction<T>`. From the inquirer docs:
//
// validate: (Function) Receive the user input and answers hash. Should return true if the
//           value is valid, and an error message (String) otherwise. If false is returned,
//           a default error message is provided.
function buildInquirerValidate<T>(validateFunction: ValidateFunction<T>):
    (input: string) => Promise<boolean | string> {
  return async (input: string): Promise<boolean | string> => {
    const result = await validateFunction(input);

    if (result.isOk()) {
      return true;
    }

    return result.unwrapError().message;
  };
}

/**
 * A {@link Prompt} implementation powered by inquirer.js (https://www.npmjs.com/package/inquirer)
 */
export class InquirerPrompt implements Prompt {
  async printMessage(message: string): Promise<void> {
    console.log(message);
  }

  async promptInput<T>(
      message: string,
      defaultValue: string | null,
      validateFunction: ValidateFunction<T>,
  ): Promise<T> {
    const validate = buildInquirerValidate(validateFunction);
    const result = await inquirer.prompt({
      name: 'question',
      type: 'input',
      message: message,
      default: defaultValue,
      validate: validate,
    });

    return (await validateFunction(result.question)).unwrap();
  }

  async promptChoice<T>(
      message: string,
      choices: string[],
      defaultValue: string | null,
      validateFunction: ValidateFunction<T>,
  ): Promise<T> {
    const validate = buildInquirerValidate(validateFunction);
    const result = await inquirer.prompt({
      name: 'question',
      type: 'list',
      message: message,
      default: defaultValue,
      choices: choices,
      validate: validate,
    });
    return (await validateFunction(result.question)).unwrap();
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
    return (await validateFunction(result.question)).unwrap();
  }

  async downloadFile(url: string, filename: string, totalSize = 0): Promise<void> {
    const progressBar = new Bar({
      format: ` >> [${green('{bar}')}] {percentage}% | {value}k of {total}k`,
    }, Presets.shades_classic);

    progressBar.start(Math.round(totalSize / KILOBYTE_SIZE), 0);
    await fetchUtils.downloadFile(url, filename, (current, total) => {
      if (total > 0 && total !== totalSize) {
        progressBar.setTotal(Math.round(total / KILOBYTE_SIZE));
        totalSize = total;
      }
      progressBar.update(Math.round(current / KILOBYTE_SIZE));
    });
    progressBar.stop();
  }
}
