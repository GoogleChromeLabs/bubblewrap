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
  processFileHandlers,
  FileHandler,
  FileHandlerJson,
} from '../../lib/types/FileHandler';

describe('FileHandler', () => {
  describe('#processFileHandlers', () => {
    it('Accepts valid file handlers', () => {
      const startUrl = new URL('https://test.com/app/start');
      const scopeUrl = new URL('https://test.com/app');
      const testHandlers: FileHandlerJson[] = [
        {
          'action': '/app',
          'accept': {
            'text/plain': ['.txt'],
          },
        },
        {
          'action': '/app?image',
          'accept': {
            'image/jpeg': ['.jpg', 'jpeg'],
          },
        },
      ];
      const expectedHandlers: FileHandler[] = [
        {
          actionUrl: 'https://test.com/app',
          mimeTypes: ['text/plain'],
        },
        {
          actionUrl: 'https://test.com/app?image',
          mimeTypes: ['image/jpeg'],
        },
      ];
      const processedHandlers = processFileHandlers(testHandlers, startUrl, scopeUrl);
      expect(processedHandlers).toEqual(expectedHandlers);
    });
    it('Rejects invalid file handlers', () => {
      const startUrl = new URL('https://test.com/app/start');
      const scopeUrl = new URL('https://test.com/app');
      const testHandlers: FileHandlerJson[] = [
        {
          'action': '/app',
        },
        {
          'accept': {
            'text/plain': ['.txt'],
          },
        },
        {
          'action': '/app?image',
          'accept': {},
        },
      ];
      const processedHandlers = processFileHandlers(testHandlers, startUrl, scopeUrl);
      expect(processedHandlers).toEqual([]);
    });
    it('Rejects invalid action URLs', () => {
      const startUrl = new URL('https://test.com/app/start');
      const scopeUrl = new URL('https://test.com/app');
      const testHandlers: FileHandlerJson[] = [
        {
          'action': '/', // not withing the scope
          'accept': {
            'text/plain': ['.txt'],
          },
        },
        {
          'action': 'http://test.com/app', // invalid protocol
          'accept': {
            'text/plain': ['.txt'],
          },
        },
        {
          'action': 'http://a.test.com/app', // invalid origin
          'accept': {
            'text/plain': ['.txt'],
          },
        },
      ];
      const processedHandlers = processFileHandlers(testHandlers, startUrl, scopeUrl);
      expect(processedHandlers).toEqual([]);
    });
  });
});
