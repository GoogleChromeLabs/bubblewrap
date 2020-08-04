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
import * as Jimp from 'jimp';
import Color = require('color');
import {ImageHelper} from '../../lib/ImageHelper';

function samePixels(actual: Jimp, expected: Jimp): void {
  const w = expected.getWidth();
  const h = expected.getHeight();
  expect(actual.getWidth()).toBe(w);
  expect(actual.getWidth()).toBe(h);

  for (const {x, y} of expected.scanIterator(0, 0, w, h)) {
    const actualPixel = Jimp.intToRGBA(actual.getPixelColor(x, y));
    const expectedPixel = Jimp.intToRGBA(expected.getPixelColor(x, y));

    if (expectedPixel.a === 0) {
      // Don't care about color of transparent pixel
      expect(actualPixel.a).toBe(0, `Pixel at ${x}, ${y}`);
    } else {
      expect(actualPixel).toEqual(expectedPixel, `Pixel at ${x}, ${y}`);
    }
  }
}

describe('ImageHelper', () => {
  describe('#constructor', () => {
    it('Builds an instance of ImageHelper', () => {
      const imageHelper = new ImageHelper();
      expect(imageHelper).not.toBeNull();
    });
  });

  describe('#monochromeFilter', () => {
    it('Changes the color of a monochrome icon', async () => {
      const fixturesDirectory = path.join(__dirname, '../../../src/spec/fixtures');
      const data = await Jimp.read(path.join(fixturesDirectory, 'add_task.png'));
      const expected = await Jimp.read(path.join(fixturesDirectory, 'add_task_coloured.png'));

      const imageHelper = new ImageHelper();
      const red = new Color('#ff0000');
      const url = 'https://example.com/icon.png';
      const coloured = await imageHelper.monochromeFilter({url, data}, red);

      expect(coloured.url).toEqual(url);
      samePixels(coloured.data, expected);
    });
  });
});
