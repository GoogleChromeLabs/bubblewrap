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
import * as util from './util';
import Color = require('color');
import {WebManifestIcon, WebManifestJson, WebManifestShortcutJson} from './types/WebManifest';

// Regex for disallowed characters on Android Packages, as per
// https://developer.android.com/guide/topics/manifest/manifest-element.html#package
const DISALLOWED_ANDROID_PACKAGE_CHARS_REGEX = /[^ a-zA-Z0-9_\.]/;

// The minimum size needed for the app icon.
const MIN_ICON_SIZE = 512;

/**
 * Generates an Android Application Id / Package Name, using the reverse hostname as a base
 * and appending `.twa` to the end.
 *
 * Replaces invalid characters, as described in the Android documentation with `_`.
 *
 * https://developer.android.com/guide/topics/manifest/manifest-element.html#package
 *
 * @param {String} host the original hostname
 */
function generatePackageId(host: string): string {
  const parts = host.split('.').reverse();
  parts.push('twa');
  return parts.join('.').replace(DISALLOWED_ANDROID_PACKAGE_CHARS_REGEX, '_');
}

/**
 * A wrapper around the WebManifest's ShortcutInfo.
 */
class ShortcutInfo {
  name: string;
  shortName: string;
  url: string | undefined;
  chosenIconUrl: string | undefined;

  /**
   * @param {Object} the WebManifest's ShortcutInfo.
   * @param {URL} webManifestUrl the URL where the webmanifest is available.
   */
  constructor(shortcutInfo: WebManifestShortcutJson, webManifestUrl: URL) {
    this.name = shortcutInfo['name'] || '';
    this.shortName = shortcutInfo['short_name'] || this.name;
    this.url = shortcutInfo['url'] ?
      new URL(shortcutInfo['url'], webManifestUrl).toString() : undefined;

    const suitableIcon = util.findSuitableIcon(shortcutInfo['icons'], 'any');

    this.chosenIconUrl = suitableIcon ?
      new URL(suitableIcon.src, webManifestUrl).toString() : undefined;
  }

  isValid(): boolean {
    return this.name != undefined && this.url != undefined && this.chosenIconUrl != undefined;
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
  useBrowserOnChromeOS: boolean;
  splashScreenFadeOutDuration: number;
  signingKey: SigningKeyInfo;
  appVersion: string;
  shortcuts: string;

  constructor(data: TwaManifestJson) {
    this.packageId = data.packageId;
    this.host = data.host;
    this.name = data.name;
    this.launcherName = data.launcherName;
    this.themeColor = new Color(data.themeColor);
    this.navigationColor = new Color(data.navigationColor);
    this.backgroundColor = new Color(data.backgroundColor);
    this.enableNotifications = data.enableNotifications;
    this.startUrl = data.startUrl;
    this.iconUrl = data.iconUrl;
    this.maskableIconUrl = data.maskableIconUrl;
    this.useBrowserOnChromeOS = data.useBrowserOnChromeOS;
    this.splashScreenFadeOutDuration = data.splashScreenFadeOutDuration;
    this.signingKey = data.signingKey;
    this.appVersion = data.appVersion;
    this.shortcuts = data.shortcuts;
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
    });
    await fs.promises.writeFile(filename, JSON.stringify(json, null, 2));
  }

  /**
   * Validates if the Manifest has all the fields needed to generate a TWA project and if the
   * values for those fields are valid.
   */
  validate(): boolean {
    if (!this.host) {
      return false;
    }

    if (!this.name) {
      return false;
    }

    if (!this.startUrl) {
      return false;
    }

    if (!this.iconUrl) {
      return false;
    }

    return true;
  }

  generateShortcuts(): string {
    return '[' + JSON.parse(this.shortcuts).map((s: ShortcutInfo, i: number) =>
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
    const icon: WebManifestIcon = util.findSuitableIcon(webManifest.icons, 'any', MIN_ICON_SIZE);
    const maskableIcon: WebManifestIcon =
      util.findSuitableIcon(webManifest.icons, 'maskable', MIN_ICON_SIZE);
    const fullStartUrl: URL = new URL(webManifest['start_url'] || '/', webManifestUrl);

    const shortcuts = (webManifest.shortcuts || [])
        .map((s: WebManifestShortcutJson) => new ShortcutInfo(s, webManifestUrl))
        .filter((s: ShortcutInfo) => s.isValid())
        .filter((_: ShortcutInfo, i: number) => i < 4);

    const twaManifest = new TwaManifest({
      packageId: generatePackageId(webManifestUrl.host),
      host: webManifestUrl.host,
      name: webManifest['name'] || webManifest['short_name'] || 'My TWA',
      launcherName: webManifest['short_name'] || webManifest['name'] || 'My TWA',
      themeColor: webManifest['theme_color'] || '#FFFFFF',
      navigationColor: webManifest['theme_color'] || '#FFFFFF',
      backgroundColor: webManifest['background_color'] || '#FFFFFF',
      startUrl: fullStartUrl.pathname + fullStartUrl.search,
      iconUrl: icon ? new URL(icon.src, webManifestUrl).toString() : undefined,
      maskableIconUrl:
         maskableIcon ? new URL(maskableIcon.src, webManifestUrl).toString() : undefined,
      appVersion: '1.0.0',
      signingKey: {
        path: './android.keystore',
        alias: 'android',
      },
      useBrowserOnChromeOS: true,
      splashScreenFadeOutDuration: 300,
      enableNotifications: false,
      shortcuts: JSON.stringify(shortcuts, undefined, 2),
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
  launcherName: string;
  themeColor: string;
  navigationColor: string;
  backgroundColor: string;
  enableNotifications: boolean;
  startUrl: string;
  iconUrl?: string;
  maskableIconUrl?: string;
  useBrowserOnChromeOS: boolean;
  splashScreenFadeOutDuration: number;
  signingKey: SigningKeyInfo;
  appVersion: string;
  shortcuts: string;
}

export interface SigningKeyInfo {
  path: string;
  alias: string;
}
