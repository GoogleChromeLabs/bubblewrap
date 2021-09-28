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

import * as fs from 'fs';
import {fetch as fetchh2, Response as FetchH2Response} from 'fetch-h2';
import nodefetch, {Response as NodeFetchResponse} from 'node-fetch';

export type FetchEngine = 'node-fetch' | 'fetch-h2';
const DEFAULT_FETCH_ENGINE: FetchEngine = 'fetch-h2';

export type NodeFetchOrFetchH2Response = FetchH2Response | NodeFetchResponse;

class FetchUtils {
  private fetchEngine = DEFAULT_FETCH_ENGINE;

  setFetchEngine(newFetchEngine: FetchEngine): void {
    this.fetchEngine = newFetchEngine;
  }

  async fetch(input: string): Promise<NodeFetchOrFetchH2Response> {
    if (this.fetchEngine == 'node-fetch') {
      return await nodefetch(input, {redirect: 'follow'});
    } else {
      return await fetchh2(input, {redirect: 'follow'});
    }
  }

  /**
   * Downloads a file from `url` and saves it to `path`. If a `progressCallback` function is passed, it
   * will be invoked for every chunk received. If the value of `total` parameter is -1, it means we
   * were unable to determine to total file size before starting the download.
   */
  async downloadFile(
      url: string,
      path: string,
      progressCallback?: (current: number, total: number) => void,
  ): Promise<void> {
    let result;
    let readableStream: NodeJS.ReadableStream;

    if (this.fetchEngine === 'node-fetch') {
      result = await nodefetch(url);
      readableStream = result.body;
    } else {
      result = await fetchh2(url, {redirect: 'follow'});
      readableStream = await result.readable();
    }

    // Try to determine the file size via the `Content-Length` header. This may not be available
    // for all cases.
    const contentLength = result.headers.get('content-length');
    const fileSize = contentLength ? parseInt(contentLength) : -1;

    const fileStream = fs.createWriteStream(path);
    let received = 0;

    await new Promise((resolve, reject) => {
      readableStream.pipe(fileStream);

      // Even though we're piping the chunks, we intercept them to check for the download progress.
      if (progressCallback) {
        readableStream.on('data', (chunk) => {
          received = received + chunk.length;
          progressCallback(received, fileSize);
        });
      }

      readableStream.on('error', (err) => {
        reject(err);
      });

      fileStream.on('finish', () => {
        resolve();
      });
    });
  }
}

const fetchUtils = new FetchUtils();
export {fetchUtils};
