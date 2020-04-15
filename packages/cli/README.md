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
Create a folder and extract the downloaded file into it.

### Tell Bubblewrap where the JDK and Android command line tools are
When running `bubblewrap` for the first time, it will ask where it can find the JDK and Android command
line tools. So, take note of the location where both were decompressed.

### Updating the location of the JDK and / or the Android command line tools.
If the location for the JDK or the Android command line tools have been setup with the wrong path or
if their location has changed after the initial configuration, the location for either of those can
be changed by editing the configuration file at `${USER_HOME}/.llama-pack/llama-pack-config.json`.

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

### Building the Android Project
```shell
bubblewrap build
```

When building the project for the first time, the Android Build Tools will need to be installed.
The tool will inkove the installation process for the build tools. Make sure to read and accept
the license agreement before proceeding.

As a result of the build step, the tool will generate a signed APK (`app-release-signed.apk`)
that can be uploaded to the Play Store. You will also need to deploy a Digital Asset Links file to
validate your domain. The
[TWA Quick Start Guide](https://developers.google.com/web/updates/2019/08/twas-quickstart#creating-your-asset-link-file)
explains how to extract the information needed to generate it.

## Commands

## `init`

Usage:

Initializes an Android project for Trusted Web Activity from a Web Manifest. The init script will
parse the Web manifest and generate default valuers for the Android project, where possible. It
will prompt the user to confirm or input values where one could not be generated.

```
bubblewrap init --manifest="<web-manifest-url>" [--directory="<path-to-output-location>"]
```

Options:
  - `--directory`: path where to generate the project. Defaults to the current directory.

## `build`

Builds the project into a final APK that can be uploaded to the Play Store.

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

## `help`

Displays a list of commands and options.

Usage:

```
bubblewrap help
```

## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more.

## License

See [LICENSE](../../LICENSE) for more.

## Disclaimer

This is not a Google product.
