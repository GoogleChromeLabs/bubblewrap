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

'use strict';

const TwaManifest = require('../../lib/TwaManifest');

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
        'theme_color': '#7cc0ff',
        'background_color': '#7cc0ff',
      };
      const manifestUrl = new URL('https://pwa-directory.com/manifest.json');
      const twaManifest = TwaManifest.fromWebManifestJson(manifestUrl, manifest);
      expect(twaManifest.packageId).toBe('com.pwa_directory.twa');
      expect(twaManifest.name).toBe('PwaDirectory');
      expect(twaManifest.startUrl).toBe('/?utm_source=homescreen');
      expect(twaManifest.iconUrl)
          .toBe('https://pwa-directory.com/favicons/android-chrome-512x512.png');
      expect(twaManifest.maskableIconUrl).toBeUndefined();
      expect(twaManifest.themeColor).toBe('#7cc0ff');
      expect(twaManifest.navigationColor).toBe('#7cc0ff');
      expect(twaManifest.backgroundColor).toBe('#7cc0ff');
      expect(twaManifest.appVersion).toBe('1.0.0');
      expect(twaManifest.signingKey.path).toBe('./android.keystore');
      expect(twaManifest.signingKey.alias).toBe('android');
      expect(twaManifest.splashScreenFadeOutDuration).toBe(300);
      expect(twaManifest.useBrowserOnChromeOS).toBeTrue();
      expect(twaManifest.enableNotifications).toBeFalse();
    });

    it('Sets correct defaults for unavailable fields', () => {
      const manifest = {};
      const manifestUrl = new URL('https://pwa-directory.com/manifest.json');
      const twaManifest = TwaManifest.fromWebManifestJson(manifestUrl, manifest);
      expect(twaManifest.packageId).toBe('com.pwa_directory.twa');
      expect(twaManifest.host).toBe('pwa-directory.com');
      expect(twaManifest.name).toBe('My TWA');
      expect(twaManifest.startUrl).toBe('/');
      expect(twaManifest.iconUrl).toBeUndefined();
      expect(twaManifest.maskableIconUrl).toBeUndefined();
      expect(twaManifest.themeColor).toBe('#FFFFFF');
      expect(twaManifest.navigationColor).toBe('#FFFFFF');
      expect(twaManifest.backgroundColor).toBe('#FFFFFF');
      expect(twaManifest.appVersion).toBe('1.0.0');
      expect(twaManifest.signingKey.path).toBe('./android.keystore');
      expect(twaManifest.signingKey.alias).toBe('android');
      expect(twaManifest.splashScreenFadeOutDuration).toBe(300);
      expect(twaManifest.useBrowserOnChromeOS).toBeTrue();
      expect(twaManifest.enableNotifications).toBeFalse();
    });

    it('Uses "name" when "short_name" is not available', () => {
      const manifest = {
        'name': 'PWA Directory',
      };
      const manifestUrl = new URL('https://pwa-directory.com/manifest.json');
      const twaManifest = TwaManifest.fromWebManifestJson(manifestUrl, manifest);
      expect(twaManifest.name).toBe('PWA Directory');
    });
  });

  describe('#validate', () => {
    it('Returns false for an empty TWA Manifest', () => {
      const twaManifest = new TwaManifest({});
      expect(twaManifest.validate()).toBeFalse();
    });

    it('Returns true a correct TWA Manifest', () => {
      const twaManifest = new TwaManifest({
        packageId: 'com.pwa_directory.twa',
        host: 'pwa-directory.com',
        name: 'PWA Directory',
        startUrl: '/',
        iconUrl: 'https://pwa-directory.com/favicons/android-chrome-512x512.png',
        themeColor: '#7cc0ff',
        navigationColor: '#7cc0ff',
        navigationColor: '#7cc0ff',
        appVersion: '1.0.0',
        signingKey: {
          path: './android-keystore',
          alias: 'android',
        },
        splashScreenFadeOutDuration: 300,
        useBrowserOnChromeOS: true,
        enableNotifications: true,
      });
      expect(twaManifest.validate()).toBeTrue();
    });
  });
});
