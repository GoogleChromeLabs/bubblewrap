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

import {
  normalizeProtocolForTesting,
  normalizeUrlForTesting,
  processProtocolHandlers,
  ProtocolHandler,
} from '../../lib/types/ProtocolHandler';

describe('ProtocolHandler', () => {
  describe('#normalizeProtocol', () => {
    it('Accepts allowed schemes', () => {
      let normalized = normalizeProtocolForTesting('bitcoin');
      expect(normalized).toBe('bitcoin');
      normalized = normalizeProtocolForTesting('XMPP');
      expect(normalized).toBe('xmpp');
    });
    it('Rejects not allowed schemes', () => {
      const normalized = normalizeProtocolForTesting('something-else');
      expect(normalized).toBeUndefined();
    });
    it('Allows web+ schemes', () => {
      let normalized = normalizeProtocolForTesting('web+tea');
      expect(normalized).toBe('web+tea');
      normalized = normalizeProtocolForTesting('web+Coffee');
      expect(normalized).toBe('web+coffee');
    });
    it('Rejects invalid web+ schemes', () => {
      let normalized = normalizeProtocolForTesting('web+');
      expect(normalized).toBeUndefined();
      normalized = normalizeProtocolForTesting('web+a-b');
      expect(normalized).toBeUndefined();
      normalized = normalizeProtocolForTesting('web+mailto:');
      expect(normalized).toBeUndefined();
    });
  });

  describe('#normalizeUrl', () => {
    it('Accepts a valid relative url format', () => {
      const normalized = normalizeUrlForTesting(
          '?coffee=%s',
          new URL('https://test.com/app/start'),
          new URL('https://test.com/app/'),
      );
      expect(normalized).toBe('https://test.com/app/start?coffee=%s');
    });
    it('Accepts a valid absolute url format', () => {
      const normalized = normalizeUrlForTesting(
          'https://test.com/app/start?tea=%s',
          new URL('https://test.com/app/start'),
          new URL('https://test.com/app/'),
      );
      expect(normalized).toBe('https://test.com/app/start?tea=%s');
    });
    it('Rejects url format without %s', () => {
      const normalized = normalizeUrlForTesting(
          'coffee',
          new URL('https://test.com/app/start'),
          new URL('https://test.com/app/'),
      );
      expect(normalized).toBeUndefined();
    });
    it('Rejects absolute url with different origin', () => {
      const normalized = normalizeUrlForTesting(
          'https://fail.com/?tea=%s',
          new URL('https://test.com/app/start'),
          new URL('https://test.com/app/'),
      );
      expect(normalized).toBeUndefined();
    });
    it('Rejects absolute url outside of scope', () => {
      const normalized = normalizeUrlForTesting(
          'https://test.com/notapp?tea=%s',
          new URL('https://test.com/app/start'),
          new URL('https://test.com/app/'),
      );
      expect(normalized).toBeUndefined();
    });
    it('Rejects absolute url with illegal scheme', () => {
      const normalized = normalizeUrlForTesting(
          'vnc://test.com/?tea=%s',
          new URL('https://test.com/app/start'),
          new URL('https://test.com/app/'),
      );
      expect(normalized).toBeUndefined();
    });
    it('Rejects absolute url with http scheme', () => {
      const normalized = normalizeUrlForTesting(
          'http://test.com/?tea=%s',
          new URL('https://test.com/app/start'),
          new URL('https://test.com/app/'),
      );
      expect(normalized).toBeUndefined();
    });
  });

  describe('#processProtocolHandlers', () => {
    it('Accepts valid protocol handlers', () => {
      const startUrl = new URL('https://test.com/app/start');
      const scopeUrl = new URL('https://test.com/app/');
      const testHandlers: ProtocolHandler[] = [
        {protocol: 'bitcoin', url: '?wallet=%s'},
        {protocol: 'XMPP', url: `${startUrl}?contact=%s`},
        {protocol: 'web+tea', url: '?tea=%s'},
        {protocol: 'web+HEY', url: '?there=%s'},
      ];
      const expectedHandlers: ProtocolHandler[] = [
        {protocol: 'bitcoin', url: `${startUrl}?wallet=%s`},
        {protocol: 'xmpp', url: `${startUrl}?contact=%s`},
        {protocol: 'web+tea', url: `${startUrl}?tea=%s`},
        {protocol: 'web+hey', url: `${startUrl}?there=%s`},
      ];
      const processedHandlers = processProtocolHandlers(testHandlers, startUrl, scopeUrl);
      expect(processedHandlers).toEqual(expectedHandlers);
    });
    it('Rejects invalid protocol handlers', () => {
      const startUrl = new URL('https://test.com/app/start');
      const scopeUrl = new URL('https://test.com/app/');
      const testHandlers: ProtocolHandler[] = [
        {protocol: 'coffee', url: '?wallet=%s'},
        {protocol: 'web+tea', url: `${startUrl}?contact`},
        {protocol: 'web+tea', url: '?tea'},
        {protocol: 'web', url: '?there=%s'},
      ];
      const processedHandlers = processProtocolHandlers(testHandlers, startUrl, scopeUrl);
      expect(processedHandlers).toEqual([]);
    });
  });
});
