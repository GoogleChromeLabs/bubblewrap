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
import {ConsoleLog} from './Log';
import {ShareTarget, WebManifestIcon, WebManifestJson} from './types/WebManifest';
import {ShortcutInfo} from './ShortcutInfo';
import {AppsFlyerConfig} from './features/AppsFlyerFeature';
import {LocationDelegationConfig} from './features/LocationDelegationFeature';
import {PlayBillingConfig} from './features/PlayBillingFeature';
import {FirstRunFlagConfig} from './features/FirstRunFlagFeature';

// The minimum size needed for the app icon.
const MIN_ICON_SIZE = 512;

// As described on https://developer.chrome.com/apps/manifest/name#short_name
const SHORT_NAME_MAX_SIZE = 12;

// The minimum size needed for the notification icon
const MIN_NOTIFICATION_ICON_SIZE = 48;

// Supported display modes for TWA
const DISPLAY_MODE_VALUES = ['standalone', 'fullscreen', 'fullscreen-sticky'];
export type DisplayMode = typeof DISPLAY_MODE_VALUES[number];
export const DisplayModes: DisplayMode[] = [...DISPLAY_MODE_VALUES];

export function asDisplayMode(input: string): DisplayMode | null {
  return DISPLAY_MODE_VALUES.includes(input) ? input as DisplayMode : null;
}

// Possible values for screen orientation, as defined in `android-browser-helper`:
// https://github.com/GoogleChrome/android-browser-helper/blob/alpha/androidbrowserhelper/src/main/java/com/google/androidbrowserhelper/trusted/LauncherActivityMetadata.java#L191-L216
const ORIENTATION_VALUES = ['default', 'any', 'natural', 'landscape', 'portrait',
  'portrait-primary', 'portrait-secondary', 'landscape-primary', 'landscape-secondary'];
export type Orientation = typeof ORIENTATION_VALUES[number];
export const Orientations: Orientation[] = [...ORIENTATION_VALUES];

export function asOrientation(input?: string): Orientation | null {
  if (!input) {
    return null;
  }
  return ORIENTATION_VALUES.includes(input) ? input as Orientation : null;
}

// Default values used on the Twa Manifest
const DEFAULT_SPLASHSCREEN_FADEOUT_DURATION = 300;
const DEFAULT_APP_NAME = 'My TWA';
const DEFAULT_DISPLAY_MODE = 'standalone';
const DEFAULT_THEME_COLOR = '#FFFFFF';
const DEFAULT_NAVIGATION_COLOR = '#000000';
const DEFAULT_NAVIGATION_DIVIDER_COLOR = '#00000000';
const DEFAULT_BACKGROUND_COLOR = '#FFFFFF';
const DEFAULT_APP_VERSION_CODE = 1;
const DEFAULT_APP_VERSION_NAME = DEFAULT_APP_VERSION_CODE.toString();
const DEFAULT_SIGNING_KEY_PATH = './android.keystore';
const DEFAULT_SIGNING_KEY_ALIAS = 'android';
const DEFAULT_ENABLE_NOTIFICATIONS = true;
const DEFAULT_GENERATOR_APP_NAME = 'unknown';
const DEFAULT_ORIENTATION = 'default';

export type FallbackType = 'customtabs' | 'webview';

type Features = {
  appsFlyer?: AppsFlyerConfig;
  locationDelegation?: LocationDelegationConfig;
  playBilling?: PlayBillingConfig;
  firstRunFlag?: FirstRunFlagConfig;
};

type alphaDependencies = {
  enabled: boolean;
};

