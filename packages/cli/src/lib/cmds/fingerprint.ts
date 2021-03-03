/*
 * Copyright 2021 Google Inc. All Rights Reserved.
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

import {ParsedArgs} from 'minimist';
import {TwaManifest, DigitalAssetLinks, Fingerprint} from '@bubblewrap/core';
import {TWA_MANIFEST_FILE_NAME, ASSETLINKS_OUTPUT_FILE} from '../constants';
import {Prompt, InquirerPrompt} from '../Prompt';
import * as path from 'path';
import * as fs from 'fs';
import {enUS} from '../strings';
import {validateSha256Fingerprint} from '../inputHelpers';

async function loadManifest(args: ParsedArgs, prompt: Prompt): Promise<TwaManifest> {
  const manifestFile = args.manifest || path.join(process.cwd(), TWA_MANIFEST_FILE_NAME);
  prompt.printMessage(enUS.messageLoadingTwaManifestFrom(manifestFile));
  if (!fs.existsSync(manifestFile)) {
    throw new Error(enUS.errorCouldNotfindTwaManifest(manifestFile));
  }
  return await TwaManifest.fromFile(manifestFile);
}

async function saveManifest(
    args: ParsedArgs, twaManifest: TwaManifest, prompt: Prompt): Promise<void> {
  const manifestFile = args.manifest || path.join(process.cwd(), TWA_MANIFEST_FILE_NAME);
  prompt.printMessage(enUS.messageSavingTwaManifestTo(manifestFile));
  await twaManifest.saveToFile(manifestFile);
}

async function generateAssetLinks(
    args: ParsedArgs, prompt: Prompt, twaManifest?: TwaManifest): Promise<boolean> {
  twaManifest = twaManifest || await loadManifest(args, prompt);
  const fingerprints = twaManifest.fingerprints.map((value) => value.value);
  const digitalAssetLinks =
    DigitalAssetLinks.generateAssetLinks(twaManifest.packageId, ...fingerprints);
  const digitalAssetLinksFile = args.output || path.join(process.cwd(), ASSETLINKS_OUTPUT_FILE);
  await fs.promises.writeFile(digitalAssetLinksFile, digitalAssetLinks);
  prompt.printMessage(enUS.messageGeneratedAssetLinksFile(digitalAssetLinksFile));
  return true;
}

async function addFingerprint(args: ParsedArgs, prompt: Prompt): Promise<boolean> {
  if (args._.length < 3) {
    throw new Error(enUS.errorMissingArgument(3, args._.length));
  }
  const fingerprintValue = (await validateSha256Fingerprint(args._[2])).unwrap();
  const twaManifest = await loadManifest(args, prompt);
  const fingerprint: Fingerprint = {name: args.name, value: fingerprintValue};
  twaManifest.fingerprints.push(fingerprint);
  prompt.printMessage(enUS.messageAddedFingerprint(fingerprint));
  await saveManifest(args, twaManifest, prompt);
  return await generateAssetLinks(args, prompt, twaManifest);
}

async function removeFingerprint(args: ParsedArgs, prompt: Prompt): Promise<boolean> {
  if (args._.length < 3) {
    throw new Error(enUS.errorMissingArgument(3, args._.length));
  }
  const fingerprint = args._[2];
  const twaManifest = await loadManifest(args, prompt);
  twaManifest.fingerprints =
      twaManifest.fingerprints.filter((value) => {
        if (value.value === fingerprint) {
          prompt.printMessage(enUS.messageRemovedFingerprint(value));
          return false;
        }
        return true;
      });
  await saveManifest(args, twaManifest, prompt);
  return await generateAssetLinks(args, prompt, twaManifest);
}

async function listFingerprints(args: ParsedArgs, prompt: Prompt): Promise<boolean> {
  const twaManifest = await loadManifest(args, prompt);
  twaManifest.fingerprints.forEach((fingerprint) => {
    console.log(`\t${fingerprint.name || '<unnamed>'}: ${fingerprint.value}`);
  });
  return true;
}

export async function fingerprint(
    args: ParsedArgs,
    prompt: Prompt = new InquirerPrompt()): Promise<boolean> {
  if (args._.length < 2) {
    throw new Error(enUS.errorMissingArgument(2, args._.length));
  }
  const subcommand = args._[1];
  switch (subcommand) {
    case 'add':
      return await addFingerprint(args, prompt);
    case 'remove':
      return await removeFingerprint(args, prompt);
    case 'list':
      return await listFingerprints(args, prompt);
    case 'generateAssetLinks':
      return await generateAssetLinks(args, prompt);
    default:
      throw new Error(`Unknown subcommand: ${subcommand}`);
  }
}
