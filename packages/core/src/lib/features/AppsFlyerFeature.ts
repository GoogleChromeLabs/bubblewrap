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

import {EmptyFeature} from './EmptyFeature';

export type AppsFlyerConfig = {
  appsFlyerId: string;
}

export class AppsFlyerFeature extends EmptyFeature {
  constructor(config: AppsFlyerConfig) {
    super('appsFlyer');
    // Setup build.gradle.
    this.buildGradle.repositories.push('mavenCentral()');
    this.buildGradle.dependencies.push('com.appsflyer:af-android-sdk:5.4.0');

    // Setup the Android Manifest.
    this.androidManifest.permissions.push(
        'android.permission.INTERNET',
        'android.permission.ACCESS_NETWORK_STATE',
        'android.permission.ACCESS_WIFI_STATE',
        // TODO(andreban): this may be optional. Check and remove if that's confirmed.
        'android.permission.READ_PHONE_STATE');
    this.androidManifest.components.push(
        `<receiver
          android:name="com.appsflyer.SingleInstallBroadcastReceiver"
          android:exported="true">
          <intent-filter>
            <action android:name="com.android.vending.INSTALL_REFERRER" />
          </intent-filter>
        </receiver>`);

    // Setup the Application class.
    this.applicationClass.imports.push(
        'java.util.Map',
        'com.appsflyer.AppsFlyerLib',
        'com.appsflyer.AppsFlyerConversionListener');
    this.applicationClass.variables.push(
        `private static final String AF_DEV_KEY = "${config.appsFlyerId}";`);
    this.applicationClass.onCreate =
        `AppsFlyerConversionListener conversionListener = new AppsFlyerConversionListener() {
            @Override
            public void onConversionDataSuccess(Map<String, Object> conversionData) {
            }

            @Override
            public void onConversionDataFail(String errorMessage) {
            }

            @Override
            public void onAppOpenAttribution(Map<String, String> attributionData) {
            }

            @Override
            public void onAttributionFailure(String errorMessage) {
            }
        };
        AppsFlyerLib.getInstance().init(AF_DEV_KEY, conversionListener, this);
        AppsFlyerLib.getInstance().startTracking(this);`;

    // Setup the LauncherActivity.
    this.launcherActivity.imports.push('com.appsflyer.AppsFlyerLib');
    this.launcherActivity.launchUrl =
        `String appsFlyerId = AppsFlyerLib.getInstance().getAppsFlyerUID(this);
         uri = uri
              .buildUpon()
              .appendQueryParameter("appsflyer_id", appsFlyerId)
              .build();`;
  }
}
