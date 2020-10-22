
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

export interface WebManifestIcon {
  src: string;
  sizes?: string;
  purpose?: string;
  mimeType?: string;
  size?: number;
}

export interface WebManifestShortcutJson {
  name?: string;
  short_name?: string;
  url?: string;
  icons?: Array<WebManifestIcon>;
}

type WebManifestDisplayMode = 'browser' | 'minimal-ui' | 'standalone' | 'fullscreen';

export interface ShareTargetParams {
  title?: string;
  text?: string;
  url?: string;
}

export interface ShareTarget {
  action?: string;
  method?: string;
  enctype?: string;
  params?: ShareTargetParams;
}

export interface WebManifestJson {
  name?: string;
  short_name?: string;
  start_url?: string;
  display?: WebManifestDisplayMode;
  theme_color?: string;
  background_color?: string;
  icons?: Array<WebManifestIcon>;
  shortcuts?: Array<WebManifestShortcutJson>;
  share_target?: ShareTarget;
}
