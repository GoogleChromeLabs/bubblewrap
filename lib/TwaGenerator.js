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

'use strict';

const path = require('path');
const fs = require('fs');
const template = require('lodash.template');
const Jimp = require('jimp');
const {promisify} = require('util');

const COPY_FILE_LIST = [
  'settings.gradle',
  'gradle.properties',
  'build.gradle',
  'gradlew',
  'gradlew.bat',
  'gradle/wrapper/gradle-wrapper.jar',
  'gradle/wrapper/gradle-wrapper.properties',
  'app/src/main/res/values/styles.xml',
  'app/src/main/res/xml/filepaths.xml',
  'app/src/main/res/xml/shortcuts.xml',
  'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
];

const TEMPLATE_FILE_LIST = [
  'app/build.gradle',
  'app/src/main/AndroidManifest.xml',
];

const DELETE_FILE_LIST = [
  'app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml',
];

const IMAGES = [
  {dest: 'app/src/main/res/mipmap-hdpi/ic_launcher.png', size: 72},
  {dest: 'app/src/main/res/mipmap-mdpi/ic_launcher.png', size: 48},
  {dest: 'app/src/main/res/mipmap-xhdpi/ic_launcher.png', size: 96},
  {dest: 'app/src/main/res/mipmap-xxhdpi/ic_launcher.png', size: 144},
  {dest: 'app/src/main/res/mipmap-xxxhdpi/ic_launcher.png', size: 192},
  {dest: 'app/src/main/res/drawable-hdpi/splash.png', size: 450},
  {dest: 'app/src/main/res/drawable-mdpi/splash.png', size: 300},
  {dest: 'app/src/main/res/drawable-xhdpi/splash.png', size: 600},
  {dest: 'app/src/main/res/drawable-xxhdpi/splash.png', size: 900},
  {dest: 'app/src/main/res/drawable-xxxhdpi/splash.png', size: 1200},
  {dest: 'store_icon.png', size: 512},
];

const ADAPTIVE_IMAGES = [
  {dest: 'app/src/main/res/mipmap-hdpi/ic_maskable.png', size: 123},
  {dest: 'app/src/main/res/mipmap-mdpi/ic_maskable.png', size: 82},
  {dest: 'app/src/main/res/mipmap-xhdpi/ic_maskable.png', size: 164},
  {dest: 'app/src/main/res/mipmap-xxhdpi/ic_maskable.png', size: 246},
  {dest: 'app/src/main/res/mipmap-xxxhdpi/ic_maskable.png', size: 328},
];

// fs.promises is marked as experimental. This should be replaced when stable.
const fsMkDir = promisify(fs.mkdir);
const fsCopyFile = promisify(fs.copyFile);
const fsWriteFile = promisify(fs.writeFile);
const fsReadFile = promisify(fs.readFile);

class TwaGenerator {
  _checkParameters(args) {
    if (!args.host) {
      return Promise.reject(new Error('Missing "host"'));
    }

    if (!args.name) {
      return Promise.reject(new Error('Missing "name"'));
    }

    if (!args.startUrl) {
      return Promise.reject(new Error('Missing "startUrl"'));
    }

    if (!args.icon) {
      return Promise.reject(new Error('Missing "icon"'));
    }

    return Promise.resolve();
  }

  // Ensures targetDir exists and copies a file from sourceDir to target dir.
  async _copyStaticFile(sourceDir, targetDir, filename) {
    const sourceFile = path.join(sourceDir, filename);
    const destFile = path.join(targetDir, filename);
    console.log('\t', destFile);
    await fsMkDir(path.dirname(destFile), {recursive: true});
    await fsCopyFile(sourceFile, destFile);
  }

  // Copies a list of file from sourceDir to targetDir.
  _copyStaticFiles(sourceDir, targetDir, fileList) {
    return Promise.all(fileList.map((file) => {
      this._copyStaticFile(sourceDir, targetDir, file);
    }));
  }

  async _applyTemplate(sourceDir, targetDir, filename, args) {
    const sourceFile = path.join(sourceDir, filename);
    const destFile = path.join(targetDir, filename);
    console.log('\t', destFile);
    await fsMkDir(path.dirname(destFile), {recursive: true});
    const templateFile = await fsReadFile(sourceFile, 'utf-8');
    const output = template(templateFile)(args);
    await fsWriteFile(destFile, output);
  }

  _applyTemplates(sourceDir, targetDir, fileList, args) {
    return Promise.all(fileList.map((file) => {
      this._applyTemplate(sourceDir, targetDir, file, args);
    }));
  }

  async _saveIcon(data, size, fileName) {
    const image = await Jimp.read(data);
    await image.resize(size, size);
    await image.writeAsync(fileName);
  }

  async _generateIcon(iconData, targetDir, iconDef) {
    const destFile = path.join(targetDir, iconDef.dest);
    console.log(`\t ${iconDef.size}x${iconDef.size} Icon: ${destFile}`);
    await fsMkDir(path.dirname(destFile), {recursive: true});
    return await this._saveIcon(iconData.data, iconDef.size, destFile);
  }

  async _generateIcons(icon, targetDir, iconList) {
    return Promise.all(iconList.map((iconDef) => {
      this._generateIcon(icon, targetDir, iconDef);
    }));
  }

  async createTwaProject(targetDirectory, args) {
    console.log('Generating Android Project files:');
    const templateDirectory = path.join(__dirname, '../template_project');
    await this._checkParameters(args);

    let copyFileList = new Set(COPY_FILE_LIST);
    if (!args.maskableIcon) {
      DELETE_FILE_LIST.forEach((file) => copyFileList.delete(file));
    }

    // Copy Project Files
    await this._copyStaticFiles(templateDirectory, targetDirectory, [...copyFileList]);

    // Generate templated files
    await this._applyTemplates(templateDirectory, targetDirectory, TEMPLATE_FILE_LIST, args);

    // Generate images
    await this._generateIcons(args.icon, targetDirectory, IMAGES);

    // Generate adaptive images
    if (args.maskableIcon) {
      await this._generateIcons(args.maskableIcon, targetDirectory, ADAPTIVE_IMAGES);
    }
  }
}

module.exports = TwaGenerator;
