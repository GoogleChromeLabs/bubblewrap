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
import {ParsedArgs} from 'minimist';
import {util, TwaManifest} from '@bubblewrap/core';
import {update} from './update';

/**
 * Updates an existing TWA Project using the `twa-manifest.json`.
 * @param {string} [args.fieldsToIgnore] the fields that shouldn't be updated.
 */
export async function merge(args: ParsedArgs): Promise<boolean> {
  // If there is nothing to ignore, continue with an empty list.
  let fieldsToIgnore = [];
  if (args.ignore) {
    fieldsToIgnore = args.ignore;
  }
  const manifestFile = path.join(process.cwd(), 'twa-manifest.json');
  const twaManifest = await TwaManifest.fromFile(manifestFile);
  const webManifestUrl: URL = twaManifest.webManifestUrl!;
  const webManifest = await util.getWebManifest(webManifestUrl);
  const newTwaManifest = 
      await TwaManifest.merge(fieldsToIgnore, webManifestUrl, webManifest, twaManifest);
  // Update the app (args are not relevant in this case, bucause update's default values
  // are valid for it. We just send something as an input). 
  await update(args);
  return true;
}
