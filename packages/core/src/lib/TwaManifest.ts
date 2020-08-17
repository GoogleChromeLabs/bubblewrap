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

import * as fs from 'fs';
import fetch from 'node-fetch';
import {findSuitableIcon, generatePackageId, validateNotEmpty} from './util';
import Color = require('color');
import {Log, ConsoleLog} from './Log';
import {WebManifestIcon, WebManifestJson} from './types/WebManifest';

// The minimum size needed for the app icon.
const MIN_ICON_SIZE = 512;

// As described on https://developer.chrome.com/apps/manifest/name#short_name
const SHORT_NAME_MAX_SIZE = 12;

// The minimum size needed for the shortcut icon
const MIN_SHORTCUT_ICON_SIZE = 96;

// Default values used on the Twa Manifest
const DEFAULT_SPLASHSCREEN_FADEOUT_DURATION = 300;
const DEFAULT_APP_NAME = 'My TWA';
const DEFAULT_THEME_COLOR = '#FFFFFF';
const DEFAULT_NAVIGATION_COLOR = '#000000';
const DEFAULT_BACKGROUND_COLOR = '#FFFFFF';
const DEFAULT_APP_VERSION_CODE = 1;
const DEFAULT_APP_VERSION_NAME = DEFAULT_APP_VERSION_CODE.toString();
const DEFAULT_SIGNING_KEY_PATH = './android.keystore';
const DEFAULT_SIGNING_KEY_ALIAS = 'android';
const DEFAULT_ENABLE_NOTIFICATIONS = false;
const DEFAULT_GENERATOR_APP_NAME = 'unknown';

export type FallbackType = 'customtabs' | 'webview';

/**
 * A wrapper around the WebManifest's ShortcutInfo.
 */
export class ShortcutInfo {
  /**
   * @param {string} name
   * @param {string} shortName
   * @param {string} url target Url for when the shortcut is clicked
   * @param {string} chosenIconUrl Url for the icon
   */
  constructor(readonly name: string, readonly shortName: string, readonly url: string,
        readonly chosenIconUrl: string) {
  }
}

/**
 * A Manifest used to generate the TWA Project
 *
 * applicationId: '<%= packageId %>',
 * hostName: '<%= host %>', // The domain being opened in the TWA.
 * launchUrl: '<%= startUrl %>', // The start path for the TWA. Must be relative to the domain.
 * name: '<%= name %>', // The name shown on the Android Launcher.
 * themeColor: '<%= themeColor %>', // The color used for the status bar.
 * navigationColor: '<%= themeColor %>', // The color used for the navigation bar.
 * backgroundColor: '<%= backgroundColor %>', // The color used for the splash screen background.
 * enableNotifications: false, // Set to true to enable notification delegation.
 * // Add shortcuts for your app here. Every shortcut must include the following fields:
 * // - name: String that will show up in the shortcut.
 * // - short_name: Shorter string used if |name| is too long.
 * // - url: Absolute path of the URL to launch the app with (e.g '/create').
 * // - icon: Name of the resource in the drawable folder to use as an icon.
 * shortcuts: [
 *      // Insert shortcuts here, for example:
 *      // [name: 'Open SVG', short_name: 'Open', url: '/open', icon: 'splash']
 *  ],
 * // The duration of fade out animation in milliseconds to be played when removing splash screen.
 * splashScreenFadeOutDuration: 300
 *
 */
export class TwaManifest {
  packageId: string;
  host: string;
  name: string;
  launcherName: string;
  themeColor: Color;
  navigationColor: Color;
  backgroundColor: Color;
  enableNotifications: boolean;
  startUrl: string;
  iconUrl: string | undefined;
  maskableIconUrl: string | undefined;
  splashScreenFadeOutDuration: number;
  signingKey: SigningKeyInfo;
  appVersionCode: number;
  appVersionName: string;
  shortcuts: ShortcutInfo[];
  generatorApp: string;
  webManifestUrl?: URL;
  fallbackType: FallbackType;

  private static log: Log = new ConsoleLog('twa-manifest');

