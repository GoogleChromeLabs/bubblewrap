<!---

  Copyright 2019 Google Inc. All Rights Reserved.
 
   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at
 
       http://www.apache.org/licenses/LICENSE-2.0
 
   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
-->
# Bubblewrap CLI
![Node CI Status](https://github.com/GoogleChromeLabs/bubblewrap/workflows/Node%20CI/badge.svg)

Bubblewrap is a Command Line Interface (CLI) that helps developers to create
a Project for an Android application that launches an existing Progressive Web App (PWA) using a
[Trusted Web Activity (TWA)](https://developers.google.com/web/android/trusted-web-activity/).

## Requirements
- [Node.js](https://nodejs.org/en/) 10.0 or above

## Setting up the Environment

### Get the Java Development Kit (JDK) 8.
The Android Command line tools requires the correct version of the JDK to run. To prevent version
conflicts with a JDK version that is already installed, Bubblewrap uses a JDK that can unzipped in
a separate folder.

Download a version of JDK 8 that is compatible with your OS from
[AdoptOpenJDK](https://adoptopenjdk.net/releases.html?variant=openjdk8&jvmVariant=hotspot)
and extract it in its own folder.

**Warning:** Using a version lower than 8 will make it impossible to compile the project and higher
versions are incompatible with the Android command line tools.

### Get the Android command line tools
Download a version of Android command line tools that is compatible with your OS from
[https://developer.android.com/studio#command-tools](https://developer.android.com/studio#command-tools).
Create a folder and extract the downloaded file into it. This will further install the androidSdk and android SDK manager without needing to install the whole Android IDE.

### Tell Bubblewrap where the JDK and Android command line tools are
When running `bubblewrap` for the first time, it will ask where it can find the JDK and Android command
line tools. So, take note of the location where both were decompressed.

To ensure if you are taking note of the correct location, check if each directory contains the following files:
- On **Windows** and **Linux**, the correct **OpenJDK** path should contain `bin`, `include` ,`lib`, etc. On **MacOS**,
the directory should contain the `Contents` subdirectory.
- The **AndroidSDK** path should contain `tools` which should have `bin`, `cli`

### Updating the location of the JDK and / or the Android command line tools.
If the location for the JDK or the Android command line tools have been setup with the wrong path or
if their location has changed after the initial configuration, the location for either of those can
be changed by editing the configuration file at `${USER_HOME}/.bubblewrap/config.json`.

#### Sample config.json
```
{ 
  "jdkPath":"\\user\\home\\bubblewrap-user\\open-jdk",
  "androidSdkPath":"\\user\\home\\bubblewrap-user\\android-cli"
 }

```
*(Note : Make sure you don't have `spaces` in the androidSdkPath. Check [this link](https://stackoverflow.com/questions/37052934/android-sdk-location-should-not-contain-whitespace-as-this-cause-problems-with) for more details.)*
## Quickstart Guide

### Installing Bubblewrap

```shell
npm i -g @bubblewrap/cli
```

### Initializing an Android Project
Generate an Android project from an existing Web Manifest:

```shell
bubblewrap init --manifest https://my-twa.com/manifest.json
```

When initalizing a project, Bubblewrap will download the Web Manifest and ask you to confirm
the values that should be used when building the Android project.

It will also ask you for the details needed to generate a signing key, used to sign the
app before uploading to the Play Store.

> :grey_exclamation: Even though we recommend Bubblewrap for building and generating a signed
APK, the output from the `init` command is a regular Android project that can be opened
and built using [Android Studio](https://developer.android.com/studio/). Please, refer to the
[documentation]( https://developer.android.com/studio/publish/app-signing#sign-apk) to build and sign
applications using Android Studio.

### Building the Android Project
```shell
bubblewrap build
```

When building the project for the first time, the Android Build Tools will need to be installed.
The tool will inkove the installation process for the build tools. Make sure to read and accept
the license agreement before proceeding. This process will install the other required files inside the `directory/decompressed` root directory of the android CLI package.

As a result of the build step, the tool will generate a signed APK (`app-release-signed.apk`)
that can be used for testing the app and a signed AppBundle (`./app-release-bundle.aab`) that can be [uploaded to the Play Store](https://android-developers.googleblog.com/2020/08/recent-android-app-bundle-improvements.html). You will also need to deploy a Digital Asset Links file to
validate your domain. The
[TWA Quick Start Guide](https://developers.google.com/web/updates/2019/08/twas-quickstart#creating-your-asset-link-file)
explains how to extract the information needed to generate it.

## Commands

![Overview of bubblewrap commands](command_flow.svg)

The diagram above shows which commands (in the black boxes) take as input or produce as output various files (in white ovals).
An arrow leading to a file means "creates or modifies" and an arrow leading to a command means "is used as input".

## `init`

Usage:

Initializes an Android project for Trusted Web Activity from a Web Manifest. The init script will
parse the Web manifest and generate default values for the Android project, where possible. It
will prompt the user to confirm or input values where one could not be generated.

```
bubblewrap init --manifest="<web-manifest-url>" [--directory="<path-to-output-location>"] [--chromeosonly]
```

Options:
  - `--directory`: path where to generate the project. Defaults to the current directory.
  - `--chromeosonly`: this flag specifies that the build will be used for Chrome OS only and prevents non-Chrome OS devices from installing the app.

## `build`

Builds the project into a final APK that can be uploaded to the Play Store.

The command will ask the user for they key store passwords. Alternatively, users can set the
passwords as enviromental variables, which allows running `build` as part of a continuous integration.
Set `BUBBLEWRAP_KEYSTORE_PASSWORD` for the key store password and `BUBBLEWRAP_KEY_PASSWORD` as the key password.

Usage:

```
bubblewrap build [--skipPwaValidation]
```

Options: 
  - `--skipPwaValidation`: skips validating the wrapped PWA against the Quality Criteria.


## `update`

Regenerates the Android project files from a `twa-manifest.json` file.

Usage:

```
bubblewrap update [--appVersionName="<version-string>"] [--skipVersionUpgrade] [--manifest="<path-twa-manifest>"]
```

Options:
 - `--appVersionName`: version name to be used on on the upgrade. Ignored if `--skipVersionUpgrade` is used.
 - `--skipVersionUpgrade`: skips upgrading `appVersion` and `appVersionCode`.
 - `--manifest`: directory where the client should look for `twa-manifest.json`.

## `validate`

Validates a PWA agains the Quality Criteria for being using in a Trusted Web Activity.

Usage:

```
bubblewrap validate --url=[pwa-url]
```

## `install`

Install the application generated in the output command to a device connected for debugging.

Usage:

```
bubblewrap install [--apkFile="/path-to-apk/apkfile.apk"]
```

Options:
  - `--apkFile`: path to the APK file to be installed. Defaults to `./app-release-signed.apk`.
  - `--verbose`: prints the adb command being executed.

## `help`

Displays a list of commands and options.

Usage:

```
bubblewrap help
```

## `doctor`

Validates that the jdk and the androidSdk are located at the path specified in your config
and that they are at the correct version.

Usage:

```
bubblewrap doctor
```

## `updateConfig`

Sets the paths of the jdk or the androidSdk to the given paths.

Usage:

```
bubblewrap updateConfig  --jdkPath="/path-to-jdk" --androidSdkPath="/path-to-androidSdk"
```

Options:
  - `--jdkPath`: sets the jdk's path to the path given.
  - `--androidSdkPath`: sets the androidSdk's path to the path given.

## `merge`

Merges the user's web manifest into their twaManifest.json.

Usage:

```
bubblewrap merge --ignore [fields-list]
```

Options:
  - `--ignore`: Ignores all of the fields on the list. Accepts all of the possible fields
  in the Web Manifest.


## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more.

## License

See [LICENSE](../../LICENSE) for more.

## Disclaimer

This is not a Google product.
