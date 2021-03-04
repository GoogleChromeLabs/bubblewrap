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

import {Fingerprint} from '@bubblewrap/core';
import {cyan, green, underline, bold, italic, red, yellow} from 'colors';

type Messages = {
  errorAssetLinksGeneration: string;
  errorCouldNotfindTwaManifest: (file: string) => string;
  errorDirectoryDoesNotExist: (directory: string) => string;
  errorFailedToRunQualityCriteria: string;
  errorMaxLength: (maxLength: number, actualLength: number) => string;
  errorMinLength: (minLength: number, actualLength: number) => string;
  errorMissingManifestParameter: string;
  errorMissingArgument: (expected: number, received: number) => string;
  errorRequireHttps: string;
  errorInvalidUrl: (url: string) => string;
  errorInvalidColor: (color: string) => string;
  errorInvalidDisplayMode: (displayMode: string) => string;
  errorInvalidOrientation: (orientation: string) => string;
  errorInvalidInteger: (integer: string) => string;
  errorInvalidSha256Fingerprint: (fingerprint: string) => string;
  errorUrlMustBeImage: (mimeType: string) => string;
  errorUrlMustNotBeSvg: string;
  errorSdkTerms: string;
  messageInitializingWebManifest: (manifestUrl: string) => string;
  messageAddedFingerprint: (fingerpring: Fingerprint) => string;
  messageAndroidAppDetails: string;
  messageAndroidAppDetailsDesc: string;
  messageApkSuccess: (filename: string) => string;
  messageAppBundleSuccess: (filename: string) => string;
  messageBuildingApp: string;
  messageDigitalAssetLinksSuccess: (filename: string) => string;
  messageEnterPasswords: (keypath: string, keyalias: string) => string;
  messageGeneratedAssetLinksFile: (outputfile: string) => string;
  messageGeneratedNewVersion: (appVersionName: string, appVersionCode: number) => string;
  messageGeneratingAndroidProject: string;
  messageInstallingBuildTools: string;
  messageLauncherIconAndSplash: string;
  messageLauncherIconAndSplashDesc: string;
  messageLoadingTwaManifestFrom: (path: string) => string;
  messageOptionFeatures: string;
  messageOptionalFeaturesDesc: string;
  messageProjectGeneratedSuccess: string;
  messageRemovedFingerprint: (fingerpring: Fingerprint) => string;
  messageSavingTwaManifestTo: (path: string) => string;
  messageSha256FingerprintNotFound: string;
  messageSigningKeyCreation: string;
  messageSigningKeyInformation: string;
  messageSigningKeyInformationDesc: string;
  messageSigningKeyNotFound: (path: string) => string;
  messageUsingPasswordsFromEnv: string;
  messageWebAppDetails: string;
  messageWebAppDetailsDesc: string;
  messageDownloadJdk: string;
  messageDownloadSdk: string;
  messageDownloadJdkSrc: string;
  messageDecompressJdkSrc: string;
  messageDownloadJdkBin: string;
  messageDecompressJdkBin: string;
  messageDownloadAndroidSdk: string;
  messageDecompressAndroidSdk: string;
  promptCreateDirectory: (directory: string) => string;
  promptInstallJdk: string;
  promptJdkPath: string;
  promptInstallSdk: string;
  promptSdkTerms: string;
  promptSdkPath: string;
  promptHostMessage: string;
  promptName: string;
  promptLauncherName: string;
  promptDisplayMode: string;
  promptOrientation: string;
  promptThemeColor: string;
  promptBackgroundColor: string;
  promptStartUrl: string;
  promptIconUrl: string;
  promptMaskableIconUrl: string;
  promptMonochromeIconUrl: string;
  promptShortcuts: string;
  promptPlayBilling: string;
  promptPackageId: string;
  promptKeyPath: string;
  promptKeyAlias: string;
  promptCreateKey: string;
  promptKeyFullName: string;
  promptKeyOrganizationalUnit: string;
  promptKeyOrganization: string;
  promptKeyCountry: string;
  promptKeystorePassword: string;
  promptKeyPassword: string;
  promptNewAppVersionName: string;
  promptVersionCode: string;
  warnPwaFailedQuality: string;
  updateConfigUsage: string;
  jdkPathIsNotCorrect: string;
  jdkIsNotSupported: string;
  androidSdkPathIsNotCorrect: string;
  bothPathsAreValid: string;
}

