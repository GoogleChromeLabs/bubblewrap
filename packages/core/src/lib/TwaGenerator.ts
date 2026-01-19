/*
 * Copyright 2019 Google Inc. All Rights Reserved.
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

import * as path from 'path';
import * as fs from 'fs';
import * as Color from 'color';
import {template} from 'lodash';
import {promisify} from 'util';
import {TwaManifest} from './TwaManifest';
import {ShortcutInfo} from './ShortcutInfo';
import {Log} from './Log';
import {ImageHelper, IconDefinition} from './ImageHelper';
import {FeatureManager} from './features/FeatureManager';
import {rmdir, escapeGradleString, escapeJsonString, toAndroidScreenOrientation} from './util';
import {fetchUtils} from './FetchUtils';

const COPY_FILE_LIST = [
  'settings.gradle',
  'gradle.properties',
  'build.gradle',
  'gradlew',
  'gradlew.bat',
  'gradle/wrapper/gradle-wrapper.jar',
  'gradle/wrapper/gradle-wrapper.properties',
  'app/src/main/res/values/colors.xml',
  'app/src/main/res/xml/filepaths.xml',
  'app/src/main/res/xml/shortcuts.xml',
  'app/src/main/res/drawable-anydpi/shortcut_legacy_background.xml',
];

const TEMPLATE_FILE_LIST = [
  'app/build.gradle',
  'app/src/main/AndroidManifest.xml',
  'app/src/main/res/values/strings.xml',
  'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
];

const JAVA_DIR = 'app/src/main/java/';

const JAVA_FILE_LIST = [
  'LauncherActivity.java',
  'Application.java',
  'DelegationService.java',
];

const DELETE_PROJECT_FILE_LIST = [
  'settings.gradle',
  'gradle.properties',
  'build.gradle',
  'gradlew',
  'gradlew.bat',
  'store_icon.png',
  'gradle/',
  'app/',
];

const DELETE_FILE_LIST = [
  'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
];

function scaledIconDefinitions(
    folder: string,
    filename: string,
    mdpiSize: number,
): IconDefinition[] {
  return [
    {dest: `app/src/main/res/${folder}-mdpi/${filename}`, size: mdpiSize},
    {dest: `app/src/main/res/${folder}-hdpi/${filename}`, size: mdpiSize * 1.5},
    {dest: `app/src/main/res/${folder}-xhdpi/${filename}`, size: mdpiSize * 2},
    {dest: `app/src/main/res/${folder}-xxhdpi/${filename}`, size: mdpiSize * 3},
    {dest: `app/src/main/res/${folder}-xxxhdpi/${filename}`, size: mdpiSize * 4},
  ];
}

const SPLASH_IMAGES: IconDefinition[] = scaledIconDefinitions('drawable', 'splash.png', 300);

const IMAGES: IconDefinition[] = [
  ...scaledIconDefinitions('mipmap', 'ic_launcher.png', 48),
  {dest: 'store_icon.png', size: 512},
];

const ADAPTIVE_IMAGES: IconDefinition[] = scaledIconDefinitions('mipmap', 'ic_maskable.png', 82);

const THEMED_IMAGES: IconDefinition[] = scaledIconDefinitions('mipmap', 'ic_monochrome.png', 82);

const NOTIFICATION_IMAGES: IconDefinition[] =
    scaledIconDefinitions('drawable', 'ic_notification_icon.png', 24);

const WEB_MANIFEST_LOCATION = '/app/src/main/res/raw/';
const WEB_MANIFEST_FILE_NAME = 'web_app_manifest.json';

type ShareTargetIntentFilter = {
  actions: string[];
  mimeTypes: string[];
};

function shortcutMaskableTemplateFileMap(assetName: string): Record<string, string> {
  return {
    'app/src/main/res/drawable-anydpi-v26/shortcut_maskable.xml':
      `app/src/main/res/drawable-anydpi-v26/${assetName}.xml`,
  };
}

function shortcutMonochromeTemplateFileMap(assetName: string): Record<string, string> {
  return {
    'app/src/main/res/drawable-anydpi/shortcut_monochrome.xml':
      `app/src/main/res/drawable-anydpi/${assetName}.xml`,
    'app/src/main/res/drawable-anydpi-v26/shortcut_monochrome.xml':
      `app/src/main/res/drawable-anydpi-v26/${assetName}.xml`,
  };
}

function shortcutImages(assetName: string): IconDefinition[] {
  return scaledIconDefinitions('drawable', `${assetName}.png`, 48);
}

// fs.promises is marked as experimental. This should be replaced when stable.
const fsMkDir = promisify(fs.mkdir);
const fsCopyFile = promisify(fs.copyFile);
const fsWriteFile = promisify(fs.writeFile);
const fsReadFile = promisify(fs.readFile);

export type twaGeneratorProgress = (progress: number, total: number) => void;
// eslint-disable-next-line @typescript-eslint/no-empty-function
const noOpProgress: twaGeneratorProgress = () => {};

/**
 * An utility class to help ensure progress tracking is consistent.
 */
