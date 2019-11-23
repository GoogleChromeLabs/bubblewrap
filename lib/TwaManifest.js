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

const fs = require('fs');
const fetch = require('node-fetch');
const util = require('./util');
const colorString = require('color-string');

// Regex for disallowed characters on Android Packages, as per
// https://developer.android.com/guide/topics/manifest/manifest-element.html#package
const DISALLOWED_ANDROID_PACKAGE_CHARS_REGEX = /[^ a-zA-Z0-9_\.]/;

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
function generatePackageId(host) {
  const parts = host.split('.').reverse();
  parts.push('twa');
  return parts.join('.').replace(DISALLOWED_ANDROID_PACKAGE_CHARS_REGEX, '_');
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
 * useBrowserOnChromeOS: true, // Set to false if you've added interaction with Android system APIs.
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
class TwaManifest {
  constructor(data) {
    this.packageId = data.packageId;
    this.host = data.host;
    this.name = data.name;
    this.themeColor = data.themeColor;
    this.navigationColor = data.navigationColor;
    this.backgroundColor = data.backgroundColor;
    this.enableNotifications = data.enableNotifications;
    this.startUrl = data.startUrl;
    this.iconUrl = data.iconUrl;
    this.maskableIconUrl = data.maskableIconUrl;
    this.useBrowserOnChromeOS = data.useBrowserOnChromeOS;
    this.splashScreenFadeOutDuration = data.splashScreenFadeOutDuration;
    this.signingKey = data.signingKey;
    this.appVersion = data.appVersion;
  }

  /**
   * Saves the TWA Manifest to the file-system.
   *
   * @param {String} filename the location where the TWA Manifest will be saved.
   */
  async saveToFile(filename) {
    console.log('Saving Config to: ' + filename);
    await fs.promises.writeFile(filename, JSON.stringify(this, null, 2));
  }

  /**
   * Validates if the Manifest has all the fields needed to generate a TWA project and if the
   * values for those fields are valid.
   */
  validate() {
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

  _hexColor(color) {
    const rgbColor = colorString.get.rgb(color);
    return colorString.to.hex(rgbColor);
  }

  themeColorHex() {
    return this._hexColor(this.themeColor);
  }

  navigationColorHex() {
    return this._hexColor(this.navigationColor);
  }

  backgroundColorHex() {
    return this._hexColor(this.backgroundColor);
  }

  /**
   * Creates a new TwaManifest, using the URL for the Manifest as a base URL and uses the content
   * of the Web Manifest to generate the fields for the TWA Manifest.
   *
   * @param {URL} webManifestUrl the URL where the webmanifest is available
   * @param {WebManifest} the Web Manifest, used as a base for the TWA Manifest.
   * @returns {TwaManifest}
   */
  static fromWebManifestJson(webManifestUrl, webManifest) {
    const icon = util.findSuitableIcon(webManifest, 'any');
    const maskableIcon = util.findSuitableIcon(webManifest, 'maskable');
    const fullStartUrl = new URL(webManifest['start_url'] || '/', webManifestUrl);

    const twaManifest = new TwaManifest({
      packageId: generatePackageId(webManifestUrl.host),
      host: webManifestUrl.host,
      name: webManifest['short_name'] || webManifest['name'] || 'My TWA',
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
      splashScreenFadeOutDuration: 300,
      useBrowserOnChromeOS: true,
      enableNotifications: false,
    });
    return twaManifest;
  }

  /**
   * Fetches a Web Manifest from the url and uses it as a base for the TWA Manifest.
   *
   * @param {String} url the URL where the webmanifest is available
   * @returns {TwaManifest}
   */
  static async fromWebManifest(url) {
    const webManifest = await fetch(url).then((res) => res.json());
    const webManifestUrl = new URL(url);
    return TwaManifest.fromWebManifestJson(webManifestUrl, webManifest);
  }

  /**
   * Loads a TWA Manifest from the file system.
   *
   * @param {String} fileName the location of the TWA Manifest file
   */
  static async fromFile(fileName) {
    const json = JSON.parse(await fs.promises.readFile(fileName));
    return new TwaManifest(json);
  }
}

module.exports = TwaManifest;