export const enUS: Messages = {
  errorAssetLinksGeneration: 'Error generating "assetlinks.json"',
  errorCouldNotfindTwaManifest: (file: string): string => {
    return `Could not load a manifest from: ${cyan(file)}.`;
  },
  errorDirectoryDoesNotExist: (directory: string): string => {
    return `Cannot write to directory: ${directory}.`;
  },
  errorFailedToRunQualityCriteria:
      yellow('\nFailed to run the PWA Quality Criteria checks. Skipping.'),
  errorMaxLength: (maxLength, actualLength): string => {
    return `Maximum length is ${maxLength} but input is ${actualLength}.`;
  },
  errorMinLength: (minLength, actualLength): string => {
    return `Minimum length is ${minLength} but input is ${actualLength}.`;
  },
  errorMissingArgument: (expected: number, received: number): string => {
    return `Expected ${cyan(expected.toString())} arguments \
but received ${cyan(received.toString())}. Run ${cyan('bubblewrap help')} for usage.`;
  },
  errorMissingManifestParameter: `Missing required parameter ${cyan('--manifest')}`,
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
  errorInvalidOrientation: (orientation: string): string => {
    return `Invalid orientation: ${orientation}`;
  },
  errorInvalidInteger: (integer: string): string => {
    return `Invalid integer provided: ${integer}`;
  },
  errorInvalidSha256Fingerprint: (fingerprint: string): string => {
    return `Invalid SHA-256 fingerprint ${red(fingerprint)}.`;
  },
  errorUrlMustBeImage: (mimeType: string): string => {
    return `URL must resolve to an image/* mime-type, but resolved to ${mimeType}.`;
  },
  errorUrlMustNotBeSvg: 'SVG images are not supported yet.',
  errorSdkTerms: 'Downloading Android SDK failed because Terms and Conditions was not signed.',
  messageAddedFingerprint: (fingerprint: Fingerprint): string => {
    return `Added fingerprint with value ${fingerprint.value}.`;
  },
  messageAndroidAppDetails: underline(`\nAndroid app details ${green('(2/5)')}`),
  messageAndroidAppDetailsDesc: `
Please, enter details regarding how the Android app will look when installed
into a device:

\t- ${bold('Application name:')} the name used in most places,
\t  including the App information screen and on the Play Store.

\t- ${bold('Short name:')} an alternate name for the app, limited to
\t  12 characters, used on a device launch screen.

\t- ${bold('Application ID:')} also known as ${italic('Package Name')}, this is
\t  the unique identifier for the application on an Android device or
\t  the Play Store. The name must contain at least two segments,
\t  separated by dots, each segment must start with a letter and all
\t  characters must be alphanumeric or an underscore (_).

\t- ${bold('Display mode:')} how the app will be displayed on the
\t  device screen when started. The default mode, used by most apps,
\t  is ${cyan('standalone')}. ${cyan('fullscreen')} causes the device status bar and
\t  navigation bars to be removed and is suitable for games or media
\t  players. For more information on the status bars and navigation
\t  bar on Android, go to:
\t   - ${cyan('https://material.io/design/platform-guidance/android-bars.html')}.

\t- ${bold('Status bar color:')} sets the status bar color used when the
\t  application is in foreground. Example: ${cyan('#7CC0FF')}\n`,
  messageApkSuccess: (filename: string): string => {
    return `\t- Generated Android APK at ${cyan(filename)}`;
  },
  messageAppBundleSuccess: (filename: string): string => {
    return `\t- Generated Android App Bundle at ${cyan(filename)}`;
  },
  messageBuildingApp: '\nBuilding the Android App...',
  messageDigitalAssetLinksSuccess: (filename: string): string => {
    return `\t- Generated Digital Asset Links file at ${cyan(filename)}
\nRead more about setting up Digital Asset Links at:
\t` + cyan('https://developers.google.com/web/android/trusted-web-activity/quick-start#creating' +
    '-your-asset-link-file');
  },
  messageEnterPasswords: (keypath: string, keyalias: string): string => {
    return `Please, enter passwords for the keystore ${cyan(keypath)} and alias \
${cyan(keyalias)}.\n`;
  },
  messageGeneratedAssetLinksFile: (outputfile: string): string => {
    return `\nGenerated Digital Asset Links file at ${cyan(outputfile)}.`;
  },
  messageGeneratedNewVersion: (appVersionName: string, appVersionCode: number): string => {
    return `Generated new version with versionName: ${appVersionName} and ` +
        `versionCode: ${appVersionCode}`;
  },
  messageGeneratingAndroidProject: 'Generating Android Project.',
  messageInstallingBuildTools: 'Installing Android Build Tools. Please, read and accept the ' +
      'license agreement.',
  messageLauncherIconAndSplash: underline(`\nLauncher icons and splash screen ${green('(3/5)')}`),
  messageLauncherIconAndSplashDesc: `
The Android app requires an image for the launcher icon. It also displays a
splash screen while the web content is loading, to avoid displaying a flash of
a blank white page to users. 

\t- ${bold('Splash screen color:')} sets the background colour used for the
\t  splash screen. Example: ${cyan('#7CC0FF')}

\t- ${bold('Icon URL:')} URL to an image that is at least 512x512px. Used to
\t  generate the launcher icon for the application and the image for
\t  the splash screen.

\t- ${bold('Maskable Icon URL (Optional):')} URL to an image that is at least
\t  512x512px to be used when generating maskable icons. Maskable
\t  icons should look good when their edges are removed by an icon
\t  mask. They will be used to display adaptive launcher icons on the
\t  Android home screen.\n`,
  messageInitializingWebManifest: (manifestUrl: string): string => {
    return `Initializing application from Web Manifest:\n\t-  ${cyan(manifestUrl)}`;
  },
  messageLoadingTwaManifestFrom: (path: string): string => {
    return `Loading TWA Manifest from: ${cyan(path)}`;
  },
  messageOptionFeatures: underline(`\nOptional Features ${green('(4/5)')}`),
  messageOptionalFeaturesDesc: `
\t- ${bold('Include app shortcuts:')} This question is only prompted if a
\t  'shortcuts' section is available on the input Web Manifest. When
\t  answered “yes”, Bubblewrap uses the information to generate
\t  shortcuts on the Android app. Read more about app shortcuts at
\t  ${cyan('https://web.dev/app-shortcuts/')}.

\t- ${bold('Monochrome icon URL:')} URL to an image that is at least 48x48px to
\t  be used when generating monochrome icons. Monochrome icons should
\t  look good when displayed with a single color, the PWA's
\t  ${italic('theme_color')}. They will be used for notification icons.\n`,
  messageProjectGeneratedSuccess: '\nProject generated successfully. Build it by running ' +
      cyan('bubblewrap build'),
  messageRemovedFingerprint: (fingerprint: Fingerprint): string => {
    return `Removed fingerprint with value ${fingerprint.value}.`;
  },
  messageSavingTwaManifestTo: (path: string): string => {
    return `Saving TWA Manifest to: ${cyan(path)}`;
  },
  messageSha256FingerprintNotFound: 'Could not find SHA256 fingerprint. Skipping generating ' +
      '"assetlinks.json"',
  messageSigningKeyCreation: underline('\nSigning key creation'),
  messageSigningKeyInformation: underline(`\nSigning key information ${green('(5/5)')}`),
  messageSigningKeyInformationDesc: `
Please, enter information about the key store containing the keys that will be used
to sign the application. If a key store does not exist on the provided path,
Bubblewrap will prompt for the creation of a new keystore.

\t- ${bold('Key store location:')} The location of the key store in the file
\t  system.

\t- ${bold('Key name:')} The alias used on the key.

Read more about Android signing keys at:
\t ${cyan('https://developer.android.com/studio/publish/app-signing')}\n`,
  messageSigningKeyNotFound: (path: string): string => {
    return `\nAn existing key store could not be found at "${path}".\n`;
  },
  messageUsingPasswordsFromEnv: 'Using passwords set in the BUBBLEWRAP_KEYSTORE_PASSWORD and ' +
      'BUBBLEWRAP_KEY_PASSWORD environmental variables.',
  messageWebAppDetails: underline(`\nWeb app details ${green('(1/5)')}`),
  messageWebAppDetailsDesc: `
The application generated by Bubblewrap will open a Progressive Web App when
started from the Android launcher. Please enter the following details about
the PWA:
  
\t- ${bold('Domain:')} the domain / origin where the PWA is hosted. 
\t  Example: ${cyan('example.com')}

\t- ${bold('URL path:')} an URL path relative to the root of the origin,
\t  opened when the application is started from the home screen.
\t  Examples:

\t\t- To open ${italic('https://example.com/')}: ${cyan('/')}
\t\t- To open ${italic('https://example.com/path-to-pwa/')}: ${cyan('/path-to-pwa/')}\n`,
  messageDownloadJdk: 'Downloading JDK 8 to ',
  messageDownloadSdk: 'Downloading Android SDK to ',
  messageDownloadJdkSrc: 'Downloading the JDK 8 Sources...',
  messageDecompressJdkSrc: 'Decompressing the JDK 8 Sources...',
  messageDownloadJdkBin: 'Downloading the JDK 8 Binaries...',
  messageDecompressJdkBin: 'Decompressing the JDK 8 Binaries...',
  messageDownloadAndroidSdk: 'Downloading the Android SDK...',
  messageDecompressAndroidSdk: 'Decompressing the Android SDK...',
  promptCreateDirectory: (directory: string): string => {
    return `Directory ${cyan(directory)} does not exist. Do you want to create it now?`;
  },
  promptInstallJdk: `Do you want Bubblewrap to install JDK?
  (Enter "No" to use your JDK installation)`,
  promptJdkPath: 'Path to your existing JDK:',
  promptInstallSdk: `Do you want Bubblewrap to install Android SDK?
  (Enter "No" to use your installation)`,
  promptSdkTerms: `Do you agree to the Android SDK terms and conditions at ${underline('https://developer.android.com/studio/terms.html')}?`,
  promptSdkPath: 'Path to your existing Android SDK:',
  promptHostMessage: 'Domain:',
  promptName: 'Application name:',
  promptLauncherName: 'Short name:',
  promptDisplayMode: 'Display mode:',
  promptOrientation: 'Orientation:',
  promptThemeColor: 'Status bar color:',
  promptBackgroundColor: 'Splash screen color:',
  promptStartUrl: 'URL path:',
  promptIconUrl: 'Icon URL:',
  promptMaskableIconUrl: 'Maskable icon URL:',
  promptMonochromeIconUrl: 'Monochrome icon URL:',
  promptShortcuts: 'Include app shortcuts?',
  promptPlayBilling: 'Include support for Play Billing (this relies on alpha dependencies)?',
  promptPackageId: 'Application ID:',
  promptKeyPath: 'Key store location:',
  promptKeyAlias: 'Key name:',
  promptCreateKey: 'Do you want to create one now?',
  promptKeyFullName: 'First and Last names (eg: John Doe):',
  promptKeyOrganizationalUnit: 'Organizational Unit (eg: Engineering Dept):',
  promptKeyOrganization: 'Organization (eg: Company Name):',
  promptKeyCountry: 'Country (2 letter code):',
  promptKeystorePassword: 'Password for the Key Store:',
  promptKeyPassword: 'Password for the Key:',
  promptNewAppVersionName: 'versionName for the new App version:',
  promptVersionCode: 'Starting version code for the new app version:',
  warnPwaFailedQuality: red('PWA Quality Criteria check failed.'),
  updateConfigUsage: 'Usage: [--jdkPath <path-to-jdk>] [--androidSdkPath <path-to-android-sdk>]' +
      '(You can insert one or both of them)',
  jdkPathIsNotCorrect: 'The jdkPath isn\'t correct, please run the following command to update ' +
      'it:\nbubblewrap updateConfig --jdkPath <path-to-jdk>, such that the folder of the path' +
      'contains the file "release". Then run bubblewrap doctor again.',
  jdkIsNotSupported: 'Unsupported jdk version. Please download "OpenJDK 8(LTS)" at the link ' +
      'below:\nhttps://adoptopenjdk.net/releases.html?variant=openjdk8&jvmVariant=hotspot.',
  androidSdkPathIsNotCorrect: 'The androidSdkPath isn\'t correct, please run the following ' +
      'command to update it:\nbubblewrap updateConfig --androidSdkPath <path-to-sdk>, such that ' +
      'the folder of the path contains the folder "build". Then run bubblewrap doctor again.',
  bothPathsAreValid: 'Your jdkpath and androidSdkPath are valid.',
};