class Progress {
  private current = 0;
  constructor(private total: number, private progress: twaGeneratorProgress) {
    this.progress(this.current, this.total);
  }

  /**
   * Updates the progress. Increments current by 1.
   */
  update(): void {
    if (this.current === this.total) {
      throw new Error('Progress already reached total.' +
        ` current: ${this.current}, total: ${this.total}`);
    }
    this.current++;
    this.progress(this.current, this.total);
  }

  /**
   * Should be called for the last update. Throws an error if total !== current after incrementing
   * current.
   */
  done(): void {
    this.update();
    if (this.current !== this.total) {
      throw new Error('Invoked done before current equals total.' +
        ` current: ${this.current}, total: ${this.total}`);
    }
  }
}

/**
 * Generates TWA Projects from a TWA Manifest
 */
export class TwaGenerator {
  private imageHelper = new ImageHelper();

  // Ensures targetDir exists and copies a file from sourceDir to target dir.
  private async copyStaticFile(
      sourceDir: string, targetDir: string, filename: string): Promise<void> {
    const sourceFile = path.join(sourceDir, filename);
    const destFile = path.join(targetDir, filename);
    await fsMkDir(path.dirname(destFile), {recursive: true});
    await fsCopyFile(sourceFile, destFile);
  }

  // Copies a list of file from sourceDir to targetDir.
  private copyStaticFiles(
      sourceDir: string, targetDir: string, fileList: string[]): Promise<void[]> {
    return Promise.all(fileList.map((file) => {
      return this.copyStaticFile(sourceDir, targetDir, file);
    }));
  }

  private async applyTemplate(
      sourceFile: string, destFile: string, args: object): Promise<void> {
    await fsMkDir(path.dirname(destFile), {recursive: true});
    const templateFile = await fsReadFile(sourceFile, 'utf-8');
    const output = template(templateFile)(args);
    await fsWriteFile(destFile, output);
  }

  private async applyTemplateList(
      sourceDir: string, targetDir: string,
      fileList: string[], args: object): Promise<void> {
    await Promise.all(fileList.map((filename) => {
      const sourceFile = path.join(sourceDir, filename);
      const destFile = path.join(targetDir, filename);
      this.applyTemplate(sourceFile, destFile, args);
    }));
  }

  private async applyJavaTemplate(
      sourceDir: string, targetDir: string, packageName: string, filename: string, args: object):
      Promise<void> {
    const sourceFile = path.join(sourceDir, JAVA_DIR, filename);
    const destFile = path.join(targetDir, JAVA_DIR, packageName.split('.').join('/'), filename);
    await fsMkDir(path.dirname(destFile), {recursive: true});
    const templateFile = await fsReadFile(sourceFile, 'utf-8');
    const output = template(templateFile)(args);
    await fsWriteFile(destFile, output);
  }

  private applyJavaTemplates(
      sourceDir: string, targetDir: string, packageName: string, fileList: string[], args: object):
      Promise<void[]> {
    return Promise.all(fileList.map((file) => {
      this.applyJavaTemplate(sourceDir, targetDir, packageName, file, args);
    }));
  }

  private async applyTemplateMap(
      sourceDir: string, targetDir: string,
      fileMap: Record<string, string>, args: object): Promise<void> {
    await Promise.all(Object.keys(fileMap).map((filename) => {
      const sourceFile = path.join(sourceDir, filename);
      const destFile = path.join(targetDir, fileMap[filename]);
      this.applyTemplate(sourceFile, destFile, args);
    }));
  }

