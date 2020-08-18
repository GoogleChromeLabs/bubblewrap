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

import {Log} from '../../lib/Log';

/**
 * An utility class for testing used for get the logging messages without printing to the user.
 */
export class MockLog implements Log {
    private receivedData: Array<string>;

    /**
     * Creates a new MockLog instance.
     */
    constructor() {
      this.receivedData = [];
    }

    getReceivedData(): Array<string> {
      return this.receivedData;
    }

    /**
     * Saves the debug message to the Logger.
     * @param message The message the be saved.
     */
    debug(message: string): void {
      this.receivedData.push(message);
    }

    /**
     * Saves the debug message to the Logger.
     * @param message The message the be saved.
     */
    info(message: string): void {
      this.receivedData.push(message);
    }

    /**
     * Saves the debug message to the Logger.
     * @param message The message the be saved.
     */
    warn(message: string): void {
      this.receivedData.push(message);
    }

    /**
     * Saves the debug message to the Logger.
     * @param message The message the be saved.
     */
    error(message: string): void {
      this.receivedData.push(message);
    }

    setVerbose(): void {
      // Not implemented for testing.
    }

    /**
     * Creates a new MockLog.
     */
    newLog(): Log {
      return new MockLog();
    }
}
