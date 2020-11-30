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

import {Log} from './Log';

enum LogLevel {
  Debug,
  Info,
  Warn,
  Error,
}

/** Data class to store level and message of pending */
class PendingLog {
  constructor(public level: LogLevel, public message: string) {}
}

/**
 * A Log that wraps another Log, saving up all the log calls to be applied when flush is called.
 *
 * It doesn't currently support arguments to the log messages.
 */
export class BufferedLog implements Log {
  private pendingLogs: Array<PendingLog> = [];

  constructor(private innerLog: Log) {}

  /* eslint-disable no-invalid-this */
  debug = this.addLogFunction(LogLevel.Debug);
  info = this.addLogFunction(LogLevel.Info);
  warn = this.addLogFunction(LogLevel.Warn);
  error = this.addLogFunction(LogLevel.Error);
  /* eslint-enable no-invalid-this */

  /** Creates a function that adds a log at the given level. */
  private addLogFunction(level: LogLevel): (message: string) => void {
    return (message: string): void => {
      this.pendingLogs.push(new PendingLog(level, message));
    };
  }

  setVerbose(verbose: boolean): void {
    this.innerLog.setVerbose(verbose);
  }

  /** Flushes all recorded logs to the underlying object. */
  flush(): void {
    this.pendingLogs.forEach((pendingLog) => {
      const message = pendingLog.message;

      switch (pendingLog.level) {
        case LogLevel.Debug:
          this.innerLog.debug(message);
          break;
        case LogLevel.Info:
          this.innerLog.info(message);
          break;
        case LogLevel.Warn:
          this.innerLog.warn(message);
          break;
        case LogLevel.Error:
          this.innerLog.error(message);
          break;
      }
    });

    this.pendingLogs = [];
  }
}
