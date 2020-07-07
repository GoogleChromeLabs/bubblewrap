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

type ValueType<V> = {
  type: 'ok';
  value: V;
};

type ErrorType<E extends Error> = {
  type: 'error';
  error: E;
}

type ResultType<V, E extends Error> = ValueType<V> | ErrorType<E>;

/**
 * While throwing exceptions show be used to handle truly exception cases, `Result<V, E>` can be
 * used to handle cases where failures are expected, therefore not really exceptions.
 *
 * The outcome can be verified with `Result.isOk()`:
 * ```
 * const result = someMethod();
 * if (result.isOk()) {
 *  const value = result.unwrap();
 *  ...
 * }
 * ```
 */
export class Result<V, E extends Error> {
  private _result: ResultType<V, E>;

  private constructor(result: ResultType<V, E>) {
    this._result = result;
  }

  /**
   * Creates a new `ok` Result, with the outcome `value`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static ok<V>(value: V): Result<V, any> {
    return new Result({
      type: 'ok',
      value: value,
    });
  }

  /**
   * Creates a new `error` Result, with the outcome `error`.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static error<E extends Error>(error: E): Result<any, E> {
    return new Result({
      type: 'error',
      error: error,
    });
  }

  /**
   * Returns the value if this result is `ok`. Otherwise, throws `E`.
   */
  unwrap(): V {
    if (this._result.type === 'error') {
      console.log('throwing error...');
      throw this._result.error;
    }
    return this._result.value;
  }

  /**
   * If the result is an Error, returns `defaultValue`. Otherwise returns the result value.
   */
  unwrapOr(defaultValue: V): V {
    if (this._result.type === 'error') {
      return defaultValue;
    }
    return this._result.value;
  }

  /**
   * If the result is an Error, returns the `Error` instance without throwing. Otherwise,
   * throws an Exception.
   */
  unwrapError(): E {
    if (this._result.type === 'error') {
      return this._result.error;
    }
    throw new Error('Expected result to be "ok", but it is "error"');
  }

  /**
   * @returns `true` if the result is `ok`. `false` if it is an `Error`.
   */
  isOk(): boolean {
    return this._result.type === 'ok';
  }

  /**
   * @returns `true` if the result is an `Error`. `false` if the result is `ok`.
   */
  isError(): boolean {
    return this._result.type === 'error';
  }
}
