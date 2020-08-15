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

import {FeatureManager} from '../../../lib/features/FeatureManager';
import {AppsFlyerConfig, AppsFlyerFeature} from '../../../lib/features/AppsFlyerFeature';
import {TwaManifest} from '../../../lib/TwaManifest';

describe("FeatureManager", () => {
  describe("#constructor", () => {
    it ('Creates from empty features', () => {
      const manifest = {
        features: {},
        fallbackType: 'customtabs',
      } as TwaManifest;
      const features = new FeatureManager(manifest);
      expect(features.androidManifest.components.length).toBe(0);
      expect(features.androidManifest.permissions.size).toBe(0);
      expect(features.applicationClass.imports.size).toBe(0);
      expect(features.applicationClass.onCreate.length).toBe(0);
      expect(features.applicationClass.variables.length).toBe(0);
      expect(features.buildGradle.dependencies.size).toBe(0);
      expect(features.buildGradle.repositories.size).toBe(0);
      expect(features.launcherActivity.imports.size).toBe(0);
      expect(features.launcherActivity.launchUrl.length).toBe(0);
    });

    it ('Adds INTERNET permission when WebView fallback is enabled', () => {
      const manifest = {
        features: {},
        fallbackType: 'webview',
      } as TwaManifest;
      const features = new FeatureManager(manifest);
      expect(features.androidManifest.permissions).toContain('android.permission.INTERNET');
    });

    it ('Enables the AppsFlyer plugin', () => {
      const appsFlyerConfig = {
        appsFlyerId: '12345',
      } as AppsFlyerConfig;

      const manifest = {
        features: {
          appsFlyer: appsFlyerConfig,
        },
        fallbackType: 'customtabs',
      } as TwaManifest;

      const appsFlyerFeature = new AppsFlyerFeature(appsFlyerConfig);
      const features = new FeatureManager(manifest);
      
      appsFlyerFeature.androidManifest.components.forEach((component) => {
        expect(features.androidManifest.components).toContain(component);
      });

      appsFlyerFeature.androidManifest.permissions.forEach((permission) => {
        expect(features.androidManifest.permissions).toContain(permission);
      });

      appsFlyerFeature.applicationClass.imports.forEach((imp) => {
        expect(features.applicationClass.imports).toContain(imp);
      });

      appsFlyerFeature.applicationClass.variables.forEach((variable) => {
        expect(features.applicationClass.variables).toContain(variable);
      });

      expect(features.applicationClass.onCreate)
          .toContain(appsFlyerFeature.applicationClass.onCreate);

      appsFlyerFeature.buildGradle.dependencies.forEach((dependency) => {
        expect(features.buildGradle.dependencies).toContain(dependency);
      });

      appsFlyerFeature.buildGradle.repositories.forEach((repository) => {
        expect(features.buildGradle.repositories).toContain(repository);
      });

      appsFlyerFeature.launcherActivity.imports.forEach((imp) => {
        expect(features.launcherActivity.imports).toContain(imp);        
      });

      expect(features.launcherActivity.launchUrl)
          .toContain(appsFlyerFeature.launcherActivity.launchUrl);
    });
  });
});
