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

import {Feature} from './Feature';

export interface FirstRunFlagConfig {
  queryParameterName: string;
}

export class FirstRunFlagFeature implements Feature {
  name = 'firstRunFlag';
  buildGradle = {
    repositories: [],
    dependencies: [],
  };

  androidManifest = {
    permissions: [],
    components: [],
  };

  applicationClass = {
    imports: [],
    variables: [],
  };

  launcherActivity = {
    imports: [
      'android.content.SharedPreferences',
      'android.os.StrictMode',
    ],
    variables: [
      'private static final String KEY_FIRST_OPEN = "bubblewrap.first_open";',
    ],
    methods: [
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
      }`,
    ],
    launchUrl: `
    uri = uri
      .buildUpon()
      .appendQueryParameter(PARAM_FIRST_OPEN, String.valueOf(checkAndMarkFirstOpen()))
      .build();`,
  };

  constructor(config: FirstRunFlagConfig) {
    this.launcherActivity.variables.push(
        `private static final String PARAM_FIRST_OPEN = "${config.queryParameterName}";`);
  }
}
