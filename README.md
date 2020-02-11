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
![Node CI Status](https://github.com/GoogleChromeLabs/llama-pack/workflows/Node%20CI/badge.svg)

Llama Pack is a set of tools and libraries designed to help developers to create, build and update
projects for Android Applications that launch Progressive Web App (PWA) using
[Trusted Web Activity (TWA)](https://developers.google.com/web/updates/2019/02/using-twa).

**Important:** llama-pack is still under active development. The tool hasn't been tested on a wide
range of Web APKs, and bootstraping a new project may fail in those cases. Please, file issues,
feature requests, and contribute with pull requests, if possible.

## Requirements
- [Node.js](https://nodejs.org/en/) 10.0 or above

## llama-pack Components

- **[llama-pack-core](./packages/core):** a javascript library that for generating, building and
updating TWA projects.
- **[llama-pack-cli](./packages/cli):** a command-line version for llama-pack.

## Contributing

See [CONTRIBUTING](./CONTRIBUTING.md) for more.

## License

See [LICENSE](./LICENSE) for more.

## Disclaimer

This is not a Google product.
