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

import Color = require('color');
import {isWebUri} from 'valid-url';

const MIN_KEY_PASSWORD_LENGTH = 6;

export async function validateKeyPassword(input: string): Promise<boolean> {
  if (input.trim().length < MIN_KEY_PASSWORD_LENGTH) {
    throw new Error(`Password must be at least ${MIN_KEY_PASSWORD_LENGTH} characters long`);
  }
  return true;
}

export async function notEmpty(input: string, errorMessage: string): Promise<boolean> {
  if (input.trim().length > 0) {
    return true;
  }
  throw new Error(errorMessage);
}

export async function validateColor(color: string): Promise<boolean> {
  try {
    new Color(color);
    return true;
  } catch (_) {
    throw new Error(`Invalid Color ${color}. Try using hexadecimal representation. eg: #FF3300`);
  }
};

export async function validateUrl(url: string): Promise<boolean> {
  if (isWebUri(url) === undefined) {
    throw new Error(`${url} is not an URL`);
  }
  return true;
}
