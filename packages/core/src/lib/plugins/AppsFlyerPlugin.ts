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

import {Plugin} from './Plugin';

export const appsFlyerPlugin: Plugin = {
  name: 'appsFlyer',
  build: {
    repositories: ['mavenCentral()'],
    dependencies: ['com.appsflyer:af-android-sdk:5.4.0'],
  },
  launcherActivity: {
    imports: ['com.appsflyer.AppsFlyerLib'],
    launchUrl: `
    String appsFlyerId = AppsFlyerLib.getInstance().getAppsFlyerUID(this);
    uri = uri
          .buildUpon()
          .appendQueryParameter("appsflyer_id", appsFlyerId)
          .build();`,
  },
};
