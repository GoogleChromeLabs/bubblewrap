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
import {FileHandler} from '../types/FileHandler';

const activityAliasTemplate = (handler: FileHandler, index: number): string => `
    <activity-alias
        android:name="FileHandlingActivity${index}"
        android:targetActivity="LauncherActivity"
        android:exported="true">
        <meta-data android:name="android.support.customtabs.trusted.FILE_HANDLING_ACTION_URL"
            android:value="@string/fileHandlingActionUrl${index}" /> 
        <intent-filter>
            <action android:name="android.intent.action.VIEW"/>
            <category android:name="android.intent.category.DEFAULT" />
            <category android:name="android.intent.category.BROWSABLE"/>
            <data android:scheme="content" />
${ handler.mimeTypes.map((mimeType: string) => `
            <data android:mimeType="${mimeType}" />`,
  ).join('') }
        </intent-filter>
    </activity-alias>
`;

export class FileHandlingFeature extends EmptyFeature {
  constructor(fileHandlers: FileHandler[]) {
    super('fileHandling');
    if (fileHandlers.length === 0) return;
    for (let i = 0; i < fileHandlers.length; i++) {
      this.androidManifest.components.push(activityAliasTemplate(fileHandlers[i], i));
      this.buildGradle.configs.push(
          `resValue "string", "fileHandlingActionUrl${i}", "${fileHandlers[i].actionUrl}"`);
    }
  }
}
