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

// This class is needed because svg2img's typescript type definitions didn't work.
// once it will, there is no need for this class.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _svg2img: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  _svg2img = require('svg2img');
} catch (e) {
  console.debug('Unable to load the "svg2img" library. SVGs are not supported');
}

export enum Format {
  jpeg = 'jpeg',
  jpg = 'jpg',
  png = 'png',
}

export interface Svg2imgOptions {
  width?: number;
  height?: number;
  preserveAspectRatio?: boolean | string;
  format?: Format;
  quality?: number;
}

export function isSvgSupported(): boolean {
  return _svg2img !== undefined;
}

export function svg2img(svg: string, options: Svg2imgOptions = {}): Promise<Buffer> {
  if (!_svg2img) {
    return Promise.reject(
        new Error('Failed to parse the SVG. The svg2img library is not installed'));
  }

  return new Promise((resolve, reject) => {
    _svg2img(svg, options, (error: string, buffer: Buffer) => {
      if (error) {
        return reject(error);
      }
      return resolve(buffer);
    });
  });
}
