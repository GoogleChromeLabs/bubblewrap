/*
 * Copyright 2025 Google Inc. All Rights Reserved.
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
import {ProtocolHandler} from '../types/ProtocolHandler';

export class ProtocolHandlersFeature extends EmptyFeature {
  constructor(protocolHandlers: ProtocolHandler[]) {
    super('protocolHandlers');
    if (protocolHandlers.length === 0) return;
    for (const handler of protocolHandlers) {
      this.androidManifest.launcherActivityEntries.push(
          `<intent-filter>
              <action android:name="android.intent.action.VIEW"/>
              <category android:name="android.intent.category.DEFAULT" />
              <category android:name="android.intent.category.BROWSABLE"/>
              <data android:scheme="${handler.protocol}" />
          </intent-filter>`,
      );
    }
    this.launcherActivity.imports.push(
        'java.util.HashMap',
        'java.util.Map',
    );
    const mapEntries = new Array<string>();
    for (const handler of protocolHandlers) {
      mapEntries.push(
          `registry.put("${handler.protocol}", Uri.parse("${handler.url}"));`,
      );
    }
    this.launcherActivity.methods.push(
        `@Override
        protected Map<String, Uri> getProtocolHandlers() {
            Map<String, Uri> registry = new HashMap<>();
            ${mapEntries.join('\n')}
            return registry;
        }`);
  }
}