/**
 * A Manifest used to generate the TWA Project
 *
 * applicationId: '<%= packageId %>',
 * hostName: '<%= host %>', // The domain being opened in the TWA.
 * launchUrl: '<%= startUrl %>', // The start path for the TWA. Must be relative to the domain.
 * name: '<%= name %>', // The name shown on the Android Launcher.
 * display: '<%= display %>', // The display mode for the TWA.
 * themeColor: '<%= themeColor %>', // The color used for the status bar.
 * navigationColor: '<%= themeColor %>', // The color used for the navigation bar.
 * navigationColorDark: '<%= navigationColorDark %>', // The color used for the dark navbar.
 * navigationDividerColor: '<%= navigationDividerColor %>', // The color used for the
 * navbar divider.
 * navigationDividerColorDark: '<%= navigationDividerColorDark %>', // The color used for the dark
 * navbar divider.
 * backgroundColor: '<%= backgroundColor %>', // The color used for the splash screen background.
 * enableNotifications: false, // Set to true to enable notification delegation.
 * enableSiteSettingsShortcut: true, // Set to false to disable the shortcut into site settings.
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
 * isChromeOSOnly: false, // Setting to true will enable a feature that prevents non-ChromeOS devices
 *  from installing the app.
 * serviceAccountJsonFile: '<%= serviceAccountJsonFile %>', // The service account used to communicate with
 *  Google Play.
 *
 */
export class TwaManifest {
  packageId: string;
  host: string;
  name: string;
  launcherName: string;
  display: DisplayMode;
  themeColor: Color;
  navigationColor: Color;
  navigationColorDark: Color;
  navigationDividerColor: Color;
  navigationDividerColorDark: Color;
  backgroundColor: Color;
  enableNotifications: boolean;
  startUrl: string;
  iconUrl: string | undefined;
  maskableIconUrl: string | undefined;
  monochromeIconUrl: string | undefined;
  splashScreenFadeOutDuration: number;
  signingKey: SigningKeyInfo;
  appVersionCode: number;
  appVersionName: string;
  shortcuts: ShortcutInfo[];
  generatorApp: string;
  webManifestUrl?: URL;
  fallbackType: FallbackType;
  features: Features;
  alphaDependencies: alphaDependencies;
  enableSiteSettingsShortcut: boolean;
  isChromeOSOnly: boolean;
  shareTarget?: ShareTarget;
  orientation: Orientation;
  fingerprints: Fingerprint[];
  serviceAccountJsonFile: string | undefined;

  private static log = new ConsoleLog('twa-manifest');

  constructor(data: TwaManifestJson) {
    this.packageId = data.packageId;
    this.host = data.host;
    this.name = data.name;
    // Older manifests may not have this field:
    this.launcherName = data.launcherName || data.name;
    // Older manifests may not have this field:
    this.display = asDisplayMode(data.display!) || DEFAULT_DISPLAY_MODE;
    this.themeColor = new Color(data.themeColor);
    this.navigationColor = new Color(data.navigationColor);
    this.navigationColorDark = new Color(data.navigationColorDark ?? DEFAULT_NAVIGATION_COLOR);
    this.navigationDividerColor = new Color(data.navigationDividerColor ??
      DEFAULT_NAVIGATION_DIVIDER_COLOR);
    this.navigationDividerColorDark = new Color(data.navigationDividerColorDark ??
      DEFAULT_NAVIGATION_COLOR);
    this.backgroundColor = new Color(data.backgroundColor);
    this.enableNotifications = data.enableNotifications;
    this.startUrl = data.startUrl;
    this.iconUrl = data.iconUrl;
    this.maskableIconUrl = data.maskableIconUrl;
    this.monochromeIconUrl = data.monochromeIconUrl;
    this.splashScreenFadeOutDuration = data.splashScreenFadeOutDuration;
    this.signingKey = data.signingKey;
    this.appVersionName = data.appVersion;
    this.appVersionCode = data.appVersionCode || DEFAULT_APP_VERSION_CODE;
    this.shortcuts = (data.shortcuts || []).map((si) => {
      return new ShortcutInfo(si.name, si.shortName, si.url, si.chosenIconUrl,
          si.chosenMaskableIconUrl, si.chosenMonochromeIconUrl);
    });
    this.generatorApp = data.generatorApp || DEFAULT_GENERATOR_APP_NAME;
    this.webManifestUrl = data.webManifestUrl ? new URL(data.webManifestUrl) : undefined;
    this.fallbackType = data.fallbackType || 'customtabs';
    this.features = data.features || {};
    this.alphaDependencies = data.alphaDependencies || {enabled: false};
    this.enableSiteSettingsShortcut = data.enableSiteSettingsShortcut != undefined ?
      data.enableSiteSettingsShortcut : true;
    this.isChromeOSOnly = data.isChromeOSOnly != undefined ? data.isChromeOSOnly : false;
    this.shareTarget = data.shareTarget;
    this.orientation = data.orientation || DEFAULT_ORIENTATION;
    this.fingerprints = data.fingerprints || [];
    this.serviceAccountJsonFile = data.serviceAccountJsonFile;
  }

