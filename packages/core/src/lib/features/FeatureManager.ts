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
import {AppsFlyerFeature} from './AppsFlyerFeature';
import {LocationDelegationFeature} from './LocationDelegationFeature';
import {TwaManifest} from '../TwaManifest';

/**
 * Analyzes a TwaManifest to collect enable features and aggregates all customizations that will
 * be applied when generating the Android project.
 */
export class FeatureManager {
  buildGradle = {
    repositories: new Set<string>(),
    dependencies: new Set<string>(),
  };
  androidManifest = {
    permissions: new Set<string>(),
    components: new Array<string>(),
  };
  applicationClass = {
    imports: new Set<string>(),
    variables: new Array<string>(),
    onCreate: new Array<string>(),
  };
  launcherActivity = {
    imports: new Set<string>(),
    launchUrl: new Array<string>(),
  };
  delegationService = {
    imports: new Set<string>(),
    constructor: new Array<string>(),
  };

  /**
   * Builds a new intance from a TwaManifest.
   */
  constructor(twaManifest: TwaManifest) {
    if (twaManifest.features.appsFlyer !== undefined) {
      this.addFeature(new AppsFlyerFeature(twaManifest.features.appsFlyer));
    }

    if (twaManifest.features.locationDelegation) {
      this.addFeature(new LocationDelegationFeature());
    }

    // The WebView fallback needs the INTERNET permission.
    if (twaManifest.fallbackType === 'webview') {
      this.androidManifest.permissions.add('android.permission.INTERNET');
    }
  }

  private addFeature(feature: Feature): void {
    // Adds properties to build
    feature.buildGradle.repositories.forEach((repo) => {
      this.buildGradle.repositories.add(repo);
    });

    feature.buildGradle.dependencies.forEach((dep) => {
      this.buildGradle.dependencies.add(dep);
    });

    // Adds properties to application
    if (feature.applicationClass !== undefined) {
      feature.applicationClass.imports.forEach((imp) => {
        this.applicationClass.imports.add(imp);
      });

      feature.applicationClass.variables.forEach((imp) => {
        this.applicationClass.variables.push(imp);
      });

      if (feature.applicationClass.onCreate) {
        this.applicationClass.onCreate.push(feature.applicationClass.onCreate);
      }
    }

    // Adds properties to AndroidManifest.xml
    feature.androidManifest.permissions.forEach((permission) => {
      this.androidManifest.permissions.add(permission);
    });

    feature.androidManifest.components.forEach((component) => {
      this.androidManifest.components.push(component);
    });

    // Adds properties to launcherActivity
    if (feature.launcherActivity !== undefined) {
      feature.launcherActivity.imports.forEach((imp) => {
        this.launcherActivity.imports.add(imp);
      });

      if (feature.launcherActivity?.launchUrl) {
        this.launcherActivity.launchUrl.push(feature.launcherActivity.launchUrl);
      }
    }

    // Adds properties to delegationService
    if (feature.delegationService !== undefined) {
      feature.delegationService.imports.forEach((imp) => {
        this.delegationService.imports.add(imp);
      });
      if (feature.delegationService?.constructor) {
        this.delegationService.constructor.push(feature.delegationService.constructor);
      }
    }
  }
}