  private async generateIcons(iconUrl: string, targetDir: string, iconList: IconDefinition[],
      backgroundColor?: Color): Promise<void> {
    const icon = await this.imageHelper.fetchIcon(iconUrl);
    await Promise.all(iconList.map((iconDef) => {
      return this.imageHelper.generateIcon(icon, targetDir, iconDef, backgroundColor);
    }));
  }

  private async writeWebManifest(twaManifest: TwaManifest, targetDirectory: string): Promise<void> {
    if (!twaManifest.webManifestUrl) {
      throw new Error(
          'Unable to write the Web Manifest. The TWA Manifest does not have a webManifestUrl');
    }

    const response = await fetchUtils.fetch(twaManifest.webManifestUrl.toString());
    if (response.status !== 200) {
      throw new Error(`Failed to download Web Manifest ${twaManifest.webManifestUrl}.` +
          `Responded with status ${response.status}`);
    }

    // We're writing as a string, but attempt to convert to check if it's a well-formed JSON.
    const webManifestJson = JSON.parse((await response.text()).trim());

    // We want to ensure that "start_url" is the same used to launch the Trusted Web Activity.
    webManifestJson['start_url'] = twaManifest.startUrl;

    const webManifestLocation = path.join(targetDirectory, WEB_MANIFEST_LOCATION);

    // Ensures the target directory exists.
    await fs.promises.mkdir(webManifestLocation, {recursive: true});

    const webManifestFileName = path.join(webManifestLocation, WEB_MANIFEST_FILE_NAME);
    await fs.promises.writeFile(webManifestFileName, JSON.stringify(webManifestJson));
  }

  /**
   * Generates shortcut data for a new TWA Project.
   *
   * @param {String} targetDirectory the directory where the project will be created
   * @param {String} templateDirectory the directory where templates are located.
   * @param {Object} twaManifest configurations values for the project.
   */
  private async generateShortcuts(
      targetDirectory: string, templateDirectory: string, twaManifest: TwaManifest): Promise<void> {
    await Promise.all(twaManifest.shortcuts.map(async (shortcut: ShortcutInfo, i: number) => {
      const assetName = shortcut.assetName(i);
      const monochromeAssetName = `${assetName}_monochrome`;
      const maskableAssetName = `${assetName}_maskable`;
      const templateArgs = {assetName, monochromeAssetName, maskableAssetName};

      if (shortcut.chosenMonochromeIconUrl) {
        await this.applyTemplateMap(
            templateDirectory, targetDirectory,
            shortcutMonochromeTemplateFileMap(assetName), templateArgs);

        const monochromeImages = shortcutImages(monochromeAssetName);

        const baseMonochromeIcon =
          await this.imageHelper.fetchIcon(shortcut.chosenMonochromeIconUrl);
        const monochromeIcon =
          await this.imageHelper.monochromeFilter(baseMonochromeIcon, twaManifest.themeColor);

        return await Promise.all(monochromeImages.map((iconDef) => {
          return this.imageHelper.generateIcon(monochromeIcon, targetDirectory, iconDef);
        }));
      }

      if (!shortcut.chosenIconUrl) {
        throw new Error(
            `ShortcutInfo ${shortcut.name} is missing chosenIconUrl and chosenMonochromeIconUrl`);
      }

      if (shortcut.chosenMaskableIconUrl) {
        await this.applyTemplateMap(
            templateDirectory, targetDirectory,
            shortcutMaskableTemplateFileMap(assetName), templateArgs);

        const maskableImages = shortcutImages(maskableAssetName);
        await this.generateIcons(shortcut.chosenMaskableIconUrl, targetDirectory, maskableImages);
      }

      const images = shortcutImages(assetName);
      return this.generateIcons(shortcut.chosenIconUrl, targetDirectory, images);
    }));
  }

