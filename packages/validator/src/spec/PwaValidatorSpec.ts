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

function mockPsiResult(performanceScore: number | null, pwaScore: number | null): PsiResult {
  return {
    lighthouseResult: {
      categories: {
        pwa: {
          score: pwaScore,
        },
        performance: {
          score: performanceScore,
        },
        accessibility: {
          score: 0,
        },
      },
    },
  } as PsiResult;
};

function mockPwaValidator(result: PsiResult): PwaValidator {
  return new PwaValidator({
    runPageSpeedInsights: async (): Promise<PsiResult> => {
      return result;
    },
  });
}

describe('PwaValidator', () => {
  describe('#validate', () => {
    it('pass is true when lighthouse score >= 0.8 and pwa >= 1.0', async () => {
      const psiResult = mockPsiResult(0.8, 1.0);
      const pwaValidator = mockPwaValidator(psiResult);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.status).toBe('PASS');
    });
    it('pass is false when lighthouse score < 0.8 and pwa >= 1.0', async () => {
      const psiResult = mockPsiResult(0.7, 1.0);
      const pwaValidator = mockPwaValidator(psiResult);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.status).toBe('FAIL');
    });
    it('pass is false when lighthouse score >= 0.8 and pwa < 1.0', async () => {
      const psiResult = mockPsiResult(1.0, 0.99);
      const pwaValidator = mockPwaValidator(psiResult);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.status).toBe('FAIL');
    });
    it('pass is false when lighthouse score < 0.8 and pwa < 1.0', async () => {
      const psiResult = mockPsiResult(0.0, 0.0);
      const pwaValidator = mockPwaValidator(psiResult);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.status).toBe('FAIL');
    });
    it('pass is false when lighthouse scores are negative', async () => {
      const psiResult = mockPsiResult(-100.0, -10.0);
      const pwaValidator = mockPwaValidator(psiResult);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.status).toBe('FAIL');
    });
    it('throws an Error if score values are NaN', async () => {
      const psiResult = mockPsiResult(NaN, NaN);
      const pwaValidator = mockPwaValidator(psiResult);
      await expectAsync(pwaValidator.validate(new URL('https://example.com')))
          .toBeRejectedWithError();
    });
    it('throws an Error if score values are NaN', async () => {
      const psiResult = mockPsiResult(null, null);
      const pwaValidator = mockPwaValidator(psiResult);
      await expectAsync(pwaValidator.validate(new URL('https://example.com')))
          .toBeRejectedWithError();
    });
    it('throws an Error for an empty PsiResult', async () => {
      const pwaValidator = mockPwaValidator({} as PsiResult);
      await expectAsync(pwaValidator.validate(new URL('https://example.com')))
          .toBeRejectedWithError();
    });
    it('returns the correct PSI url', async () => {
      const psiResult = mockPsiResult(0.8, 1.0);
      const pwaValidator = mockPwaValidator(psiResult);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.psiWebUrl)
          .toBe('https://developers.google.com/speed/pagespeed/insights/' +
              '?url=https%3A%2F%2Fexample.com%2F');
    });
  });
});