  constructor(data: TwaManifestJson) {
    this.packageId = data.packageId;
    this.host = data.host;
    this.name = data.name;
    this.launcherName = data.launcherName || data.name; // Older Manifests may not have this field.
    this.themeColor = new Color(data.themeColor);
    this.navigationColor = new Color(data.navigationColor);
    this.backgroundColor = new Color(data.backgroundColor);
    this.enableNotifications = data.enableNotifications;
    this.startUrl = data.startUrl;
    this.iconUrl = data.iconUrl;
    this.maskableIconUrl = data.maskableIconUrl;
    this.splashScreenFadeOutDuration = data.splashScreenFadeOutDuration;
    this.signingKey = data.signingKey;
    this.appVersionName = data.appVersion;
    this.appVersionCode = data.appVersionCode || DEFAULT_APP_VERSION_CODE;
    this.shortcuts = data.shortcuts;
    this.generatorApp = data.generatorApp || DEFAULT_GENERATOR_APP_NAME;
    this.webManifestUrl = data.webManifestUrl ? new URL(data.webManifestUrl) : undefined;
    this.fallbackType = data.fallbackType || 'customtabs';
  }

  /**
   * Saves the TWA Manifest to the file-system.
   *
   * @param {String} filename the location where the TWA Manifest will be saved.
   */
  async saveToFile(filename: string): Promise<void> {
    console.log('Saving Config to: ' + filename);
    const json: TwaManifestJson = Object.assign({}, this, {
      themeColor: this.themeColor.hex(),
      navigationColor: this.navigationColor.hex(),
      backgroundColor: this.backgroundColor.hex(),
      appVersion: this.appVersionName,
      webManifestUrl: this.webManifestUrl ? this.webManifestUrl.toString() : undefined,
    });
    await fs.promises.writeFile(filename, JSON.stringify(json, null, 2));
  }

  /**
   * Validates if the Manifest has all the fields needed to generate a TWA project and if the
   * values for those fields are valid.
   *
   * @returns {string | null} the error, if any field has an error or null if all fields are valid.
   */
  validate(): string | null {
    let error;

    error = validateNotEmpty(this.host, 'host');
    if (error != null) {
      return error;
    }

    error = validateNotEmpty(this.name, 'name');
    if (error != null) {
      return error;
    }

    error = validateNotEmpty(this.startUrl, 'startUrl');
    if (error != null) {
      return error;
    }

    if (!this.iconUrl) {
      return 'iconUrl cannot be empty';
    }

    error = validateNotEmpty(this.iconUrl, 'iconUrl');
    if (error != null) {
      return error;
    }
    return error;
  }

  generateShortcuts(): string {
    return '[' + this.shortcuts.map((s: ShortcutInfo, i: number) =>
      `[name:'${s.name}', short_name:'${s.shortName}', url:'${s.url}', icon:'shortcut_${i}']`)
        .join(',') +
      ']';
  }

