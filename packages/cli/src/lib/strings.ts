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

type Messages = {
  promptHostMessage: string;
  promptName: string;
  promptLauncherName: string;
  promptDisplayMode: string;
  promptThemeColor: string;
  promptBackgroundColor: string;
  promptStartUrl: string;
  promptIconUrl: string;
  promptMaskableIconUrl: string;
  promptMonochromeIconUrl: string;
  promptShortcuts: string;
  promptPackageId: string;
  promptKeyPath: string;
  promptKeyAlias: string;
  promptCreateKey: (keypath: string) => string;
  promptKeyFullName: string;
  promptKeyOrganizationalUnit: string;
  promptKeyOrganization: string;
  promptKeyCountry: string;
  promptKeystorePassword: string;
  promptKeyPassword: string;
  promptNewAppVersionName: string;
  errorMaxLength: (maxLength: number, actualLength: number) => string;
  errorMinLength: (minLength: number, actualLength: number) => string;
  errorRequireHttps: string;
  errorInvalidUrl: (url: string) => string;
  errorInvalidColor: (color: string) => string;
  errorInvalidDisplayMode: (displayMode: string) => string;
}

export const enUS: Messages = {
  promptHostMessage: 'Domain being opened in the TWA:',
  promptName: 'Name of the application:',
  promptLauncherName: 'Name to be shown on the Android Launcher:',
  promptDisplayMode: 'Display mode to be used:',
  promptThemeColor: 'Color to be used for the status bar:',
  promptBackgroundColor: 'Color to be used for the splash screen background:',
  promptStartUrl: 'Relative path to open the TWA:',
  promptIconUrl: 'URL to an image that is at least 512x512px:',
  promptMaskableIconUrl: 'URL to an image that is at least 512x512px to be used when generating ' +
  'maskable icons.\n\nMaskable icons should look good when their edges are removed by an icon ' +
  'mask. They will be used to display adaptive launcher icons on the Android home screen.',
  promptMonochromeIconUrl: 'URL to an image that is at least 48x48px to be used when generating ' +
  'monochrome icons.\n\nMonochrome icons should look good when displayed with a single color,' +
  'the PWA\' theme_color. They will be used for notification icons.',
  promptShortcuts: 'Include app shortcuts?',
  promptPackageId: 'Android Package Name (or Application ID):',
  promptKeyPath: 'Location of the Signing Key:',
  promptKeyAlias: 'Key name:',
  promptCreateKey: (keypath: string): string => {
    return `Signing Key could not be found at "${keypath}". Do you want to create one now?`;
  },
  promptKeyFullName: 'First and Last names (eg: John Doe):',
  promptKeyOrganizationalUnit: 'Organizational Unit (eg: Engineering Dept):',
  promptKeyOrganization: 'Organization (eg: Company Name):',
  promptKeyCountry: 'Country (2 letter code):',
  promptKeystorePassword: 'Password for the Key Store:',
  promptKeyPassword: 'Password for the Key:',
  promptNewAppVersionName: 'versionName for the new App version:',
  errorMaxLength: (maxLength, actualLength): string => {
    return `Maximum length is ${maxLength} but input is ${actualLength}.`;
  },
  errorMinLength: (minLength, actualLength): string => {
    return `Minimum length is ${minLength} but input is ${actualLength}.`;
  },
  errorRequireHttps: 'Url must be https.',
  errorInvalidUrl: (url: string): string => {
    return `Invalid URL: ${url}`;
  },
  errorInvalidColor: (color: string): string => {
    return `Invalid Color ${color}. Try using hexadecimal representation. eg: #FF3300`;
  },
  errorInvalidDisplayMode: (displayMode: string): string => {
    return `Invalid display mode: ${displayMode}`;
  },
};
