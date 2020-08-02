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

import {ShortcutInfo} from '../../lib/ShortcutInfo';

describe('ShortcutInfo', () => {
  describe('#fromShortcutJson', () => {
    it('creates a correct TWA shortcut', () => {
      const shortcut = {
        'name': 'shortcut name',
        'short_name': 'short',
        'url': '/launch',
        'icons': [{
          'src': '/shortcut_icon.png',
          'sizes': '96x96',
        }],
      };
      const manifestUrl = new URL('https://pwa-directory.com/manifest.json');
      const shortcutInfo = ShortcutInfo.fromShortcutJson(manifestUrl, shortcut);
      expect(shortcutInfo.name).toBe('shortcut name');
      expect(shortcutInfo.shortName).toBe('short');
      expect(shortcutInfo.url).toBe('https://pwa-directory.com/launch');
      expect(shortcutInfo.chosenIconUrl)
          .toBe('https://pwa-directory.com/shortcut_icon.png');
      expect(shortcutInfo.toString(0))
          .toBe('[name:\'shortcut name\', short_name:\'short\',' +
            ' url:\'https://pwa-directory.com/launch\', icon:\'shortcut_0\']');
    });

    it('Throws if icon size is empty or too small', () => {
      const shortcut = {
        'name': 'invalid',
        'url': '/invalid',
        'icons': [{
          'src': '/no_size.png',
        }, {
          'src': '/small_size.png',
          'sizes': '95x95',
        }],
      };
      const manifestUrl = new URL('https://pwa-directory.com/manifest.json');
      expect(() => ShortcutInfo.fromShortcutJson(manifestUrl, shortcut))
          .toThrowError('not finding a suitable icon');
    });

    it('Throws if icons is missing', () => {
      const shortcut = {
        'name': 'invalid',
        'url': '/invalid',
      };
      const manifestUrl = new URL('https://pwa-directory.com/manifest.json');
      expect(() => ShortcutInfo.fromShortcutJson(manifestUrl, shortcut))
          .toThrowError('missing metadata');
    });
  });

  describe('#constructor', () => {
    it('Builds a ShortcutInfo correctly', () => {
      const shortcutInfo = new ShortcutInfo('name', 'shortName', '/', 'icon.png');
      expect(shortcutInfo.name).toEqual('name');
      expect(shortcutInfo.shortName).toEqual('shortName');
      expect(shortcutInfo.url).toEqual('/');
      expect(shortcutInfo.chosenIconUrl).toEqual('icon.png');
    });
  });
});
