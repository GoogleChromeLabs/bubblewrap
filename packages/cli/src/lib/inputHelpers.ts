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
import {Result, DisplayMode, asDisplayMode, asOrientation, Orientation, util}
  from '@bubblewrap/core';
import {ValidateFunction} from './Prompt';
import {enUS as messages} from './strings';
import {domainToASCII} from 'url';
import {lookup} from 'mime-types';

/**
 * A {@link ValidateFunction} that receives a {@link string} as input and resolves to a
 * {@link Color} when successful.
 * @param {string} color a string to be converted to a {@link Color}.
 * @returns {Result<Color, Error>} a results that resolves to a {@link Color} on success or
 * {@link Error} on failure.
 */
export async function validateColor(color: string): Promise<Result<Color, Error>> {
  try {
    return Result.ok(new Color(color));
  } catch (_) {
    return Result.error(new Error(messages.errorInvalidColor(color)));
  }
};

/**
 * A {@link ValidateFunction} that receives a {@link string} as input and resolves to a
 * {@link URL} when successful. If the string is empty, the validation fails and the
 * {@link Result} returned by the function is an {@link Error}.
 * @param {string} url a string to be converted to a {@link URL}.
 * @returns {Result<URL, Error>} a results that resolves to a {@link URL} on success or
 * {@link Error} on failure.
 */
export async function validateUrl(url: string): Promise<Result<URL, Error>> {
  if (isWebUri(url) === undefined) {
    return Result.error(new Error(messages.errorInvalidUrl(url)));
  }

  try {
    return Result.ok(new URL(url));
  } catch (e) {
    return Result.error(new Error(messages.errorInvalidUrl(url)));
  }
}

/**
 * A {@link ValidateFunction} that receives a {@link string} as input and resolves to a
 * {@link URL} when successful. If the URL points to a type that doesn't resolve to a
 * `image/*` mime-type, if it resolves to `image/svg*`, or if the string is empty, the
 * validation fails and the {@link Result} returned by the function is an {@link Error}.
 * @param {string} url a string to be converted to a {@link URL}.
 * @returns {Result<URL, Error>} a results that resolves to a {@link URL} on success or
 * {@link Error} on failure.
 */
export async function validateImageUrl(url: string): Promise<Result<URL, Error>> {
  const mimeType = lookup(url);

  // Don't validate mime-type if we are unable to find what it is.
  if (mimeType) {
    if (!mimeType.startsWith('image/')) {
      return Result.error(new Error(messages.errorUrlMustBeImage(mimeType)));
    }

    if (mimeType.startsWith('image/svg')) {
      return Result.error(new Error(messages.errorUrlMustNotBeSvg));
    }
  }
  return validateUrl(url);
}

/**
 * A {@link ValidateFunction} that receives a {@link string} as input and resolves to a
 * {@link URL} or {@link null} when successful.
 * If the string is empty, the validation succeeds and the {@link Result} returned by the
 * function resolves to {@link null}.
 * If the URL points to a type that doesn't resolve to a `image/*` mime-type or if it resolves
 * to `image/svg*` the validation fails and the {@link Result} returned by the function is an
 * {@link Error}.
 * @param {string} url a string to be converted to a {@link URL}.
 * @returns {Result<URL, Error>} a results that resolves to a {@link URL} on success or
 * {@link Error} on failure.
 */
export async function validateOptionalImageUrl(input: string): Promise<Result<URL | null, Error>> {
  const url = input.trim();
  if (url.length === 0) {
    return Result.ok(null);
  }

  return validateImageUrl(url);
}

/**
 * A {@link ValidateFunction} that receives a {@link string} as input and resolves to a
 * {@link URL} or {@link null} when successful. If the string is empty, the validation succeeds
 * and the {@link Result} returned by the function {@link null}. Non-empty strings are validated
 * and a conversion is attempted.
 * @param {string} url a string to be converted to a {@link URL}.
 * @returns {Result<URL, Error>} a results that resolves to a {@link URL} on success or
 * {@link Error} on failure.
 */
