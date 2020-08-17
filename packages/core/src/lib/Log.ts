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

/**
 * An interface for loggers.
 */
export interface Log {

  /**
   * Prints a debug message to the Log. Message is ignored if the Log is not set to verbose.
   * @param message the message the be printed.
   * @param args extra arguments for the console.
   */
  debug(message: string, ...args: string[]): void;

  /**
   * Prints an info message to the Log. Message is ignored if the Log is not set to verbose.
   * @param message The message the be printed.
   * @param args Extra arguments for the console.
   */
  info(message: string, ...args: string[]): void;

  /**
   * Prints an warning message to the Log. Message is ignored if the Log is not set to verbose.
   * @param message The message the be printed.
   * @param args Extra arguments for the console.
   */
  warn(message: string, ...args: string[]): void;
  /**
   * Prints an error message to the Log. Message is ignored if the Log is not set to verbose.
   * @param message The message the be printed.
   * @param args Extra arguments for the console.
   */
  error(message: string, ...args: string[]): void;

  setVerbose(verbose: boolean): void;
};

/**
 * An utility class to print nice Log messages.
 */
export class ConsoleLog implements Log {
  private tag: string;
  private prefix: string;
  private output: Console;

  /**
   * The verbosity of the Log. "debug" messages are ignored if verbose is set to false.
   */
  public verbose: boolean;

  /**
   * Creates a new Log instance
   * @param tag The tag used when logging. Printed at the beggining of a log message.
   * @param verbose If the Log is verbose. Debug messages are only printed on verbose logs.
   * @param output Where to output the log messages.
   */
  constructor(tag = '', verbose = false, output = console) {
    this.tag = tag;
    this.verbose = verbose;
    this.prefix = this.inverse(tag);
    this.output = output;
  }

  /**
   * Prints a debug message to the Log. Message is ignored if the Log is not set to verbose.
   * @param message The message the be printed.
   * @param args Extra arguments for the console.
   */
  debug(message: string, ...args: string[]): void {
    if (!this.verbose) {
      return;
    }
    this.log(this.output.log, this.dim(message), ...args);
  }

  /**
   * Prints an info message to the Log. Message is ignored if the Log is not set to verbose.
   * @param message The message the be printed.
   * @param args Extra arguments for the console.
   */
  info(message: string, ...args: string[]): void {
    this.log(this.output.log, message, ...args);
  }

  /**
   * Prints an warning message to the Log. Message is ignored if the Log is not set to verbose.
   * @param message The message the be printed.
   * @param args Extra arguments for the console.
   */
  warn(message: string, ...args: string[]): void {
    this.log(this.output.warn, this.yellow('WARNING ' + message), ...args);
  }

  /**
   * Prints an error message to the Log. Message is ignored if the Log is not set to verbose.
   * @param message The message the be printed.
   * @param args Extra arguments for the console.
   */
  error(message: string, ...args: string[]): void {
    this.output.error('\n');
    this.log(this.output.error, this.red('ERROR ' + message), ...args);
    this.output.error('\n');
  }

  /**
   * Sets the verbose.
   * @param verbose The verbose value to set.
   */
  setVerbose(verbose: boolean): void {
    this.verbose = verbose;
  }

  /**
   * Creates a new Log using the same output and verbositity of the current Log.
   * @param newTag The tag the be used on the new Log instance.
   */
  newLog(newTag: string): ConsoleLog {
    if (this.tag) {
      newTag = this.tag + ' ' + newTag;
    }
    return new ConsoleLog(newTag, this.verbose, this.output);
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
