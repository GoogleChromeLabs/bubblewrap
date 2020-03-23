## v0.6.0 (2020-03-23)

#### :rocket: Enhancement
* `core`
  * [#126](https://github.com/GoogleChromeLabs/bubblewrap/pull/126) Updates android-browser-helper and enables WebView fallback on config ([@andreban](https://github.com/andreban))

#### :house: Internal
* `cli`, `core`
  * [#128](https://github.com/GoogleChromeLabs/bubblewrap/pull/128) Runs npm audit fix and npm update ([@andreban](https://github.com/andreban))

#### Committers: 1
- André Cipriani Bandarra ([@andreban](https://github.com/andreban))

## v0.5.2 (2020-03-11)

#### :rocket: Enhancement
* `core`
  * [#122](https://github.com/GoogleChromeLabs/bubblewrap/pull/122) Add console warnings if a shortcut has been skipped. ([@rayankans](https://github.com/rayankans))
  * [#120](https://github.com/GoogleChromeLabs/bubblewrap/pull/120) Increases minSdkVersion to 19 ([@andreban](https://github.com/andreban))

#### :memo: Documentation
* `cli`, `core`
  * [#121](https://github.com/GoogleChromeLabs/bubblewrap/pull/121) Renames llama-pack => BubbleWrap ([@andreban](https://github.com/andreban))

#### Committers: 2
- André Cipriani Bandarra ([@andreban](https://github.com/andreban))
- Rayan Kanso ([@rayankans](https://github.com/rayankans))


## v0.5.0 (2020-03-03)

#### :boom: Breaking Change
* `cli`, `core`
  * [#109](https://github.com/GoogleChromeLabs/bubblewrap/pull/109) Move Config read/write into cli ([@NotWoods](https://github.com/NotWoods))

#### :rocket: Enhancement
* `core`
  * [#117](https://github.com/GoogleChromeLabs/bubblewrap/pull/117) Adaptative Icons Improvements ([@andreban](https://github.com/andreban))
* `cli`, `core`
  * [#108](https://github.com/GoogleChromeLabs/bubblewrap/pull/108) Reduce package size by omitting tests & build tools ([@NotWoods](https://github.com/NotWoods))

#### :bug: Bug Fix
* `core`
  * [#114](https://github.com/GoogleChromeLabs/bubblewrap/pull/114) Fix packageName generation ([@andreban](https://github.com/andreban))

#### :house: Internal
* `cli`, `core`
  * [#109](https://github.com/GoogleChromeLabs/bubblewrap/pull/109) Move Config read/write into cli ([@NotWoods](https://github.com/NotWoods))

#### Committers: 2
- André Cipriani Bandarra ([@andreban](https://github.com/andreban))
- Tiger Oakes ([@NotWoods](https://github.com/NotWoods))


## 0.5.0 (2020-03-03)

#### :boom: Breaking Change
* `cli`, `core`
  * [#109](https://github.com/GoogleChromeLabs/bubblewrap/pull/109) Move Config read/write into cli ([@NotWoods](https://github.com/NotWoods))

#### :rocket: Enhancement
* `core`
  * [#117](https://github.com/GoogleChromeLabs/bubblewrap/pull/117) Adaptative Icons Improvements ([@andreban](https://github.com/andreban))
* `cli`, `core`
  * [#108](https://github.com/GoogleChromeLabs/bubblewrap/pull/108) Reduce package size by omitting tests & build tools ([@NotWoods](https://github.com/NotWoods))

#### :bug: Bug Fix
* `core`
  * [#114](https://github.com/GoogleChromeLabs/bubblewrap/pull/114) Fix packageName generation ([@andreban](https://github.com/andreban))

#### :house: Internal
* `cli`, `core`
  * [#109](https://github.com/GoogleChromeLabs/bubblewrap/pull/109) Move Config read/write into cli ([@NotWoods](https://github.com/NotWoods))

#### Committers: 2
- André Cipriani Bandarra ([@andreban](https://github.com/andreban))
- Tiger Oakes ([@NotWoods](https://github.com/NotWoods))


## v0.4.3 (2020-02-13)

#### :boom: Breaking Change
* `cli`, `core`
  * [#101](https://github.com/GoogleChromeLabs/bubblewrap/pull/101) Splits the project into `core` and `cli` modules ([@andreban](https://github.com/andreban))

#### :rocket: Enhancement
* `cli`, `core`
  * [#102](https://github.com/GoogleChromeLabs/bubblewrap/pull/102) Fixes handling of maskable images ([@andreban](https://github.com/andreban))
* Other
  * [#98](https://github.com/GoogleChromeLabs/bubblewrap/pull/98) Adds web-manifest-url meta-tag and web-app-manifest.json ([@andreban](https://github.com/andreban))
  * [#96](https://github.com/GoogleChromeLabs/bubblewrap/pull/96) `update` upgrades `versionCode` and `versionName` ([@andreban](https://github.com/andreban))
  * [#91](https://github.com/GoogleChromeLabs/bubblewrap/pull/91) Allows automated builds ([@andreban](https://github.com/andreban))
  * [#89](https://github.com/GoogleChromeLabs/bubblewrap/pull/89) Adds help messages to the help command ([@andreban](https://github.com/andreban))
  * [#90](https://github.com/GoogleChromeLabs/bubblewrap/pull/90) Adds a `generator_app` metatag to AndroidManifest.xml ([@andreban](https://github.com/andreban))
  * [#85](https://github.com/GoogleChromeLabs/bubblewrap/pull/85) Updates to use android-browser-helper 1.1.0 ([@andreban](https://github.com/andreban))
  * [#73](https://github.com/GoogleChromeLabs/bubblewrap/pull/73) Allows Customizing Project Location on Gradle Wrapper ([@andreban](https://github.com/andreban))
  * [#71](https://github.com/GoogleChromeLabs/bubblewrap/pull/71) Reset versionName ([@abdonrd](https://github.com/abdonrd))
  * [#69](https://github.com/GoogleChromeLabs/bubblewrap/pull/69) Update default navigationColor to black as PWAs ([@abdonrd](https://github.com/abdonrd))
  * [#67](https://github.com/GoogleChromeLabs/bubblewrap/pull/67) Add new launcherName field ([@abdonrd](https://github.com/abdonrd))
  * [#64](https://github.com/GoogleChromeLabs/bubblewrap/pull/64) Update com.android.tools.build:gradle version ([@abdonrd](https://github.com/abdonrd))
  * [#63](https://github.com/GoogleChromeLabs/bubblewrap/pull/63) Move distributionUrl to the bottom ([@abdonrd](https://github.com/abdonrd))

#### :bug: Bug Fix
* [#93](https://github.com/GoogleChromeLabs/bubblewrap/pull/93) Report an Error when `iconUrl` is not 200 ([@andreban](https://github.com/andreban))
* [#92](https://github.com/GoogleChromeLabs/bubblewrap/pull/92) Fixes using the wrong password when building the app ([@andreban](https://github.com/andreban))
* [#83](https://github.com/GoogleChromeLabs/bubblewrap/pull/83) Escaping user input to key tool ([@JudahGabriel](https://github.com/JudahGabriel))
* [#60](https://github.com/GoogleChromeLabs/bubblewrap/pull/60) Fixes `UnhandledPromiseRejection` errors ([@andreban](https://github.com/andreban))

#### :house: Internal
* [#99](https://github.com/GoogleChromeLabs/bubblewrap/pull/99) Refactors TwaManifest.shortcuts ([@andreban](https://github.com/andreban))
* [#94](https://github.com/GoogleChromeLabs/bubblewrap/pull/94) Runs audit-fix to upgrade packages with vulnerabilities ([@andreban](https://github.com/andreban))
* [#86](https://github.com/GoogleChromeLabs/bubblewrap/pull/86) Moves `cli` to TypeScript and uses Inquirer.js ([@andreban](https://github.com/andreban))
* [#84](https://github.com/GoogleChromeLabs/bubblewrap/pull/84) Adds missing private keywords ([@andreban](https://github.com/andreban))
* [#82](https://github.com/GoogleChromeLabs/bubblewrap/pull/82) Converts `KeyTool.js` to TypeScript ([@andreban](https://github.com/andreban))
* [#81](https://github.com/GoogleChromeLabs/bubblewrap/pull/81) Converts TwaGenerator.js and Log.js to TypeScript ([@andreban](https://github.com/andreban))
* [#78](https://github.com/GoogleChromeLabs/bubblewrap/pull/78) Converts util.js and utilSpec.js into TypesScript ([@andreban](https://github.com/andreban))
* [#75](https://github.com/GoogleChromeLabs/bubblewrap/pull/75) Converts more Classes into Typescript ([@andreban](https://github.com/andreban))

#### Committers: 3
- Abdón Rodríguez Davila ([@abdonrd](https://github.com/abdonrd))
- André Cipriani Bandarra ([@andreban](https://github.com/andreban))
- Judah Gabriel Himango ([@JudahGabriel](https://github.com/JudahGabriel))


## 0.3.0 (2020-01-08)

#### :rocket: Enhancement
* [#55](https://github.com/GoogleChromeLabs/bubblewrap/pull/55) Uses android-browser-helper ([@andreban](https://github.com/andreban))
* [#56](https://github.com/GoogleChromeLabs/bubblewrap/pull/56) Improve shortcut icon selection. ([@rayankans](https://github.com/rayankans))

#### :house: Internal
* [#54](https://github.com/GoogleChromeLabs/bubblewrap/pull/54) Typescript lint ([@andreban](https://github.com/andreban))

#### Committers: 2
- André Cipriani Bandarra ([@andreban](https://github.com/andreban))
- Rayan Kanso ([@rayankans](https://github.com/rayankans))


## 0.2.0 (2019-12-18)

#### :rocket: Enhancement
* [#53](https://github.com/GoogleChromeLabs/bubblewrap/pull/53) Updates to use useBrowserOnChromeOS ([@andreban](https://github.com/andreban))
* [#46](https://github.com/GoogleChromeLabs/bubblewrap/pull/46) Support WebManifest shortcuts when generating the TWA ([@rayankans](https://github.com/rayankans))

#### :bug: Bug Fix
* [#47](https://github.com/GoogleChromeLabs/bubblewrap/pull/47) Paths with space fix ([@andreban](https://github.com/andreban))
* [#43](https://github.com/GoogleChromeLabs/bubblewrap/pull/43) Fix import for jimp-resize ([@andreban](https://github.com/andreban))

#### :memo: Documentation
* [#39](https://github.com/GoogleChromeLabs/bubblewrap/pull/39) Update README.md ([@andreban](https://github.com/andreban))

#### :house: Internal
* [#42](https://github.com/GoogleChromeLabs/bubblewrap/pull/42) Configure eslint to lint ts files ([@NotWoods](https://github.com/NotWoods))
* [#41](https://github.com/GoogleChromeLabs/bubblewrap/pull/41) Use custom jimp build ([@NotWoods](https://github.com/NotWoods))
* [#40](https://github.com/GoogleChromeLabs/bubblewrap/pull/40) Transforms Config into TypeScript ([@andreban](https://github.com/andreban))

#### Committers: 3
- André Cipriani Bandarra ([@andreban](https://github.com/andreban))
- Rayan Kanso ([@rayankans](https://github.com/rayankans))
- Tiger Oakes ([@NotWoods](https://github.com/NotWoods))
