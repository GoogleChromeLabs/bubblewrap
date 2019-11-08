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
# 🦙Llama Pack

Llama Pack is a Command Line Interface (CLI) that helps developers to create
a Project for an Android application that launches an existing Progressive Web App (PWA) using a
[Trusted Web Activity (TWA)](https://developers.google.com/web/updates/2019/02/using-twa).

**Important:** llama-pack is still under active development. The tool works on MacOS and Linux,
but hasn't yet been tested on Linux. It also hasn't been tested on a wide range of Web APKs,
and bootstraping a new project may fail in those cases. Please, file issues, feature requests,
and contribute with pull requests, if possible.

## Requirements
- [Node.js](https://nodejs.org/en/) 10.0 or above

## Setting up the Environment
### Get llama-pack
Clone the Llama Pack repository:

```shell
git clone https://github.com/GoogleChromeLabs/llama-pack.git
```

### Get the Java Development Kit (JDK) 8.
The Android Command line tools requires the correct version of the JDK to run. To prevent version
conflicts with a JDK version that is already installed, llama-pack uses a JDK that can unzipped in
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

### Tell llama-pack where the JDK and Android command line tools are
Edit `llama-pack-config.js`, which can be found inside the cloned repository. 
   - Change `jdkHome` to the directory the JDK has been extracted,
   - and `androidToolsHome` to the path where the Android command line tools has been
    extracted.

## Using llama-pack
### Initializing an Android Project
Generate an Android project from an existing Web Manifest:

```shell
<path-to-llama-pack>/bin/llama-pack init --manifest https://my-twa.com/manifest.json
```

When initalizing a project, llama-pack will download the Wer Manifest and ask you to confirm
the values that should be used when building the Android project.

It will also ask you for the details needed to generate a signing key, used to sign the
app before uploading to the Play Store.

### Building the Android Project
```shell
<path-to-llama-pack>/bin/llama-pack build
```

When building the project for the first time, the Android Build Tools will need to be installed.
The tool will inkove the installation process for the build tools. Make sure to read and accept
the license agreement before proceeding.

As a result of the build step, the tool will generate a signed APK (`app-release-signed.apk`)
that can be uploaded to the Play Store. You will also need to deploy a Digital Asset Links file to
validate your domain. The
[TWA Quick Start Guide](https://developers.google.com/web/updates/2019/08/twas-quickstart#creating-your-asset-link-file)
explains how to extract the information needed to generate it.

## Contributing

See [CONTRIBUTING](./CONTRIBUTING.md) for more.

## License

See [LICENSE](./LICENSE) for more.

## Disclaimer

This is not a Google product.