  /**
   * Creates a new TwaManifest, using the URL for the Manifest as a base URL and uses the content
   * of the Web Manifest to generate the fields for the TWA Manifest.
   *
   * @param {URL} webManifestUrl the URL where the webmanifest is available.
   * @param {WebManifest} webManifest the Web Manifest, used as a base for the TWA Manifest.
   * @returns {TwaManifest}
   */
  static fromWebManifestJson(webManifestUrl: URL, webManifest: WebManifestJson): TwaManifest {
    const icon: WebManifestIcon | null = webManifest.icons ?
      findSuitableIcon(webManifest.icons, 'any', MIN_ICON_SIZE) : null;

    const maskableIcon: WebManifestIcon | null = webManifest.icons ?
      findSuitableIcon(webManifest.icons, 'maskable', MIN_ICON_SIZE) : null;

    const fullStartUrl: URL = new URL(webManifest['start_url'] || '/', webManifestUrl);

    const shortcuts: ShortcutInfo[] = [];

    for (let i = 0; i < (webManifest.shortcuts || []).length; i++) {
      const s = webManifest.shortcuts![i];

      if (!s.icons || !s.url || (!s.name && !s.short_name)) {
        TwaManifest.log.warn(`Skipping shortcut[${i}] for missing metadata.`);
        continue;
      }

      const suitableIcon = findSuitableIcon(s.icons, 'any', MIN_SHORTCUT_ICON_SIZE);
      if (!suitableIcon) {
        TwaManifest.log.warn(`Skipping shortcut[${i}] for not finding a suitable icon.`);
        continue;
      }

      const name = s.name || s.short_name;
      const shortName = s.short_name || s.name!.substring(0, SHORT_NAME_MAX_SIZE);
      const url = new URL(s.url, webManifestUrl).toString();
      const iconUrl = new URL(suitableIcon.src, webManifestUrl).toString();
      const shortcutInfo = new ShortcutInfo(name!, shortName!, url, iconUrl);

      shortcuts.push(shortcutInfo);

      if (shortcuts.length === 4) {
        break;
      }
    }

    const twaManifest = new TwaManifest({
      packageId: generatePackageId(webManifestUrl.host) || '',
      host: webManifestUrl.host,
      name: webManifest['name'] || webManifest['short_name'] || DEFAULT_APP_NAME,
      launcherName: webManifest['short_name'] ||
          webManifest['name']?.substring(0, SHORT_NAME_MAX_SIZE) || DEFAULT_APP_NAME,
      themeColor: webManifest['theme_color'] || DEFAULT_THEME_COLOR,
      navigationColor: DEFAULT_NAVIGATION_COLOR,
      backgroundColor: webManifest['background_color'] || DEFAULT_BACKGROUND_COLOR,
      startUrl: fullStartUrl.pathname + fullStartUrl.search,
      iconUrl: icon ? new URL(icon.src, webManifestUrl).toString() : undefined,
      maskableIconUrl:
         maskableIcon ? new URL(maskableIcon.src, webManifestUrl).toString() : undefined,
      appVersion: DEFAULT_APP_VERSION_NAME,
      signingKey: {
        path: DEFAULT_SIGNING_KEY_PATH,
        alias: DEFAULT_SIGNING_KEY_ALIAS,
      },
      splashScreenFadeOutDuration: DEFAULT_SPLASHSCREEN_FADEOUT_DURATION,
      enableNotifications: DEFAULT_ENABLE_NOTIFICATIONS,
      shortcuts: shortcuts,
      webManifestUrl: webManifestUrl.toString(),
    });
    return twaManifest;
  }

  /**
   * Fetches a Web Manifest from the url and uses it as a base for the TWA Manifest.
   *
   * @param {String} url the URL where the webmanifest is available
   * @returns {TwaManifest}
   */
  static async fromWebManifest(url: string): Promise<TwaManifest> {
    const response = await fetch(url);
    const webManifest = await response.json();
    const webManifestUrl: URL = new URL(url);
    return TwaManifest.fromWebManifestJson(webManifestUrl, webManifest);
  }

  /**
   * Loads a TWA Manifest from the file system.
   *
   * @param {String} fileName the location of the TWA Manifest file
   */
  static async fromFile(fileName: string): Promise<TwaManifest> {
    const json = JSON.parse((await fs.promises.readFile(fileName)).toString());
    return new TwaManifest(json);
  }
}

/**
 * A JSON representation of the TWA Manifest. Used when loading and saving the Manifest
 */
export interface TwaManifestJson {
  packageId: string;
  host: string;
  name: string;
  launcherName?: string; // Older Manifests may not have this field.
  themeColor: string;
  navigationColor: string;
  backgroundColor: string;
  enableNotifications: boolean;
  startUrl: string;
  iconUrl?: string;
  maskableIconUrl?: string;
  splashScreenFadeOutDuration: number;
  signingKey: SigningKeyInfo;
  appVersionCode?: number; // Older Manifests may not have this field.
  appVersion: string; // appVersionName - Old Manifests use `appVersion`. Keeping compatibility.
  shortcuts: ShortcutInfo[];
  generatorApp?: string;
  webManifestUrl?: string;
  fallbackType?: FallbackType;
}

export interface SigningKeyInfo {
  path: string;
  alias: string;
}
