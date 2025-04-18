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

export interface ProtocolHandler {
  protocol: string;
  url: string;
}

const ProtocolHandlerExtraScheme = /^web\+[a-z]+$/;
const ProtcolHandlerAllowedSchemes = [
  'bitcoin', 'ftp', 'ftps', 'geo', 'im', 'irc', 'ircs',
  'magnet', 'mailto', 'matrix', 'news', 'nntp', 'openpgp4fpr',
  'sftp', 'sip', 'ssh', 'urn', 'webcal', 'wtai', 'xmpp',
];
// 'mms', 'sms', 'smsto', and 'tel' are not supported!

function normalizeProtocol(protocol: string): string | undefined {
  const normalized = protocol.toLowerCase();

  if (ProtcolHandlerAllowedSchemes.includes(normalized)) {
    return normalized;
  }

  if (ProtocolHandlerExtraScheme.test(normalized)) {
    return normalized;
  }

  console.warn('Ignoring invalid protocol:', protocol);
  return undefined;
}

function normalizeUrl(url: string, startUrl: URL, scopeUrl: URL): string | undefined {
  if (!url.includes('%s')) {
    console.warn('Ignoring url without %%s:', url);
    return undefined;
  }

  try {
    const absoluteUrl = new URL(url);

    if (absoluteUrl.protocol !== 'https:') {
      console.warn('Ignoring absolute url with illegal scheme:', absoluteUrl.toString());
      return undefined;
    }

    if (absoluteUrl.origin != scopeUrl.origin) {
      console.warn('Ignoring absolute url with invalid origin:', absoluteUrl.toString());
      return undefined;
    }

    if (!absoluteUrl.pathname.startsWith(scopeUrl.pathname)) {
      console.warn('Ignoring absolute url not within manifest scope: ', absoluteUrl.toString());
      return undefined;
    }

    return absoluteUrl.toString();
  } catch (error) {
    // Expected, url might be relative!
  }

  try {
    const relativeUrl = new URL(url, startUrl);
    return relativeUrl.toString();
  } catch (error) {
    console.warn('Ignoring invalid relative url:', url);
  }
}

export function processProtocolHandlers(
    protocolHandlers: ProtocolHandler[],
    startUrl: URL,
    scopeUrl: URL,
): ProtocolHandler[] {
  const processedProtocolHandlers: ProtocolHandler[] = [];

  for (const handler of protocolHandlers) {
    if (!handler.protocol || !handler.url) continue;

    const normalizedProtocol = normalizeProtocol(handler.protocol);
    const normalizedUrl = normalizeUrl(handler.url, startUrl, scopeUrl);

    if (!normalizedProtocol || !normalizedUrl) {
      continue;
    }

    processedProtocolHandlers.push({protocol: normalizedProtocol, url: normalizedUrl});
  }

  return processedProtocolHandlers;
}

export function normalizeProtocolForTesting(protocol: string): string | undefined {
  return normalizeProtocol(protocol);
}

export function normalizeUrlForTesting(
    url: string,
    startUrl: URL,
    scopeUrl: URL,
): string | undefined {
  return normalizeUrl(url, startUrl, scopeUrl);
}
