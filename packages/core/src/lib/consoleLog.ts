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

import { Log } from "..";

/**
 * An utility class to print nice Log messages.
 */
export class consoleLog implements Log{
  private tag: string;
  private prefix: string;
  private output: Console;

  /**
   * The verbosity of the Log. "debug" messages are ignored if verbose is set to false.
   */
  public verbose: boolean;

  /**
   * Creates a new Log instance
   * @param tag the tag used when logging. Printed at the beggining of a log message.
   * @param verbose if the Log is verbose. Debug messages are only printed on verbose logs.
   * @param output where to output the log messages.
   */
  constructor(tag = '', verbose = false, output = console) {
    this.tag = tag;
    this.verbose = verbose;
    this.prefix = this.inverse(tag);
    this.output = output;
  }

  /**
   * Prints a debug message to the Log. message is ignored if the Log is not set to verbose.
   * @param message the message the be printed.
   * @param args extra arguments for the console.
   */
  debug(message: string, ...args: string[]): void {
    if (!this.verbose) {
      return;
    }
    this.log(this.output.log, this.dim(message), ...args);
  }

  /**
   * Prints an info message to the Log. message is ignored if the Log is not set to verbose.
   * @param message the message the be printed.
   * @param args extra arguments for the console.
   */
  info(message: string, ...args: string[]): void {
    this.log(this.output.log, message, ...args);
  }

  /**
   * Prints an warning message to the Log. message is ignored if the Log is not set to verbose.
   * @param message the message the be printed.
   * @param args extra arguments for the console.
   */
  warn(message: string, ...args: string[]): void {
    this.log(this.output.warn, this.yellow('WARNING ' + message), ...args);
  }

  /**
   * Prints an error message to the Log. message is ignored if the Log is not set to verbose.
   * @param message the message the be printed.
   * @param args extra arguments for the console.
   */
  error(message: string, ...args: string[]): void {
    this.output.error('\n');
    this.log(this.output.error, this.red('ERROR ' + message), ...args);
    this.output.error('\n');
  }

  /**
   * Creates a new Log using the same output and verbositity of the current Log.
   * @param newTag the tag the be used on the new Log instance.
   */
  newLog(newTag: string): consoleLog {
    if (this.tag) {
      newTag = this.tag + ' ' + newTag;
    }
    return new consoleLog(newTag, this.verbose, this.output);
  }

  private log(fn: Function, message: string, ...args: string[]): void {
    if (this.prefix) {
      message = this.prefix + ' ' + message;
    }
    if (args) {
      fn(...[message].concat(args));
    } else {
      fn(message);
    }
  }

  private inverse(input: string): string {
    return `\x1b[7m${input}\x1b[0m`;
  }

  private dim(input: string): string {
    return `\x1b[36m${input}\x1b[0m`;
  }

  private yellow(input: string): string {
    return `\x1b[33m${input}\x1b[0m`;
  }

  private red(input: string): string {
    return `\x1b[31m${input}\x1b[0m`;
  }
}
