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
import {WebManifestShortcutJson} from './types/WebManifest';

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
   * @param {string} chosenIconUrl Url for the icon
   */
  constructor(readonly name: string, readonly shortName: string, readonly url: string,
        readonly chosenIconUrl: string) {
  }

  toString(index: number): string {
    return `[name:'${this.name}', short_name:'${this.shortName}', ` +
      `url:'${this.url}', icon:'shortcut_${index}']`;
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
    if (!suitableIcon) {
      throw new Error('not finding a suitable icon');
    }

    const shortName = shortcut.short_name || shortcut.name!.substring(0, SHORT_NAME_MAX_SIZE);
    const url = new URL(shortcut.url, webManifestUrl).toString();
    const iconUrl = new URL(suitableIcon.src, webManifestUrl).toString();
    const shortcutInfo = new ShortcutInfo(name!, shortName!, url, iconUrl);

    return shortcutInfo;
  }
}
