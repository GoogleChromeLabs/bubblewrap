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

import {Log} from '..';

/**
 * An utility class to print nice Log messages.
 */
export class MockLog implements Log {
    /**
     * Creates a new Log instance
     * @param tag the tag used when logging. Printed at the beggining of a log message.
     * @param verbose if the Log is verbose. Debug messages are only printed on verbose logs.
     */
    public verbose: boolean;
    private tag: string;
    private receivedData: Array<string>;

    constructor(tag = '', verbose = false) {
      this.tag = tag;
      this.verbose = verbose;
      this.receivedData = [];
    }

    getReceivedData(): Array<string> {
      return this.receivedData;
    }

    /**
     * Prints a debug message to the Log. message is ignored if the Log is not set to verbose.
     * @param message the message the be printed.
     * @param args extra arguments for the console.
     */
    debug(message: string): void {
      this.receivedData.push(message);
    }

    /**
     * Prints an info message to the Log. message is ignored if the Log is not set to verbose.
     * @param message the message the be printed.
     * @param args extra arguments for the console.
     */
    info(message: string): void {
      this.receivedData.push(message);
    }

    /**
     * Prints an warning message to the Log. message is ignored if the Log is not set to verbose.
     * @param message the message the be printed.
     * @param args extra arguments for the console.
     */
    warn(message: string): void {
      this.receivedData.push(message);
    }

    /**
     * Prints an error message to the Log. message is ignored if the Log is not set to verbose.
     * @param message the message the be printed.
     * @param args extra arguments for the console.
     */
    error(message: string): void {
      this.receivedData.push(message);
    }

    /**
     * Creates a new Log using the same output and verbositity of the current Log.
     * @param newTag the tag the be used on the new Log instance.
     */
    newLog(): Log {
      return new MockLog();
    }
}
