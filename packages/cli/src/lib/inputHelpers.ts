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
import {URL} from 'url';
import {isWebUri} from 'valid-url';
import {Result, DisplayMode, asDisplayMode, util} from '@bubblewrap/core';
import {ValidateFunction} from './Prompt';
import {en as messages} from './strings';
import {domainToASCII} from 'url';

export function validateColor(color: string): Result<Color, Error> {
  try {
    return Result.ok(new Color(color));
  } catch (_) {
    return Result.error(new Error(messages.errorInvalidColor(color)));
  }
};

export function validateUrl(url: string): Result<URL, Error> {
  if (isWebUri(url) === undefined) {
    return Result.error(new Error(messages.errorInvalidUrl(url)));
  }

  try {
    return Result.ok(new URL(url));
  } catch (e) {
    return Result.error(new Error(messages.errorInvalidUrl(url)));
  }
}

export function validateOptionalUrl(input: string): Result<URL | null, Error> {
  const url = input.trim();
  if (url.length === 0) {
    return Result.ok(null);
  }

  return validateUrl(url);
}

export function createValidateString(
    minLength?: number, maxLength?: number): ValidateFunction<string> {
  return (input: string): Result<string, Error> => {
    input = input.trim();
    if (minLength && input.length < minLength) {
      return Result.error(new Error(messages.errorMinLength(minLength, input.length)));
    }

    if (maxLength && input.length > maxLength) {
      return Result.error(new Error(messages.errorMaxLength(maxLength, input.length)));
    }
    return Result.ok(input);
  };
};

export function validateHost(input: string): Result<string, Error> {
  let host = input.trim();
  if (host.length <= 0) {
    return Result.error(new Error(messages.errorMinLength(1, input.length)));
  }

  // Check if user added the scheme to the input.
  const parts = host.split('://');
  if (parts.length > 2) {
    return Result.error(new Error(messages.errorInvalidUrl(input)));
  }

  // If a scheme was added, it must be HTTPS. We don't really care about this in the code, as we
  // only use the host part of the URI, but this might lead users to believe the final
  // application will open a different scheme from what they originally intended.
  if (parts.length === 2) {
    if (parts[0] !== 'https') {
      return Result.error(new Error(messages.errorRequireHttps));
    }
    host = parts[1];
  }

  // Verify if the characters added to the domain are valid. This functions returns an empty
  // string when the input is invalid.
  const ascIIInput = domainToASCII(host);
  if (ascIIInput.length === 0) {
    return Result.error(new Error(messages.errorInvalidUrl(input)));
  }

  // Finally, try building an URL object. If it fails, we likely have an invalid host.
  try {
    new URL('https://' + host);
  } catch (e) {
    return Result.error(new Error(messages.errorInvalidUrl(input)));
  }

  return Result.ok(host);
};

export function validateDisplayMode(input: string): Result<DisplayMode, Error> {
  const displayMode = asDisplayMode(input);
  if (displayMode === null) {
    return Result.error(new Error(messages.errorInvalidDisplayMode(input)));
  }
  return Result.ok(displayMode);
}

export function validatePackageId(input: string): Result<string, Error> {
  const result = util.validatePackageId(input);

  if (result !== null) {
    return Result.error(new Error(result));
  }

  return Result.ok(input);
}
