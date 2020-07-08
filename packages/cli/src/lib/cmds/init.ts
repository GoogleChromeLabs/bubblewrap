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
import {Config, DisplayModes, JdkHelper, KeyTool, Log, TwaGenerator, TwaManifest}
  from '@bubblewrap/core';
import {validateHost, validateColor, validateOptionalUrl, validateUrl, createValidateString,
  validateDisplayMode, validatePackageId} from '../inputHelpers';
import {ParsedArgs} from 'minimist';
import {APP_NAME} from '../constants';
import {Prompt, InquirerPrompt} from '../Prompt';
import {en as messages} from '../strings';

const log = new Log('init');

export interface InitArgs {
  manifest: string;
  directory?: string;
}

async function confirmTwaConfig(twaManifest: TwaManifest, prompt: Prompt): Promise<TwaManifest> {
  twaManifest.host = await prompt.promptInput(
      messages.promptHostMessage,
      twaManifest.host,
      validateHost,
  );

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

  twaManifest.display = await prompt.promptChoice(
      messages.promptDisplayMode,
      DisplayModes,
      twaManifest.display,
      validateDisplayMode,
  );

  twaManifest.themeColor = await prompt.promptInput(
      messages.promptThemeColor,
      twaManifest.themeColor.hex(),
      validateColor,
  );

  twaManifest.backgroundColor = await prompt.promptInput(
      messages.promptBackgroundColor,
      twaManifest.backgroundColor.hex(),
      validateColor,
  );

  twaManifest.startUrl = await prompt.promptInput(
      messages.promptStartUrl,
      twaManifest.startUrl,
      createValidateString(1),
  );

  twaManifest.iconUrl = (await prompt.promptInput(
      messages.promptIconUrl,
      twaManifest.iconUrl ? twaManifest.iconUrl : '',
      validateUrl,
  )).toString();

  const maskableIconUrl = await prompt.promptInput(
      messages.promptMaskableIconUrl,
      twaManifest.maskableIconUrl ? twaManifest.maskableIconUrl : '',
      validateOptionalUrl,
  );
  twaManifest.maskableIconUrl = maskableIconUrl ? maskableIconUrl.toString() : undefined;

  const monochromeIconUrl = await prompt.promptInput(
      messages.promptMonochromeIconUrl,
      twaManifest.monochromeIconUrl ? twaManifest.monochromeIconUrl : '',
      validateOptionalUrl,
  );
  twaManifest.monochromeIconUrl = monochromeIconUrl ? monochromeIconUrl.toString() : undefined;

  if (twaManifest.shortcuts.length > 0) {
    const addShortcuts = await prompt.promptConfirm(messages.promptShortcuts, true);
    if (!addShortcuts) {
      twaManifest.shortcuts = [];
    }
  }

  twaManifest.packageId = await prompt.promptInput(
      messages.promptPackageId,
      twaManifest.packageId,
      validatePackageId,
  );

  twaManifest.signingKey.path = await prompt.promptInput(
      messages.promptKeyPath,
      twaManifest.signingKey.path,
      createValidateString(6),
  );

  twaManifest.signingKey.alias = await prompt.promptInput(
      messages.promptKeyAlias,
      twaManifest.signingKey.path,
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

  // Ask user if they want to create a signing key now.
  if (!await prompt.promptConfirm(messages.promptCreateKey(twaManifest.signingKey.path), true)) {
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
    args: ParsedArgs, config: Config, prompt: Prompt = new InquirerPrompt()): Promise<boolean> {
  log.info('Fetching Manifest: ', args.manifest);
  let twaManifest = await TwaManifest.fromWebManifest(args.manifest);
  twaManifest = await confirmTwaConfig(twaManifest, prompt);
  const twaGenerator = new TwaGenerator();
  const targetDirectory = args.directory || process.cwd();
  await twaManifest.saveToFile('./twa-manifest.json');
  await twaGenerator.createTwaProject(targetDirectory, twaManifest);
  await createSigningKey(twaManifest, config, prompt);
  log.info('');
  log.info('Project generated successfully. Build it by running "bubblewrap build"');
  return true;
}
