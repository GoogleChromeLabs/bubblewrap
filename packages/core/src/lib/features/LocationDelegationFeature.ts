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

export type LocationDelegationConfig = {
}

export class LocationDelegationFeature implements EmptyFeature {
  applicationClass: {
    imports: string[];
    variables: string[];
    onCreate?: string;
    } = {
      imports: new Array<string>(),
      variables: new Array<string>(),
    };

  launcherActivity: {
    imports: string[];
    variables: string[];
    methods: string[];
    launchUrl?: string;
    } = {
      imports: new Array<string>(),
      variables: new Array<string>(),
      methods: new Array<string>(),
    };

  name = 'locationDelegation';
  buildGradle = {
    repositories: [],
    dependencies: ['com.google.androidbrowserhelper:locationdelegation:1.0.0'],
  };
  androidManifest = {
    permissions: [],
    components: [
      `<activity android:name=
         "com.google.androidbrowserhelper.locationdelegation.PermissionRequestActivity"/>`,
    ],
  };
  delegationService = {
    imports: [
      'com.google.androidbrowserhelper.locationdelegation.LocationDelegationExtraCommandHandler',
    ],
    constructor:
      'registerExtraCommandHandler(new LocationDelegationExtraCommandHandler());',
  };
}
