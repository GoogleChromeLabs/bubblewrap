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

import {TwaManifest, TwaManifestJson} from '../../lib/TwaManifest';
import Color = require('color');

describe('TwaManifest', () => {
  describe('#fromWebManifestJson', () => {
    it('creates a correct TWA manifest', () => {
      const manifest = {
        'name': 'PWA Directory',
        'short_name': 'PwaDirectory',
        'start_url': '/?utm_source=homescreen',
        'icons': [{
          'src': '/favicons/android-chrome-192x192.png',
          'sizes': '192x192',
          'type': 'image/png',
        }, {
          'src': '/favicons/android-chrome-512x512.png',
          'sizes': '512x512',
          'type': 'image/png',
        }],
        'theme_color': '#00ff00',
        'background_color': '#7cc0ff',
        'shortcuts': [{
          'name': 'shortcut name',
          'short_name': 'short',
          'url': '/launch',
          'icons': [{
            'src': '/shortcut_icon.png',
            'sizes': '96x96',
          }],
        }],
      };
      const manifestUrl = new URL('https://pwa-directory.com/manifest.json');
      const twaManifest = TwaManifest.fromWebManifestJson(manifestUrl, manifest);
      expect(twaManifest.packageId).toBe('com.pwa_directory.twa');
      expect(twaManifest.name).toBe('PWA Directory');
      expect(twaManifest.launcherName).toBe('PwaDirectory');
      expect(twaManifest.startUrl).toBe('/?utm_source=homescreen');
      expect(twaManifest.iconUrl)
          .toBe('https://pwa-directory.com/favicons/android-chrome-512x512.png');
      expect(twaManifest.maskableIconUrl).toBeUndefined();
      expect(twaManifest.monochromeIconUrl).toBeUndefined();
      expect(twaManifest.themeColor.hex()).toBe('#00FF00');
      expect(twaManifest.navigationColor.hex()).toBe('#000000');
      expect(twaManifest.backgroundColor.hex()).toBe('#7CC0FF');
      expect(twaManifest.appVersionName).toBe('1');
      expect(twaManifest.appVersionCode).toBe(1);
      expect(twaManifest.signingKey.path).toBe('./android.keystore');
      expect(twaManifest.signingKey.alias).toBe('android');
      expect(twaManifest.splashScreenFadeOutDuration).toBe(300);
      expect(twaManifest.enableNotifications).toBeFalse();
      expect(twaManifest.webManifestUrl).toEqual(manifestUrl);
      expect(twaManifest.shortcuts.length).toBe(1);
      expect(twaManifest.shortcuts[0].name).toBe('shortcut name');
      expect(twaManifest.shortcuts[0].shortName).toBe('short');
      expect(twaManifest.shortcuts[0].url).toBe('https://pwa-directory.com/launch');
      expect(twaManifest.shortcuts[0].chosenIconUrl)
          .toBe('https://pwa-directory.com/shortcut_icon.png');
      expect(twaManifest.generateShortcuts())
          .toBe('[[name:\'shortcut name\', short_name:\'short\',' +
            ' url:\'https://pwa-directory.com/launch\', icon:\'shortcut_0\']]');
      expect(twaManifest.fallbackType).toBe('customtabs');
    });

    it('Sets correct defaults for unavailable fields', () => {
      const manifest = {};
      const manifestUrl = new URL('https://pwa-directory.com/manifest.json');
      const twaManifest = TwaManifest.fromWebManifestJson(manifestUrl, manifest);
      expect(twaManifest.packageId).toBe('com.pwa_directory.twa');
      expect(twaManifest.host).toBe('pwa-directory.com');
      expect(twaManifest.name).toBe('My TWA');
      expect(twaManifest.launcherName).toBe('My TWA');
      expect(twaManifest.startUrl).toBe('/');
      expect(twaManifest.iconUrl).toBeUndefined();
      expect(twaManifest.maskableIconUrl).toBeUndefined();
      expect(twaManifest.monochromeIconUrl).toBeUndefined();
      expect(twaManifest.themeColor.hex()).toBe('#FFFFFF');
      expect(twaManifest.navigationColor.hex()).toBe('#000000');
      expect(twaManifest.backgroundColor.hex()).toBe('#FFFFFF');
      expect(twaManifest.appVersionName).toBe('1');
      expect(twaManifest.appVersionCode).toBe(1);
      expect(twaManifest.signingKey.path).toBe('./android.keystore');
      expect(twaManifest.signingKey.alias).toBe('android');
      expect(twaManifest.splashScreenFadeOutDuration).toBe(300);
      expect(twaManifest.enableNotifications).toBeFalse();
      expect(twaManifest.webManifestUrl).toEqual(manifestUrl);
      expect(twaManifest.shortcuts).toEqual([]);
      expect(twaManifest.generateShortcuts()).toBe('[]');
    });

    it('Uses "name" when "short_name" is not available', () => {
      const manifest = {
        'name': 'PWA Directory',
      };
      const manifestUrl = new URL('https://pwa-directory.com/manifest.json');
      const twaManifest = TwaManifest.fromWebManifestJson(manifestUrl, manifest);
      expect(twaManifest.name).toBe('PWA Directory');
      expect(twaManifest.launcherName).toBe('PWA Director');
    });

    it('Ignores shortcuts if icon size is empty or too small', () => {
      const manifest = {
        'shortcuts': [{
          'name': 'invalid',
          'url': '/invalid',
          'icons': [{
            'src': '/no_size.png',
          }, {
            'src': '/small_size.png',
            'sizes': '95x95',
          }],
        }],
      };
      const manifestUrl = new URL('https://pwa-directory.com/manifest.json');
      const twaManifest = TwaManifest.fromWebManifestJson(manifestUrl, manifest);
      expect(twaManifest.shortcuts).toEqual([]);
      expect(twaManifest.generateShortcuts()).toBe('[]');
    });

    it('resolves URLs for maskable and monochrome icons', () => {
      const manifest = {
        'name': 'PWA Directory',
        'short_name': 'PwaDirectory',
        'start_url': '/?utm_source=homescreen',
        'icons': [{
          'src': '/favicons/any.png',
          'sizes': '512x512',
          'type': 'image/png',
          'purpose': 'any',
        }, {
          'src': '/favicons/maskable.png',
          'sizes': '512x512',
          'type': 'image/png',
          'purpose': 'maskable',
        }, {
          'src': '/favicons/monochrome.png',
          'sizes': '512x512',
          'type': 'image/png',
          'purpose': 'monochrome',
        }],
      };
      const manifestUrl = new URL('https://pwa-directory.com/manifest.json');
      const twaManifest = TwaManifest.fromWebManifestJson(manifestUrl, manifest);
      expect(twaManifest.packageId).toBe('com.pwa_directory.twa');
      expect(twaManifest.name).toBe('PWA Directory');
      expect(twaManifest.launcherName).toBe('PwaDirectory');
      expect(twaManifest.startUrl).toBe('/?utm_source=homescreen');
      expect(twaManifest.iconUrl)
          .toBe('https://pwa-directory.com/favicons/any.png');
      expect(twaManifest.maskableIconUrl).toBe('https://pwa-directory.com/favicons/maskable.png');
      expect(twaManifest.monochromeIconUrl).toBe('https://pwa-directory.com/favicons/monochrome.png');
    });
  });

  describe('#constructor', () => {
    it('Builds a TwaManifest correctly', () => {
      const twaManifestJson = {
        packageId: 'com.pwa_directory.twa',
        host: 'pwa-directory.com',
        name: 'PWA Directory',
        launcherName: 'PwaDirectory',
        startUrl: '/',
        iconUrl: 'https://pwa-directory.com/favicons/android-chrome-512x512.png',
        themeColor: '#00ff00',
        navigationColor: '#000000',
        backgroundColor: '#0000ff',
        appVersion: '1.0.0',
        appVersionCode: 10,
        signingKey: {
          path: './my-keystore',
          alias: 'my-alias',
        },
        splashScreenFadeOutDuration: 300,
        enableNotifications: true,
        shortcuts: [{name: 'name', shortName: 'shortName', url: '/', chosenIconUrl: 'icon.png'}],
        webManifestUrl: 'https://pwa-directory.com/manifest.json',
        generatorApp: 'test',
        fallbackType: 'webview',
      } as TwaManifestJson;
      const twaManifest = new TwaManifest(twaManifestJson);
      expect(twaManifest.packageId).toEqual(twaManifestJson.packageId);
      expect(twaManifest.host).toEqual(twaManifestJson.host);
      expect(twaManifest.name).toEqual(twaManifestJson.name);
      expect(twaManifest.launcherName).toEqual(twaManifest.launcherName);
      expect(twaManifest.startUrl).toEqual(twaManifest.startUrl);
      expect(twaManifest.iconUrl).toEqual(twaManifest.iconUrl);
      expect(twaManifest.themeColor).toEqual(new Color('#00ff00'));
      expect(twaManifest.navigationColor).toEqual(new Color('#000000'));
      expect(twaManifest.backgroundColor).toEqual(new Color('#0000ff'));
      expect(twaManifest.appVersionName).toEqual(twaManifestJson.appVersion);
      expect(twaManifest.appVersionCode).toEqual(twaManifestJson.appVersionCode!);
      expect(twaManifest.signingKey.path).toEqual(twaManifestJson.signingKey.path);
      expect(twaManifest.signingKey.alias).toEqual(twaManifestJson.signingKey.alias);
      expect(twaManifest.splashScreenFadeOutDuration)
          .toEqual(twaManifestJson.splashScreenFadeOutDuration);
      expect(twaManifest.enableNotifications).toEqual(twaManifestJson.enableNotifications);
      expect(twaManifest.shortcuts).toEqual(twaManifestJson.shortcuts);
      expect(twaManifest.webManifestUrl).toEqual(new URL(twaManifestJson.webManifestUrl!));
      expect(twaManifest.generatorApp).toEqual(twaManifestJson.generatorApp!);
      expect(twaManifest.fallbackType).toBe('webview');
    });

    it('Sets correct default values for optional fields', () => {
      const twaManifestJson = {
        packageId: 'com.pwa_directory.twa',
        host: 'pwa-directory.com',
        name: 'PWA Directory',
        launcherName: 'PwaDirectory',
        startUrl: '/',
        iconUrl: 'https://pwa-directory.com/favicons/android-chrome-512x512.png',
        themeColor: '#00ff00',
        navigationColor: '#000000',
        backgroundColor: '#0000ff',
        appVersion: '1.0.0',
        appVersionCode: 10,
        signingKey: {
          path: './my-keystore',
          alias: 'my-alias',
        },
        splashScreenFadeOutDuration: 300,
        enableNotifications: true,
        shortcuts: [{name: 'name', url: '/', chosenIconUrl: 'icon.png'}],
        generatorApp: 'test',
      } as TwaManifestJson;
      const twaManifest = new TwaManifest(twaManifestJson);
      expect(twaManifest.webManifestUrl).toBeUndefined();
      expect(twaManifest.fallbackType).toBe('customtabs');
    });
  });

  describe('#validate', () => {
    it('Returns false for an empty TWA Manifest', () => {
      const twaManifest = new TwaManifest({} as TwaManifestJson);
      expect(twaManifest.validate()).not.toBeNull();
    });

    it('Returns true a correct TWA Manifest', () => {
      const twaManifest = new TwaManifest({
        packageId: 'com.pwa_directory.twa',
        host: 'pwa-directory.com',
        name: 'PWA Directory',
        launcherName: 'PwaDirectory',
        startUrl: '/',
        iconUrl: 'https://pwa-directory.com/favicons/android-chrome-512x512.png',
        themeColor: '#00ff00',
        navigationColor: '#000000',
        backgroundColor: '#0000ff',
        appVersion: '1.0.0',
        signingKey: {
          path: './android-keystore',
          alias: 'android',
        },
        splashScreenFadeOutDuration: 300,
        enableNotifications: true,
        shortcuts: [{name: 'name', url: '/', chosenIconUrl: 'icon.png'}],
      } as TwaManifestJson);
      expect(twaManifest.validate()).toBeNull();
    });
  });
});
