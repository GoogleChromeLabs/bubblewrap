/*
 * Copyright 2025 Google Inc. All Rights Reserved.
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

export interface FileHandlerJson {
  action?: string;
  accept?: {
    [mimeType: string]: Array<string>;
  }
}

export interface FileHandler {
  actionUrl: string;
  mimeTypes: Array<string>;
}

function normalizeUrl(url: string, startUrl: URL, scopeUrl: URL,): string | undefined {
  try {
    const absoluteUrl = new URL(url, startUrl);

    if (absoluteUrl.protocol !== 'https:') {
      console.warn('Ignoring url with illegal scheme:', absoluteUrl.toString());
      return;
    }

    if (absoluteUrl.origin != scopeUrl.origin) {
      console.warn('Ignoring url with invalid origin:', absoluteUrl.toString());
      return;
    }

    if (!absoluteUrl.pathname.startsWith(scopeUrl.pathname)) {
      console.warn('Ignoring url not within manifest scope: ', absoluteUrl.toString());
      return;
    }

    return absoluteUrl.toString();
  } catch (error) {
    console.warn('Ignoring invalid url:', url);
  }
}

export function processFileHandlers(
  fileHandlers: FileHandlerJson[],
  startUrl: URL,
  scopeUrl: URL,
): FileHandler[] {
  const processedFileHandlers: FileHandler[] = [];

  for (const handler of fileHandlers) {
    if (!handler.action || !handler.accept) continue;

    const actionUrl = normalizeUrl(handler.action, startUrl, scopeUrl);
    if (!actionUrl) continue;

    const mimeTypes = Object.keys(handler.accept);
    if (mimeTypes.length == 0) continue;

    const processedHandler: FileHandler = {
      actionUrl,
      mimeTypes,
    };

    processedFileHandlers.push(processedHandler);
  }

  return processedFileHandlers;
}