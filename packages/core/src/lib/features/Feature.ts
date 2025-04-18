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

export class Metadata {
  constructor(public readonly name: string, public readonly value: string) {};
}

/**
 * Specifies a set of customizations to be applied when generating the Android project
 * in order to enable a feature.
 */
export interface Feature {
  /**
   * The feature name.
   */
  name: string;
  /**
   * Customizations to be applied to `app/build.grade`.
   */
  buildGradle: {
    /**
     * Repositories to be added the `repositories` section.
     */
    repositories: string[];
    /**
     * Dependencies to be added the `dependencies` section.
     * The format 'group:name:version' must be used.
     *    Example `androidx.appcompat:appcompat:1.2.0`.
     */
    dependencies: string[];
  };

  /**
   * Customizations to be applied to `app/src/main/AndroidManifest.xml`.
   */
  androidManifest: {
    /**
     * Name for permissions required for the app.
     *    Example: `android.permission.INTERNET`.
     */
    permissions: string[];
    /** Components to be added to the app, like activities, services, receivers, etc.
     *    Example:
     * ```xml
     * <receiver
     *     android:name="com.example.MyBroadcastReceiver"
     *     android:exported="true">
     *     <intent-filter>
     *         <action android:name="com.android.vending.INSTALL_REFERRER" />
     *     </intent-filter>
     *  </receiver>`
     * ```
     */
    components: string[];
    /**
     * Additional meta-data items to be added into the `application` tag.
     */
    applicationMetadata: Metadata[];
    /**
     * Additional manifest entries to be added into the `activity` tag of LauncherActivity.
     */
    launcherActivityEntries: string[];
  };
  /**
   * Customizations to be added to `app/src/main/java/<app-package>/Application.java`.
   */
  applicationClass: {
    /**
     * Imports to be added. Only the class name must be added. Example:
     * `android.net.Uri`
     */
    imports: string[];
    /**
     * Variables to be added to the class. The full declaration is required. Example:
     * `private static final String MY_API_ID = "12345";`
     */
    variables: string[];
    /**
     * Code segment to be added to the `onCreate()` callback for the Application. The code is
     * added *after* calling `super.onCreate();`.
     */
    onCreate?: string;
  };
  /**
   * Customizations to be added to `app/src/main/java/<app-package>/LauncherActivity.java`.
   */
  launcherActivity: {
    /**
     * Imports to be added. Only the class name must be added. Example:
     * `android.net.Uri`
     */
    imports: string[];
    /**
     * Variables to be added to the class. The full declaration is required. Example:
     * `private static final String MY_API_ID = "12345";`
     */
    variables: string[];
    /**
     * Methods to be added to the class. The full declaration is required. Example:
     * ```
     * private void myMethod() {
     *   ... // Method implementation.
     * }
     * ```
     */
    methods: string[];
    /**
     * Code segment to be added to the `getLaunchingUrl()`. The code is added *after* calling
     * `super.getLaunchingUrl();` and can modify the Uri returned by that. The code will be called
     * by each plugin, and the Uri should be extended by calling `Uri.buildUpon`.
     * Example:
     * ```
     * uri = uri
     *     .buildUpon()
     *     .appendQueryParameter("my_extra_parameter", "value")
     *     .build();
     * ```
     */
    launchUrl?: string;
  };
  /**
   * Customizations to be added to `app/src/main/java/<app-package>/DelegationService.java`.
   */
  delegationService: {
    /**
     * Imports to be added. Only the class name must be added. Example:
     * `android.net.Uri`
     */
    imports: string[];
    /**
     * Code segment to be added to onCreate. The code will be called by each plugin.
     * by each plugin.
     */
    onCreate?: string;
  };
}
