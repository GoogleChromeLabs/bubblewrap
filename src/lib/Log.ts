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

/**
 * An utility class to print nice Log messages.
 */
export default class Log {
  tag_: string;
  prefix_: string;
  verbose_: boolean;
  output_: Console;

  /**
   * Creates a new Log instance
   * @param tag the tag used when logging. Printed at the beggining of a log message.
   * @param verbose if the Log is verbose. Debug messages are only printed on verbose logs.
   * @param output where to output the log messages.
   */
  constructor(tag = '', verbose = false, output = console) {
    this.tag_ = tag;
    this.verbose_ = verbose;
    this.prefix_ = this.inverse(tag);
    this.output_ = output;
  }

  /**
   * Prints a debug message to the Log. message is ignored if the Log is not set to verbose.
   * @param message the message the be printed.
   * @param args extra arguments for the console.
   */
  debug(message: string, ...args: string[]): void {
    if (!this.verbose_) {
      return;
    }
    this.log(this.output_.log, this.dim(message), ...args);
  }

  /**
   * Prints an info message to the Log. message is ignored if the Log is not set to verbose.
   * @param message the message the be printed.
   * @param args extra arguments for the console.
   */
  info(message: string, ...args: string[]): void {
    this.log(this.output_.log, message, ...args);
  }

  /**
   * Prints an warning message to the Log. message is ignored if the Log is not set to verbose.
   * @param message the message the be printed.
   * @param args extra arguments for the console.
   */
  warn(message: string, ...args: string[]): void {
    this.log(this.output_.warn, this.yellow('WARNING ' + message), ...args);
  }

  /**
   * Prints an error message to the Log. message is ignored if the Log is not set to verbose.
   * @param message the message the be printed.
   * @param args extra arguments for the console.
   */
  error(message: string, ...args: string[]): void {
    this.output_.log('\n');
    this.log(this.output_.error, this.red('ERROR ' + message), ...args);
    this.output_.log('\n');
  }

  /**
   * Changes the verbosity of the log.
   * @param isVerbose true if the log should be verbose.
   */
  verbose(isVerbose = true): void {
    this.verbose_ = isVerbose;
  }

  /**
   * Creates a new Log using the same output and verbositity of the current Log.
   * @param newTag the tag the be used on the new Log instance.
   */
  tag(newTag: string): Log {
    if (this.tag_) {
      newTag = this.tag_ + ' ' + newTag;
    }
    return new Log(newTag, this.verbose_, this.output_);
  }

  private log(fn: Function, message: string, ...args: string[]): void {
    if (this.prefix_) {
      message = this.prefix_ + ' ' + message;
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
