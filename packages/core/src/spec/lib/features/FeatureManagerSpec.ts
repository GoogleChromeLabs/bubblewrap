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
import {FirstRunFlagConfig, FirstRunFlagFeature} from '../../../lib/features/FirstRunFlagFeature';
import {LocationDelegationFeature} from '../../../lib/features/LocationDelegationFeature';
import {PlayBillingFeature} from '../../../lib/features/PlayBillingFeature';
import {TwaManifest} from '../../../lib/TwaManifest';
import {Feature} from '../../../lib/features/Feature';

function expectFeatureToBeApplied(features: FeatureManager, feature: Feature): void {
  feature.androidManifest.components.forEach((component) => {
    expect(features.androidManifest.components).toContain(component);
  });

  feature.androidManifest.permissions.forEach((permission) => {
    expect(features.androidManifest.permissions).toContain(permission);
  });

  feature.applicationClass.imports.forEach((imp) => {
    expect(features.applicationClass.imports).toContain(imp);
  });

  feature.applicationClass.variables.forEach((variable) => {
    expect(features.applicationClass.variables).toContain(variable);
  });

  if (feature.applicationClass.onCreate) {
    expect(features.applicationClass.onCreate).toContain(feature.applicationClass.onCreate);
  }

  feature.buildGradle.dependencies.forEach((dependency) => {
    expect(features.buildGradle.dependencies).toContain(dependency);
  });

  feature.buildGradle.repositories.forEach((repository) => {
    expect(features.buildGradle.repositories).toContain(repository);
  });

  feature.launcherActivity.imports.forEach((imp) => {
    expect(features.launcherActivity.imports).toContain(imp);
  });

  if (feature.launcherActivity.launchUrl) {
    expect(features.launcherActivity.launchUrl).toContain(feature.launcherActivity.launchUrl);
  }
}

describe('FeatureManager', () => {
  describe('#constructor', () => {
    it('Creates from empty features', () => {
      const manifest = {
        features: {},
        fallbackType: 'customtabs',
      } as TwaManifest;
      const emptySet = new Set();
      const features = new FeatureManager(manifest);
      expect(features.androidManifest.components).toEqual([]);
      expect(features.androidManifest.permissions).toEqual(emptySet);
      expect(features.applicationClass.imports).toEqual(emptySet);
      expect(features.applicationClass.onCreate).toEqual([]);
      expect(features.applicationClass.variables).toEqual([]);
      expect(features.buildGradle.dependencies).toContain(
          'com.google.androidbrowserhelper:androidbrowserhelper:2.2.0');
      expect(features.buildGradle.repositories).toEqual(emptySet);
      expect(features.launcherActivity.imports).toEqual(emptySet);
      expect(features.launcherActivity.launchUrl).toEqual([]);
      expect(features.delegationService.onCreate).toEqual([]);
    });

    it('Creates from empty features with alpha features enabled', () => {
      const manifest = {
        features: {},
        fallbackType: 'customtabs',
        alphaDependencies: {enabled: true},
      } as TwaManifest;
      const features = new FeatureManager(manifest);
      expect(features.buildGradle.dependencies).toContain(
          'com.google.androidbrowserhelper:androidbrowserhelper:2.2.0');
    });

    it('Adds INTERNET permission when WebView fallback is enabled', () => {
      const manifest = {
        features: {},
        fallbackType: 'webview',
      } as TwaManifest;
      const features = new FeatureManager(manifest);
      expect(features.androidManifest.permissions).toContain('android.permission.INTERNET');
    });

    it('Features are applied to FeatureManager', () => {
      const appsFlyerConfig = {
        enabled: true,
        appsFlyerId: '12345',
      } as AppsFlyerConfig;

      const firstRunFlagConfig = {
        enabled: true,
        queryParameterName: 'query_parameter',
      } as FirstRunFlagConfig;

      const manifest = {
        features: {
          appsFlyer: appsFlyerConfig,
          firstRunFlag: firstRunFlagConfig,
        },
        fallbackType: 'customtabs',
      } as TwaManifest;

      const appsFlyerFeature = new AppsFlyerFeature(appsFlyerConfig);
      const firstRunFlagFeature = new FirstRunFlagFeature(firstRunFlagConfig);
      const features = new FeatureManager(manifest);

      expectFeatureToBeApplied(features, appsFlyerFeature);
      expectFeatureToBeApplied(features, firstRunFlagFeature);
    });


    it('Enables the LocationDelegation feature', () => {
      const manifest = {
        features: {
          locationDelegation: {
            enabled: true,
          },
        },
      } as TwaManifest;

      const locationDelegationFeature = new LocationDelegationFeature();
      const features = new FeatureManager(manifest);

      locationDelegationFeature.androidManifest.components.forEach((component) => {
        expect(features.androidManifest.components).toContain(component);
      });

      locationDelegationFeature.delegationService.imports.forEach((imp) => {
        expect(features.delegationService.imports).toContain(imp);
      });

      expect(features.delegationService.onCreate!)
          .toContain(locationDelegationFeature.delegationService.onCreate!);
    });

    it('Enables the Play Billing feature', () => {
      const manifest = {
        features: {
          playBilling: {
            enabled: true,
          },
        },
        alphaDependencies: {
          enabled: true,
        },
      } as TwaManifest;

      const playBillingFeature = new PlayBillingFeature();
      const features = new FeatureManager(manifest);

      playBillingFeature.androidManifest.components.forEach((component) => {
        expect(features.androidManifest.components).toContain(component);
      });

      playBillingFeature.delegationService.imports.forEach((imp) => {
        expect(features.delegationService.imports).toContain(imp);
      });

      expect(features.delegationService.onCreate!)
          .toContain(playBillingFeature.delegationService.onCreate!);
    });
  });
});
