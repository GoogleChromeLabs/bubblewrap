/*
 * Copyright 2026 Google Inc. All Rights Reserved.
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
import * as http from 'http';
import * as os from 'os';
import * as path from 'path';
import {FetchEngine, fetchUtils} from '../../lib/FetchUtils';

for (const engine of ['node-fetch', 'fetch-h2'] as FetchEngine[]) {
  describe(`FetchUtils.downloadFile (${engine})`, () => {
    let server: http.Server;
    let directory: string;
    let url: string;

    beforeEach(async () => {
      directory = fs.mkdtempSync(path.join(os.tmpdir(), 'bubblewrap-download-'));
      fetchUtils.setFetchEngine(engine);
      server = http.createServer((_request, response) => {
        if (_request.url === '/invalid-gzip') {
          response.writeHead(200, {'Content-Encoding': 'gzip'});
          response.end('not gzip data');
          return;
        }
        response.writeHead(200, {'Content-Length': '8'});
        response.end('download');
      });
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const address = server.address() as {port: number};
      url = `http://127.0.0.1:${address.port}/file`;
    });

    afterEach(async () => {
      fetchUtils.setFetchEngine('fetch-h2');
      server.closeAllConnections();
      await new Promise<void>((resolve) => server.close(() => resolve()));
      fs.rmSync(directory, {recursive: true, force: true});
    });

    it('writes the complete file and reports progress', async () => {
      const destination = path.join(directory, 'file');
      let received = 0;
      let total = 0;
      await fetchUtils.downloadFile(url, destination, (current, size) => {
        received = current;
        total = size;
      });
      expect(fs.readFileSync(destination, 'utf8')).toBe('download');
      expect(received).toBe(8);
      expect(total).toBe(8);
    });

    it('still rejects response stream errors', async () => {
      await expectAsync(fetchUtils.downloadFile(
          url.replace('/file', '/invalid-gzip'), path.join(directory, 'invalid')))
          .toBeRejected();
    });

    it('rejects destination errors instead of leaving the download pending', async () => {
      const createWriteStream = fs.createWriteStream;
      let observedError: Error | undefined;
      spyOn(fs, 'createWriteStream').and.callFake((...args:
          Parameters<typeof createWriteStream>) => {
        const stream = createWriteStream(...args);
        // Observe the error so a broken implementation fails the assertion
        // instead of terminating the entire test process with an uncaught error.
        stream.on('error', (error) => {
          observedError = error;
        });
        return stream;
      });
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const result = await Promise.race([
          fetchUtils.downloadFile(url, path.join(directory, 'missing', 'file'))
              .then(() => 'resolved', (error: NodeJS.ErrnoException) => error.code),
          new Promise<string>((resolve) => {
            timer = setTimeout(() => resolve('pending'), 2000);
          }),
        ]);
        expect(result).toBe('ENOENT');
        expect(observedError).toBeDefined();
      } finally {
        clearTimeout(timer);
      }
    });
  });
}