  private static generateShareTargetIntentFilter(
      twaManifest: TwaManifest): ShareTargetIntentFilter | undefined {
    if (!twaManifest.shareTarget) {
      return undefined;
    }

    const shareTargetIntentFilter: ShareTargetIntentFilter = {
      actions: ['android.intent.action.SEND'],
      mimeTypes: [],
    };

    if (twaManifest.shareTarget?.params?.url ||
        twaManifest.shareTarget?.params?.title ||
        twaManifest.shareTarget?.params?.text) {
      shareTargetIntentFilter.mimeTypes.push('text/plain');
    }

    if (twaManifest.shareTarget?.params?.files) {
      shareTargetIntentFilter.actions.push('android.intent.action.SEND_MULTIPLE');
      for (const file of twaManifest.shareTarget.params.files) {
        file.accept.forEach((accept) => shareTargetIntentFilter.mimeTypes.push(accept));
      }
    }
    return shareTargetIntentFilter;
  }
  /**
   * Creates a new TWA Project.
   *
   * @param {String} targetDirectory the directory where the project will be created
   * @param {Object} twaManifest configurations values for the project.
   */
  async createTwaProject(targetDirectory: string, twaManifest: TwaManifest, log: Log,
      reportProgress: twaGeneratorProgress = noOpProgress): Promise<void> {
    const features = new FeatureManager(twaManifest, log);
    const progress = new Progress(10, reportProgress);
    const error = twaManifest.validate();
    if (error !== null) {
      throw new Error(`Invalid TWA Manifest: ${error}`);
    }

    const templateDirectory = path.join(__dirname, '../../template_project');

    const copyFileList = new Set(COPY_FILE_LIST);
    const templateFileList = new Set(TEMPLATE_FILE_LIST);
    if (!twaManifest.maskableIconUrl) {
      DELETE_FILE_LIST.forEach((file) => {
        copyFileList.delete(file);
        templateFileList.delete(file);
      });
    }
    progress.update();

    // Copy Project Files
    await this.copyStaticFiles(templateDirectory, targetDirectory, Array.from(copyFileList));

    // Apply proper permissions to gradlew. See https://nodejs.org/api/fs.html#fs_file_modes
    await fs.promises.chmod(path.join(targetDirectory, 'gradlew'), '755');
    progress.update();

    // Those are the arguments passed when applying templates. Functions are not automatically
    // copied from objects, so we explicitly copy generateShortcuts.
    const args = {
      ...twaManifest,
      ...features,
      shareTargetIntentFilter: TwaGenerator.generateShareTargetIntentFilter(twaManifest),
      generateShortcuts: twaManifest.generateShortcuts,
      escapeJsonString: escapeJsonString,
      escapeGradleString: escapeGradleString,
      toAndroidScreenOrientation: toAndroidScreenOrientation,
    };

    // Generate templated files
    await this.applyTemplateList(
        templateDirectory, targetDirectory, Array.from(templateFileList), args);
    progress.update();

    // Generate java files
    await this.applyJavaTemplates(
        templateDirectory, targetDirectory, twaManifest.packageId, JAVA_FILE_LIST, args);
    progress.update();

    // Generate images
    if (twaManifest.iconUrl) {
      await this.generateIcons(twaManifest.iconUrl, targetDirectory, IMAGES);
      await this.generateIcons(
          twaManifest.iconUrl, targetDirectory, SPLASH_IMAGES, twaManifest.backgroundColor);
    }
    progress.update();

    await this.generateShortcuts(targetDirectory, templateDirectory, twaManifest);
    progress.update();

    // Generate adaptive images
    if (twaManifest.maskableIconUrl) {
      await this.generateIcons(twaManifest.maskableIconUrl, targetDirectory, ADAPTIVE_IMAGES);
    }
    progress.update();

    // Generate themed images
    if (twaManifest.monochromeIconUrl) {
      await this.generateIcons(twaManifest.monochromeIconUrl, targetDirectory, THEMED_IMAGES);
    }
    progress.update();

    // Generate notification images
    const iconOrMonochromeIconUrl = twaManifest.monochromeIconUrl || twaManifest.iconUrl;
    if (twaManifest.enableNotifications && iconOrMonochromeIconUrl) {
      await this.generateIcons(iconOrMonochromeIconUrl, targetDirectory, NOTIFICATION_IMAGES);
    }
    progress.update();

    if (twaManifest.webManifestUrl) {
      // Save the Web Manifest into the project
      await this.writeWebManifest(twaManifest, targetDirectory);
    }
    progress.done();
  }

  /**
   * Removes all files generated by crateTwaProject.
   * @param targetDirectory the directory where the project was created.
   */
  async removeTwaProject(targetDirectory: string): Promise<void> {
    await Promise.all(
        DELETE_PROJECT_FILE_LIST.map((entry) => rmdir(path.join(targetDirectory, entry))));
  }
}