  /**
   * Turns an TwaManifest into a TwaManifestJson.
   *
   * @returns {TwaManifestJson}
   */
  toJson(): TwaManifestJson {
    return Object.assign({}, this, {
      themeColor: this.themeColor.hex(),
      navigationColor: this.navigationColor.hex(),
      navigationColorDark: this.navigationColorDark.hex(),
      navigationDividerColor: this.navigationDividerColor.hex(),
      navigationDividerColorDark: this.navigationDividerColorDark.hex(),
      backgroundColor: this.backgroundColor.hex(),
      appVersion: this.appVersionName,
      webManifestUrl: this.webManifestUrl ? this.webManifestUrl.toString() : undefined,
    });
  }

  /**
   * Saves the TWA Manifest to the file-system.
   *
   * @param {String} filename the location where the TWA Manifest will be saved.
   */
  async saveToFile(filename: string): Promise<void> {
    const json: TwaManifestJson = this.toJson();
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
    return '[' + this.shortcuts.map((shortcut, i) => shortcut.toString(i)).join(',') + ']';
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
    const icon = findSuitableIcon(webManifest.icons, 'any', MIN_ICON_SIZE);
    const maskableIcon = findSuitableIcon(webManifest.icons, 'maskable', MIN_ICON_SIZE);
    const monochromeIcon =
      findSuitableIcon(webManifest.icons, 'monochrome', MIN_NOTIFICATION_ICON_SIZE);

    const fullStartUrl: URL = new URL(webManifest['start_url'] || '/', webManifestUrl);
    const shortcuts: ShortcutInfo[] = this.getShortcuts(webManifestUrl, webManifest);

    function resolveIconUrl(icon: WebManifestIcon | null): string | undefined {
      return icon ? new URL(icon.src, webManifestUrl).toString() : undefined;
    }

    const twaManifest = new TwaManifest({
      packageId: generatePackageId(webManifestUrl.host) || '',
      host: webManifestUrl.host,
      name: webManifest['name'] || webManifest['short_name'] || DEFAULT_APP_NAME,
      launcherName: webManifest['short_name'] ||
        webManifest['name']?.substring(0, SHORT_NAME_MAX_SIZE) || DEFAULT_APP_NAME,
      display: asDisplayMode(webManifest['display']!) || DEFAULT_DISPLAY_MODE,
      themeColor: webManifest['theme_color'] || DEFAULT_THEME_COLOR,
      navigationColor: DEFAULT_NAVIGATION_COLOR,
      navigationColorDark: DEFAULT_NAVIGATION_COLOR,
      navigationDividerColor: DEFAULT_NAVIGATION_DIVIDER_COLOR,
      navigationDividerColorDark: DEFAULT_NAVIGATION_DIVIDER_COLOR,
      backgroundColor: webManifest['background_color'] || DEFAULT_BACKGROUND_COLOR,
      startUrl: fullStartUrl.pathname + fullStartUrl.search,
      iconUrl: resolveIconUrl(icon),
      maskableIconUrl: resolveIconUrl(maskableIcon),
      monochromeIconUrl: resolveIconUrl(monochromeIcon),
      appVersion: DEFAULT_APP_VERSION_NAME,
      signingKey: {
        path: DEFAULT_SIGNING_KEY_PATH,
        alias: DEFAULT_SIGNING_KEY_ALIAS,
      },
      splashScreenFadeOutDuration: DEFAULT_SPLASHSCREEN_FADEOUT_DURATION,
      enableNotifications: DEFAULT_ENABLE_NOTIFICATIONS,
      shortcuts: shortcuts,
      webManifestUrl: webManifestUrl.toString(),
      features: {},
      shareTarget: TwaManifest.verifyShareTarget(webManifestUrl, webManifest.share_target),
      orientation: asOrientation(webManifest.orientation) || DEFAULT_ORIENTATION,
    });
    return twaManifest;
  }

