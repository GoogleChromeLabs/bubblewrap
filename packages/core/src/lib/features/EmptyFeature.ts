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

export class EmptyFeature implements Feature {
  name: string;
  buildGradle: {
    repositories: string[];
    dependencies: string[];
  } = {
    repositories: new Array<string>(),
    dependencies: new Array<string>(),
  };

  androidManifest: {
    permissions: string[];
    components: string[];
  } = {
    permissions: new Array<string>(),
    components: new Array<string>(),
  };

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

  delegationService: {
    imports: string[];
    classConstructor?: string;
  } = {
    imports: new Array<string>(),
  };

  constructor(name: string) {
    this.name = name;
  }
}
