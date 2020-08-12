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
import {appsFlyerPlugin} from './AppsFlyerPlugin';
import {TwaManifest} from '../TwaManifest';

export class PluginManager {
  build = {
    repositories: new Set<string>(),
    dependencies: new Set<string>(),
  };
  launcherActivity = {
    imports: new Set<string>(),
    launchUrl: new Array<string>(),
  };

  constructor(twaManifest: TwaManifest) {
    if (twaManifest.appsFlyer) {
      this.addPlugin(appsFlyerPlugin);
    }
  }

  addPlugin(plugin: Plugin): void {
    if (plugin.build?.repositories) {
      plugin.build.repositories.forEach((repo) => {
        this.build.repositories.add(repo);
      });
    }

    if (plugin.build?.dependencies) {
      plugin.build.dependencies.forEach((dep) => {
        this.build.dependencies.add(dep);
      });
    }

    if (plugin.launcherActivity?.imports) {
      plugin.launcherActivity.imports.forEach((imp) => {
        this.launcherActivity.imports.add(imp);
      });
    }

    if (plugin.launcherActivity?.launchUrl) {
      this.launcherActivity.launchUrl.push(plugin.launcherActivity.launchUrl);
    }
  }
}
