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
import {PsiResult, LighthouseMetricAudit} from '../lib/psi';

const WEB_VITALS_SCORES = {
  firstContentfulPaint: 0,
  largestContentfulPaint: 0,
  maxPotentialFID: 0,
  cumulativeLayoutShift: 0,
} as LighthouseMetricAudit;

function mockPsiResult(performanceScore: number | null, pwaScore: number | null,
    webVitalsScores = WEB_VITALS_SCORES): PsiResult {
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
      audits: {
        metrics: {
          details: {
            items: [webVitalsScores],
          },
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

    // LCP Tests
    it('LCP is PASS when 2.5 s', async () => {
      const psiResult = mockPsiResult(0.8, 1.0, {
        ...WEB_VITALS_SCORES,
        largestContentfulPaint: 2500,
      });
      const pwaValidator = mockPwaValidator(psiResult);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.scores.largestContentfulPaint.status).toBe('PASS');
      expect(result.scores.largestContentfulPaint.printValue).toBe('2.5 s');
    });
    it('LCP is PASS when 2.549 s', async () => {
      const psiResult = mockPsiResult(0.8, 1.0, {
        ...WEB_VITALS_SCORES,
        largestContentfulPaint: 2549,
      });
      const pwaValidator = mockPwaValidator(psiResult);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.scores.largestContentfulPaint.status).toBe('PASS');
      expect(result.scores.largestContentfulPaint.printValue).toBe('2.5 s');
    });
    it('LCP is WARN when 2.550 s', async () => {
      const psiResult = mockPsiResult(0.8, 1.0, {
        ...WEB_VITALS_SCORES,
        largestContentfulPaint: 2550,
      });
      const pwaValidator = mockPwaValidator(psiResult);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.scores.largestContentfulPaint.status).toBe('WARN');
      expect(result.scores.largestContentfulPaint.printValue).toBe('2.6 s');
    });
    it('LCP is WARN when 4s', async () => {
      const psiResult = mockPsiResult(0.8, 1.0, {
        ...WEB_VITALS_SCORES,
        largestContentfulPaint: 4000,
      });
      const pwaValidator = mockPwaValidator(psiResult);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.scores.largestContentfulPaint.status).toBe('WARN');
      expect(result.scores.largestContentfulPaint.printValue).toBe('4.0 s');
    });
    it('LCP is WARN when 4.049s', async () => {
      const psiResult = mockPsiResult(0.8, 1.0, {
        ...WEB_VITALS_SCORES,
        largestContentfulPaint: 4049,
      });
      const pwaValidator = mockPwaValidator(psiResult);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.scores.largestContentfulPaint.status).toBe('WARN');
      expect(result.scores.largestContentfulPaint.printValue).toBe('4.0 s');
    });
    it('LCP is FAIL when 4.050s', async () => {
      const psiResult = mockPsiResult(0.8, 1.0, {
        ...WEB_VITALS_SCORES,
        largestContentfulPaint: 4050,
      });
      const pwaValidator = mockPwaValidator(psiResult);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.scores.largestContentfulPaint.status).toBe('FAIL');
      expect(result.scores.largestContentfulPaint.printValue).toBe('4.1 s');
    });
    it('LCP is FAIL when 10s', async () => {
      const psiResult = mockPsiResult(0.8, 1.0, {
        ...WEB_VITALS_SCORES,
        largestContentfulPaint: 10000,
      });
      const pwaValidator = mockPwaValidator(psiResult);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.scores.largestContentfulPaint.status).toBe('FAIL');
      expect(result.scores.largestContentfulPaint.printValue).toBe('10.0 s');
    });

    // FID Tests
    it('FID is PASS when 100 ms', async () => {
      const psiResult = mockPsiResult(0.8, 1.0, {
        ...WEB_VITALS_SCORES,
        maxPotentialFID: 100,
      });
      const pwaValidator = mockPwaValidator(psiResult);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.scores.firstInputDelay.status).toBe('PASS');
      expect(result.scores.firstInputDelay.printValue).toBe('100 ms');
    });
    it('FID is WARN when 300 ms', async () => {
      const psiResult = mockPsiResult(0.8, 1.0, {
        ...WEB_VITALS_SCORES,
        maxPotentialFID: 300,
      });
      const pwaValidator = mockPwaValidator(psiResult);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.scores.firstInputDelay.status).toBe('WARN');
      expect(result.scores.firstInputDelay.printValue).toBe('300 ms');
    });
    it('FID is FAIL when 500 ms', async () => {
      const psiResult = mockPsiResult(0.8, 1.0, {
        ...WEB_VITALS_SCORES,
        maxPotentialFID: 500,
      });
      const pwaValidator = mockPwaValidator(psiResult);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.scores.firstInputDelay.status).toBe('FAIL');
      expect(result.scores.firstInputDelay.printValue).toBe('500 ms');
    });

    // CLS Tests
    it('CLS is PASS when 0.1', async () => {
      const psiResult = mockPsiResult(0.8, 1.0, {
        ...WEB_VITALS_SCORES,
        cumulativeLayoutShift: 0.1,
      });
      const pwaValidator = mockPwaValidator(psiResult);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.scores.cumulativeLayoutShift.status).toBe('PASS');
      expect(result.scores.cumulativeLayoutShift.printValue).toBe('0.10');
    });
    it('CLS is WARN when 0.25', async () => {
      const psiResult = mockPsiResult(0.8, 1.0, {
        ...WEB_VITALS_SCORES,
        cumulativeLayoutShift: 0.25,
      });
      const pwaValidator = mockPwaValidator(psiResult);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.scores.cumulativeLayoutShift.status).toBe('WARN');
      expect(result.scores.cumulativeLayoutShift.printValue).toBe('0.25');
    });
    it('CLS is FAIL when 0.3', async () => {
      const psiResult = mockPsiResult(0.8, 1.0, {
        ...WEB_VITALS_SCORES,
        cumulativeLayoutShift: 0.3,
      });
      const pwaValidator = mockPwaValidator(psiResult);
      const result = await pwaValidator.validate(new URL('https://example.com'));
      expect(result.scores.cumulativeLayoutShift.status).toBe('FAIL');
      expect(result.scores.cumulativeLayoutShift.printValue).toBe('0.30');
    });
  });
});
