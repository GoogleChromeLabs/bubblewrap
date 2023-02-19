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
# Bubblewrap Core
![Node CI Status](https://github.com/GoogleChromeLabs/bubblewrap/workflows/Node%20CI/badge.svg)

Bubblewrap Core is a NodeJS library that helps developers to create a Project for an Android
application that launches an existing Progressive Web App (PWA) using a
[Trusted Web Activity (TWA)](https://developer.chrome.com/docs/android/trusted-web-activity/).

## Requirements
- [Node.js](https://nodejs.org/en/) 14.15.0 or above

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

## Using @bubblewrap/core in a NodeJs project

```shell
npm i -g @bubblewrap/core
```

## Contributing

See [CONTRIBUTING](../../CONTRIBUTING.md) for more.

## License

See [LICENSE](../../LICENSE) for more.

## Disclaimer

This is not a Google product.

