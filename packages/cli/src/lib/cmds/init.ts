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

import * as fs from 'fs';
import {join, resolve} from 'path';
import {Config, DisplayModes, JdkHelper, KeyTool, Orientations, TwaGenerator, TwaManifest}
  from '@bubblewrap/core';
import {validateHost, validateColor, createValidateString, validateDisplayMode, validatePackageId,
  validateImageUrl, validateOptionalImageUrl, validateInteger, validateOrientation}
  from '../inputHelpers';
import {APP_NAME} from '../constants';
import {Prompt, InquirerPrompt} from '../Prompt';
import {enUS as messages} from '../strings';
import {generateTwaProject} from './shared';

export interface InitArgs {
  manifest?: string;
  directory?: string;
  chromeosonly?: boolean;
  alphaDependencies?: boolean;
}

async function confirmTwaConfig(twaManifest: TwaManifest, prompt: Prompt): Promise<TwaManifest> {
  // Step 1/5 - Collect information on the Web App.
  prompt.printMessage(messages.messageWebAppDetails);
  prompt.printMessage(messages.messageWebAppDetailsDesc);

  twaManifest.host = await prompt.promptInput(
      messages.promptHostMessage, twaManifest.host, validateHost);

  twaManifest.startUrl = await prompt.promptInput(
      messages.promptStartUrl, twaManifest.startUrl, createValidateString(1));

  // Step 2/5 Collect information on the Android App.
  prompt.printMessage(messages.messageAndroidAppDetails);
  prompt.printMessage(messages.messageAndroidAppDetailsDesc);

  twaManifest.name = await prompt.promptInput(
      messages.promptName,
      twaManifest.name,
      createValidateString(1, 50),
  );

  twaManifest.launcherName = await prompt.promptInput(
      messages.promptLauncherName,
      twaManifest.launcherName,
      createValidateString(1, 12),
  );

  twaManifest.packageId = await prompt.promptInput(
      messages.promptPackageId,
      twaManifest.packageId,
      validatePackageId,
  );

  twaManifest.appVersionCode = await prompt.promptInput(
      messages.promptVersionCode,
      twaManifest.appVersionCode.toString(),
      validateInteger,
  );
  twaManifest.appVersionName = twaManifest.appVersionCode.toString();

  twaManifest.display = await prompt.promptChoice(
      messages.promptDisplayMode,
      DisplayModes,
      twaManifest.display,
      validateDisplayMode,
  );

  twaManifest.orientation = await prompt.promptChoice(
      messages.promptOrientation,
      Orientations,
      twaManifest.orientation,
      validateOrientation,
  );

  twaManifest.themeColor = await prompt.promptInput(
      messages.promptThemeColor,
      twaManifest.themeColor.hex(),
      validateColor,
  );

  // Step 3/5 Launcher Icons and Splash Screen.
  prompt.printMessage(messages.messageLauncherIconAndSplash);
  prompt.printMessage(messages.messageLauncherIconAndSplashDesc);
  twaManifest.backgroundColor = await prompt.promptInput(
      messages.promptBackgroundColor,
      twaManifest.backgroundColor.hex(),
      validateColor,
  );

  twaManifest.iconUrl = (await prompt.promptInput(
      messages.promptIconUrl,
      twaManifest.iconUrl ? twaManifest.iconUrl : '',
      validateImageUrl,
  )).toString();

  const maskableIconUrl = await prompt.promptInput(
      messages.promptMaskableIconUrl,
      twaManifest.maskableIconUrl ? twaManifest.maskableIconUrl : '',
      validateOptionalImageUrl,
  );
  twaManifest.maskableIconUrl = maskableIconUrl ? maskableIconUrl.toString() : undefined;

  // Step 4/5 Optional Features.
  prompt.printMessage(messages.messageOptionFeatures);
  prompt.printMessage(messages.messageOptionalFeaturesDesc);

  if (twaManifest.shortcuts.length > 0) {
    const addShortcuts = await prompt.promptConfirm(messages.promptShortcuts, true);
    if (!addShortcuts) {
      twaManifest.shortcuts = [];
    }
  }

  const monochromeIconUrl = await prompt.promptInput(
      messages.promptMonochromeIconUrl,
      twaManifest.monochromeIconUrl ? twaManifest.monochromeIconUrl : '',
      validateOptionalImageUrl,
  );
  twaManifest.monochromeIconUrl = monochromeIconUrl ? monochromeIconUrl.toString() : undefined;

  const playBillingEnabled = await prompt.promptConfirm(messages.promptPlayBilling, false);
  if (playBillingEnabled) {
    twaManifest.alphaDependencies = {
      enabled: true,
    };

    twaManifest.features = {
      ...twaManifest.features,
      playBilling: {
        enabled: true,
      },
    };
  }

  // Step 5/5 Signing Key Information.
  prompt.printMessage(messages.messageSigningKeyInformation);
  prompt.printMessage(messages.messageSigningKeyInformationDesc);
  twaManifest.signingKey.path = await prompt.promptInput(
      messages.promptKeyPath,
      twaManifest.signingKey.path,
      createValidateString(6),
  );

  twaManifest.signingKey.alias = await prompt.promptInput(
      messages.promptKeyAlias,
      twaManifest.signingKey.alias,
      createValidateString(1),
  );

  twaManifest.generatorApp = APP_NAME;
  return twaManifest;
}

