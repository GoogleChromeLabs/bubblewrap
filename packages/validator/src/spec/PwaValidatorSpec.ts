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
import {PwaValidator} from '../lib/PwaValidator';
import {PsiResult} from '../lib/psi';

function mockPsiResult(performanceScore: number, pwaScore: number): PsiResult {
  return {
    lighthouseResult: {
      categories: {
        pwa: {
          score: pwaScore,
        },
        performance: {
          score: performanceScore,
        },
      },
    },
  } as PsiResult;
};

function mockPwaValidator(pwaScore: number, performanceScore: number): PwaValidator {
  return new PwaValidator({
    runPageSpeedInsights: async (): Promise<PsiResult> => {
      return mockPsiResult(pwaScore, performanceScore);
    },
  });
}

describe('PwaValidator', () => {
  describe('#validate', () => {
    it('pass is true when lighthouse score >= 0.8 and pwa >= 1.0', async () => {
      const pwaValidator = mockPwaValidator(0.8, 1.0);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.status).toBe('PASS');
    });
    it('pass is false when lighthouse score < 0.8 and pwa >= 1.0', async () => {
      const pwaValidator = mockPwaValidator(0.7, 1.0);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.status).toBe('FAIL');
    });
    it('pass is false when lighthouse score >= 0.8 and pwa < 1.0', async () => {
      const pwaValidator = mockPwaValidator(1.0, 0.99);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.status).toBe('FAIL');
    });
    it('pass is false when lighthouse score < 0.8 and pwa < 1.0', async () => {
      const pwaValidator = mockPwaValidator(0.0, 0.0);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.status).toBe('FAIL');
    });
  });
});
