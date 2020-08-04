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

import * as path from 'path';
import * as fs from 'fs';
import * as Jimp from 'jimp';
import fetch from 'node-fetch';
import Color = require('color');
import {promisify} from 'util';

// fs.promises is marked as experimental. This should be replaced when stable.
const fsMkDir = promisify(fs.mkdir);

export interface IconDefinition {
  dest: string;
  size: number;
}

interface Icon {
  url: string;
  data: Jimp;
}

export class ImageHelper {
  private async saveIcon(icon: Icon, size: number, fileName: string): Promise<void> {
    const image = await Jimp.read(icon.data);
    image.resize(size, size);
    await image.writeAsync(fileName);
  }

  /**
   * Generate a file for the given icon inside targetDir.
   *
   * @param {Object} icon Object containing the original URL and the icon image data.
   * @param {string} targetDir Path to the directory the image will be saved in.
   * @param {Object} iconDef Icon definitions specifying the size the icon should be exported as.
   */
  async generateIcon(
      icon: Icon, targetDir: string, iconDef: IconDefinition): Promise<void> {
    const destFile = path.join(targetDir, iconDef.dest);
    await fsMkDir(path.dirname(destFile), {recursive: true});
    return await this.saveIcon(icon, iconDef.size, destFile);
  }

  /**
   * Set the color of a monochrome icon to be the theme color.
   *
   * @param {Object} icon Original monochrome icon to use.
   * @param {Color} themeColor Color to use for the icon.
   * @returns New image data.
   */
  async monochromeFilter(icon: Icon, themeColor: Color): Promise<Icon> {
    const image = await Jimp.read(icon.data);
    image.color([
      // Set all pixels to black/0
      {apply: 'red', params: [-255]},
      {apply: 'green', params: [-255]},
      {apply: 'blue', params: [-255]},
      // Add to channels using theme color
      {apply: 'red', params: [themeColor.red()]},
      {apply: 'green', params: [themeColor.green()]},
      {apply: 'blue', params: [themeColor.blue()]},
    ]);
    return {url: icon.url, data: image};
  }

  /**
   * Fetches an Icon.
   *
   * @param {string} iconUrl the URL to fetch the icon from.
   * @returns an Object containing the original URL and the icon image data.
   */
  async fetchIcon(iconUrl: string): Promise<Icon> {
    const response = await fetch(iconUrl);
    if (response.status !== 200) {
      throw new Error(
          `Failed to download icon ${iconUrl}. Responded with status ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (!contentType?.startsWith('image/')) {
      throw new Error(`Received icon "${iconUrl}" with invalid Content-Type.` +
          ` Responded with Content-Type "${contentType}"`);
    }

    if (contentType.startsWith('image/svg')) {
      throw new Error('Sorry, SVGs aren\'t supported yet.');
    }

    const body = await response.buffer();
    return {
      url: iconUrl,
      data: await Jimp.read(body),
    };
  }
}