  private static verifyShareTarget(
      webManifestUrl: URL, shareTarget?: ShareTarget): ShareTarget | undefined {
    if (!shareTarget?.action) {
      return undefined;
    }

    if (shareTarget?.params?.files) {
      for (const file of shareTarget.params.files) {
        if (!file.accept) {
          return undefined;
        }
      }
    }

    return {
      ...shareTarget,
      // Ensure action is an absolute URL.
      action: new URL(shareTarget.action, webManifestUrl).toString(),
    };
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

  /**
   * Given a field name, returns the new value of the field.
   *
   * @param {string} fieldName the name of the given field.
   * @param {string[]} fieldsToIgnore the fields which needs to be ignored.
   * @param {T} oldValue the old value of the field.
   * @param {T} newValue the new value of the field.
   * @returns {T}
   */
  static getNewFieldValue<T>(fieldName: string, fieldsToIgnore: string[],
      oldValue: T, newValue: T): T {
    if (fieldsToIgnore.includes(fieldName)) {
      return oldValue;
    }
    return newValue || oldValue;
  }

  /**
   * Gets the shortcuts from the web manifest.
   *
   * @param {URL} webManifestUrl the URL where the webManifest is available.
   * @param {WebManifest} webManifest the Web Manifest.
   * @returns {ShortcutInfo[]}
   */
  static getShortcuts(webManifestUrl: URL, webManifest: WebManifestJson): ShortcutInfo[] {
    const shortcuts: ShortcutInfo[] = [];
    for (let i = 0; i < (webManifest.shortcuts || []).length; i++) {
      const s = webManifest.shortcuts![i];
      try {
        const shortcutInfo = ShortcutInfo.fromShortcutJson(webManifestUrl, s);
        if (shortcutInfo != null) {
          shortcuts.push(shortcutInfo);
        }
      } catch (err) {
        TwaManifest.log.warn(`Skipping shortcut[${i}] for ${err.message}.`);
      }
      if (shortcuts.length === 4) {
        break;
      }
    }
    return shortcuts;
  }

  /**
   * @param {string[]} fieldsToIgnore the fields which needs to be ignored.
   * @param {string} fieldName the name of the given field.
   * @param {string} oldUrl the url of the old twaManifest.
   * @param {WebManifestIcon[]} icons the list of icons from the web manifest.
   * @param {string} iconType the type of the requested icon.
   * @param {number} iconSize the size of the requested icon.
   * @param {URL} webManifestUrl the URL where the webManifest is available.
   * @returns {string | undefined} the new icon url.
   */
  static getNewIconUrl(fieldsToIgnore: string[], fieldName: string, oldUrl: string,
      icons: WebManifestIcon[], iconType: string, iconSize: number, webManifestUrl: URL):
      string | undefined {
    function resolveIconUrl(icon: WebManifestIcon | null): string | undefined {
      return icon ? new URL(icon.src, webManifestUrl).toString() : undefined;
    }
    return (fieldsToIgnore.includes(fieldName))? oldUrl:
        resolveIconUrl(findSuitableIcon(icons, iconType, iconSize));
  }

  /**
   * Merges the Twa Manifest with the web manifest. Ignores the specified fields.
   *
   * @param {string[]} fieldsToIgnore the fields which needs to be ignored.
   * @param {URL} webManifestUrl the URL where the webManifest is available.
   * @param {WebManifest} webManifest the Web Manifest, used as a base for the update of
   *    the TWA Manifest.
   * @param {TwaManifest} oldTwaManifest current Twa Manifest.
   * @returns {Promise<TwaManifest>} the new and merged Twa manifest.
   */
  static async merge(fieldsToIgnore: string[], webManifestUrl: URL,
      webManifest: WebManifestJson, oldTwaManifest: TwaManifest): Promise<TwaManifest> {
    let shortcuts: ShortcutInfo[] = oldTwaManifest.shortcuts;
    if (!(fieldsToIgnore.includes('shortcuts'))) {
      shortcuts = this.getShortcuts(webManifestUrl, webManifest);
    }
    const oldTwaManifestJson = oldTwaManifest.toJson();
    const iconUrl = this.getNewIconUrl(fieldsToIgnore, 'icons', oldTwaManifestJson.iconUrl!,
        webManifest.icons!, 'any', MIN_ICON_SIZE, webManifestUrl);
    const maskableIconUrl = this.getNewIconUrl(fieldsToIgnore, 'maskableIcons',
        oldTwaManifestJson.iconUrl!, webManifest.icons!, 'maskable', MIN_ICON_SIZE, webManifestUrl);
    const monochromeIconUrl = this.getNewIconUrl(fieldsToIgnore, 'monochromeIcons',
        oldTwaManifestJson.iconUrl!, webManifest.icons!, 'monochrome', MIN_NOTIFICATION_ICON_SIZE,
        webManifestUrl);

    const fullStartUrl: URL = new URL(webManifest['start_url'] || '/', webManifestUrl);

    const twaManifest = new TwaManifest({
      ...oldTwaManifestJson,
      name: this.getNewFieldValue('name', fieldsToIgnore, oldTwaManifest.name,
          webManifest['name'] || webManifest['short_name']!),
      launcherName: this.getNewFieldValue('short_name', fieldsToIgnore,
          oldTwaManifest.launcherName, webManifest['short_name'] ||
          webManifest['name']?.substring(0, SHORT_NAME_MAX_SIZE)),
      display: this.getNewFieldValue('display', fieldsToIgnore, oldTwaManifest.display,
          asDisplayMode(webManifest['display']!)!),
      themeColor: this.getNewFieldValue('themeColor', fieldsToIgnore,
          oldTwaManifest.themeColor.hex(), webManifest['theme_color']!),
      backgroundColor: this.getNewFieldValue('backgroundColor', fieldsToIgnore,
          oldTwaManifest.backgroundColor.hex(), webManifest['background_color']!),
      startUrl: this.getNewFieldValue('startUrl', fieldsToIgnore, oldTwaManifest.startUrl,
          fullStartUrl.pathname + fullStartUrl.search),
      iconUrl: iconUrl || oldTwaManifestJson.iconUrl,
      maskableIconUrl: maskableIconUrl || oldTwaManifestJson.maskableIconUrl,
      monochromeIconUrl: monochromeIconUrl || oldTwaManifestJson.monochromeIconUrl,
      shortcuts: shortcuts,
    });
    return twaManifest;
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
  display?: string; // Older Manifests may not have this field.
  themeColor: string;
  navigationColor: string;
  navigationColorDark?: string;
  navigationDividerColor?: string;
  navigationDividerColorDark?: string;
  backgroundColor: string;
  enableNotifications: boolean;
  startUrl: string;
  iconUrl?: string;
  maskableIconUrl?: string;
  monochromeIconUrl?: string;
  splashScreenFadeOutDuration: number;
  signingKey: SigningKeyInfo;
  appVersionCode?: number; // Older Manifests may not have this field.
  appVersion: string; // appVersionName - Old Manifests use `appVersion`. Keeping compatibility.
  shortcuts?: ShortcutInfo[];
  generatorApp?: string;
  webManifestUrl?: string;
  fallbackType?: FallbackType;
  features?: {
    appsFlyer?: AppsFlyerConfig;
    locationDelegation?: LocationDelegationConfig;
    playBilling?: PlayBillingConfig;
    firstRunFlag?: FirstRunFlagConfig;
  };
  alphaDependencies?: {
    enabled: boolean;
  };
  enableSiteSettingsShortcut?: boolean;
  isChromeOSOnly?: boolean;
  shareTarget?: ShareTarget;
  orientation?: Orientation;
  fingerprints?: Fingerprint[];
  serviceAccountJsonFile?: string;
}

export interface SigningKeyInfo {
  path: string;
  alias: string;
}

export type Fingerprint = {
  name?: string;
  value: string;
}
