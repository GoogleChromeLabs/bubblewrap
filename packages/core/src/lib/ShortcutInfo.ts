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

'use strict';

import {findSuitableIcon} from './util';
import {WebManifestShortcutJson, WebManifestIcon} from './types/WebManifest';

// As described on https://developer.chrome.com/apps/manifest/name#short_name
const SHORT_NAME_MAX_SIZE = 12;

// The minimum size needed for the shortcut icon
const MIN_SHORTCUT_ICON_SIZE = 96;

/**
 * A wrapper around the WebManifest's ShortcutInfo.
 */
export class ShortcutInfo {
  /**
   * @param {string} name
   * @param {string} shortName
   * @param {string} url target Url for when the shortcut is clicked
   * @param {string} chosenIconUrl Url for the icon with an "any" purpose
   * @param {string} chosenMaskableIconUrl Url for the icon with a maskable purpose
   * @param {string} chosenMonochromeIconUrl Url for the icon with a monochrome purpose
   */
  constructor(readonly name: string, readonly shortName: string, readonly url: string,
      readonly chosenIconUrl?: string, readonly chosenMaskableIconUrl?: string,
      readonly chosenMonochromeIconUrl?: string) {
    if (!chosenIconUrl && !chosenMonochromeIconUrl) {
      throw new Error(
          `ShortcutInfo ${name} must have either chosenIconUrl or chosenMonochromeIconUrl`);
    }
  }

  toString(index: number): string {
    return `[name:'${this.name}', short_name:'${this.shortName}', ` +
      `url:'${this.url}', icon:'${this.assetName(index)}']`;
  }

  assetName(index: number): string {
    return `shortcut_${index}`;
  }

  /**
   * Creates a new TwaManifest, using the URL for the Manifest as a base URL and uses the content
   * of the Web Manifest to generate the fields for the TWA Manifest.
   *
   * @param {URL} webManifestUrl the URL where the webmanifest is available.
   * @param {WebManifest} webManifest the Web Manifest, used as a base for the TWA Manifest.
   * @returns {TwaManifest}
   */
  static fromShortcutJson(webManifestUrl: URL, shortcut: WebManifestShortcutJson): ShortcutInfo {
    const name = shortcut.name || shortcut.short_name;

    if (!shortcut.icons || !shortcut.url || !name) {
      throw new Error('missing metadata');
    }

    const suitableIcon = findSuitableIcon(shortcut.icons, 'any', MIN_SHORTCUT_ICON_SIZE);
    const suitableMaskableIcon =
      findSuitableIcon(shortcut.icons, 'maskable', MIN_SHORTCUT_ICON_SIZE);
    const suitableMonochromeIcon =
      findSuitableIcon(shortcut.icons, 'monochrome', MIN_SHORTCUT_ICON_SIZE);

    if (!suitableIcon && !suitableMonochromeIcon) {
      // maskable icons also need an equivalent any icon for lower API versions.
      // any and monochrome icons work on all API versions.
      throw new Error('not finding a suitable icon');
    }

    function resolveIconUrl(icon: WebManifestIcon | null): string | undefined {
      return icon ? new URL(icon.src, webManifestUrl).toString() : undefined;
    }

    const shortName = shortcut.short_name || shortcut.name!.substring(0, SHORT_NAME_MAX_SIZE);
    const url = new URL(shortcut.url, webManifestUrl).toString();
    const shortcutInfo = new ShortcutInfo(name!, shortName!, url, resolveIconUrl(suitableIcon),
        resolveIconUrl(suitableMaskableIcon), resolveIconUrl(suitableMonochromeIcon));

    return shortcutInfo;
  }
}
