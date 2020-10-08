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

import {AbstractFeature} from './AbstractFeature';

export interface FirstRunFlagConfig {
  queryParameterName: string;
}

export class FirstRunFlagFeature extends AbstractFeature {
  constructor(config: FirstRunFlagConfig) {
    super('firstRunFlag');
    this.launcherActivity.imports.push(
        'android.content.SharedPreferences',
        'android.os.StrictMode');
    this.launcherActivity.methods.push(
        `private boolean checkAndMarkFirstOpen() {
           StrictMode.ThreadPolicy originalPolicy = StrictMode.allowThreadDiskReads();
           try {
               SharedPreferences preferences = getPreferences(MODE_PRIVATE);
               boolean isFirstRun = preferences.getBoolean(KEY_FIRST_OPEN, true);
               preferences.edit().putBoolean(KEY_FIRST_OPEN, false).apply();
               return isFirstRun;
           } finally {
               StrictMode.setThreadPolicy(originalPolicy);
           }
        }`);
    this.launcherActivity.variables.push(
        'private static final String KEY_FIRST_OPEN = "bubblewrap.first_open";',
        `private static final String PARAM_FIRST_OPEN = "${config.queryParameterName}";`);
    this.launcherActivity.launchUrl =
     `uri = uri
      .buildUpon()
      .appendQueryParameter(PARAM_FIRST_OPEN, String.valueOf(checkAndMarkFirstOpen()))
      .build();`;
  }
}