export async function validateOptionalUrl(input: string): Promise<Result<URL | null, Error>> {
  const url = input.trim();
  if (url.length === 0) {
    return Result.ok(null);
  }

  return validateUrl(url);
}

/**
 * Creates a {@link ValidateFunction<string>} that checks the input {@link string} against the
 * constraints provided as parameters.
 * @param {number?} minLength optional *minimum* length.
 * @param {number?} maxLength optional *maximum* length.
 */
export function createValidateString(
    minLength?: number, maxLength?: number): ValidateFunction<string> {
  return async (input: string): Promise<Result<string, Error>> => {
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

/**
 * A {@link ValidateFunction} that receives a {@link string} as input and resolves to a
 * {@link string} when successful. This function verifies if the input is an acceptable
 * hostname. If a full URL is passed, it must start with `https://`. The hostname will be
 * extracted from the full URL and returned, if the validation is successful.
 * @param {string} input a string to be validated.
 * @returns {Result<string, Error>} a results that resolves to a {@link string} on success or
 * {@link Error} on failure.
 */
export async function validateHost(input: string): Promise<Result<string, Error>> {
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

/**
 * A {@link ValidateFunction} that receives a {@link string} as input and resolves to a
 * {@link DisplayMode} when successful.
 * @param {string} input a string to be converted to a {@link DisplayMode}.
 * @returns {Result<DisplayMode, Error>} a result that resolves to a {@link DisplayMode} on
 * success or {@link Error} on failure.
 */
export async function validateDisplayMode(input: string): Promise<Result<DisplayMode, Error>> {
  const displayMode = asDisplayMode(input);
  if (displayMode === null) {
    return Result.error(new Error(messages.errorInvalidDisplayMode(input)));
  }
  return Result.ok(displayMode);
}

/**
 * A {@link ValidateFunction} that receives a {@link string} as input and resolves to a
 * {@link Orientation} when successful.
 * @param {string} input a string to be converted to a {@link Orientation}.
 * @returns {Result<Orientation, Error>} a result that resolves to a {@link Orientation} on
 * success or {@link Error} on failure.
 */
export async function validateOrientation(input: string): Promise<Result<Orientation, Error>> {
  const orientation = asOrientation(input);
  if (orientation === null) {
    return Result.error(new Error(messages.errorInvalidOrientation(input)));
  }
  return Result.ok(orientation);
}

/**
 * A {@link ValidateFunction} that receives a {@link string} as input and resolves to a
 * {@link number} when successful.
 * @param {string} input a string to be converted to a {@link number} integer.
 * @returns {Result<number, Error>} a result that resolves to a {@link number} integer on
 * success or {@link Error} on error.
 */
export async function validateInteger(input: string): Promise<Result<number, Error>> {
  const validNumber = Number.parseFloat(input);
  if (!Number.isInteger(validNumber)) {
    return Result.error(new Error(messages.errorInvalidInteger(input)));
  }
  return Result.ok(validNumber);
}

/**
 * A {@link ValidateFunction} that receives a {@link string} as input and resolves to a
 * {@link DisplayMode} when successful. Verifies if the input is a valid Android packageId. See
 * {@link util.validatePackageId} for more details on the packageId validation.
 * @param {string} input a string to be validated as a packageId.
 * @returns {Result<string, Error>} a result that resolves to a {@link string} on
 * success or {@link Error} on failure.
 */
export async function validatePackageId(input: string): Promise<Result<string, Error>> {
  const result = util.validatePackageId(input);

  if (result !== null) {
    return Result.error(new Error(result));
  }

  return Result.ok(input);
}

/**
 * A {@link ValidateFunction} that receives a {@link string} as input and resolves to a
 * {@link string} when successful. Verifies if the input is a valid SHA-256 fingerprint.
 * @param {string} input a string representing a SHA-256 fingerprint.
 * @returns {Result<string, Error>} a result that resolves to a {@link string} on
 * success or {@link Error} on failure.
 */
export async function validateSha256Fingerprint(input: string): Promise<Result<string, Error>> {
  input = input.toUpperCase();
  if (input.match(/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/)) {
    return Result.ok(input);
  }
  return Result.error(new Error(messages.errorInvalidSha256Fingerprint(input)));
}