async function createSigningKey(
    twaManifest: TwaManifest, config: Config, prompt: Prompt): Promise<void> {
  // Signing Key already exists. Skip creation.
  if (fs.existsSync(twaManifest.signingKey.path)) {
    return;
  }

  const jdkHelper = new JdkHelper(process, config);
  const keytool = new KeyTool(jdkHelper);

  prompt.printMessage(messages.messageSigningKeyCreation);
  prompt.printMessage(messages.messageSigningKeyNotFound(twaManifest.signingKey.path));
  // Ask user if they want to create a signing key now.
  if (!await prompt.promptConfirm(messages.promptCreateKey, true)) {
    return;
  }

  const fullName =
      await prompt.promptInput(messages.promptKeyFullName, null, createValidateString(1));
  const organizationalUnit = await prompt.promptInput(
      messages.promptKeyOrganizationalUnit, null, createValidateString(1));
  const organization =
      await prompt.promptInput(messages.promptKeyOrganization, null, createValidateString(1));
  const country =
      await prompt.promptInput(messages.promptKeyCountry, null, createValidateString(2, 2));
  const keystorePassword =
      await prompt.promptPassword(messages.promptKeystorePassword, createValidateString(6));
  const keyPassword =
      await prompt.promptPassword(messages.promptKeyPassword, createValidateString(6));

  await keytool.createSigningKey({
    fullName: fullName,
    organizationalUnit: organizationalUnit,
    organization: organization,
    country: country,
    password: keystorePassword,
    keypassword: keyPassword,
    alias: twaManifest.signingKey.alias,
    path: twaManifest.signingKey.path,
  });
}

export async function init(
    args: InitArgs, config: Config, prompt: Prompt = new InquirerPrompt()): Promise<boolean> {
  if (!args.manifest) {
    prompt.printMessage(messages.errorMissingManifestParameter);
    return false;
  }
  prompt.printMessage(messages.messageInitializingWebManifest(args.manifest));
  // Ensure `targetDirectory` exists.
  const targetDirectory = resolve(process.cwd(), args.directory || './');
  if (!fs.existsSync(targetDirectory)) {
    // Confirm if the directory should be created. Otherwise, thrown an error.
    if (!await prompt.promptConfirm(
        messages.promptCreateDirectory(targetDirectory), true)) {
      throw new Error(messages.errorDirectoryDoesNotExist(targetDirectory));
    }
    fs.promises.mkdir(targetDirectory, {recursive: true});
  }

  let twaManifest = await TwaManifest.fromWebManifest(args.manifest);
  if (args.chromeosonly) {
    twaManifest.isChromeOSOnly = true;
  }

  if (args.alphaDependencies) {
    twaManifest.alphaDependencies = {
      enabled: true,
    };
  }

  // The default path is "./android-keystore". Make sure it's relative to "targetDirectory".
  twaManifest.signingKey.path = join(targetDirectory, twaManifest.signingKey.path);
  twaManifest = await confirmTwaConfig(twaManifest, prompt);
  const twaGenerator = new TwaGenerator();
  await twaManifest.saveToFile(join(targetDirectory, '/twa-manifest.json'));
  await generateTwaProject(prompt, twaGenerator, targetDirectory, twaManifest);
  await createSigningKey(twaManifest, config, prompt);
  prompt.printMessage(messages.messageProjectGeneratedSuccess);
  return true;
}
