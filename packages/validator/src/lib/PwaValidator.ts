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

import {PsiRequestBuilder, PageSpeedInsights} from './psi';

const MIN_PERFORMANCE_SCORE = 0.8;
const MIN_PWA_SCORE = 1;

// Web Vitals thresholds, as described at https://web.dev/vitals/
const MIN_LCP_PASS_SCORE = 2500;
const MIN_LCP_WARN_SCORE = 4000;
const MIN_FID_PASS_SCORE = 100;
const MIN_FID_WARN_SCORE = 300;
const MIN_CLS_PASS_SCORE = 0.1;
const MIN_CLS_WARN_SCORE = 0.25;

export type ValidationResult = 'PASS' | 'FAIL' | 'WARN';

export type ScoreResult = {
  value: number;
  printValue: string;
  status: ValidationResult;
}

export type PwaValidationResult = {
  readonly scores: {
    pwa: ScoreResult;
    performance: ScoreResult;
    accessibility: ScoreResult;
    largestContentfulPaint: ScoreResult;
    firstInputDelay: ScoreResult;
    cumulativeLayoutShift: ScoreResult;
  };
  readonly psiWebUrl: string;
  readonly status: ValidationResult;
}

/**
 * Validates if a Progressive Web App (PWA) passes the Quality Criteria to be used inside a Trusted
 * Web Activity.
 * PWAs are required to have a minimum Lighthouse performance score of 80 and a PWA score of 1.
 *
 * More information on the Quality criteria here:
 * -  https://web.dev/using-a-pwa-in-your-android-app/#quality-criteria
 */
export class PwaValidator {
  constructor(readonly psi: PageSpeedInsights) {
  }

  /**
   * Triggers validation for an URL.
   * @param {URL} url the URL to be validated.
   * @returns {PwaValidationResult} the result of the validation.
   */
  async validate(url: URL): Promise<PwaValidationResult> {
    const psiRequest = new PsiRequestBuilder(url)
        .addCategory('performance')
        .addCategory('pwa')
        .addCategory('accessibility')
        .setStrategy('mobile')
        .build();

    let psiResult;
    try {
      psiResult = await this.psi.runPageSpeedInsights(psiRequest);
    } catch (e) {
      throw new Error('Error calling the PageSpeed Insights API: ' + e);
    }

    const pwaScore = psiResult.lighthouseResult.categories.pwa.score;
    const performanceScore = psiResult.lighthouseResult.categories.performance.score;
    if (pwaScore === null || performanceScore === null || isNaN(pwaScore) ||
        isNaN(performanceScore)) {
      throw new Error(`Invalid scores received. PWA Score: ${pwaScore}. ` +
          `Performance Score: ${performanceScore}`);
    }
    const pwaPass = pwaScore >= MIN_PWA_SCORE;
    const performancePass = performanceScore >= MIN_PERFORMANCE_SCORE;
    const passed = pwaPass && performancePass;
    const accessibilityScore = psiResult.lighthouseResult.categories.accessibility.score;

    // Web Vitals Scores
    const lighthouseAuditMetrics = psiResult.lighthouseResult.audits.metrics.details.items[0];

    const lcpScore = lighthouseAuditMetrics.largestContentfulPaint;
    const roundedLcpScore = PwaValidator.roundToNearestMultiple(lcpScore, 100);
    const lcpStatus = this.getStatus(roundedLcpScore, MIN_LCP_PASS_SCORE, MIN_LCP_WARN_SCORE);

    const fidScore = lighthouseAuditMetrics.maxPotentialFID;
    const fidStatus =
        this.getStatus(fidScore, MIN_FID_PASS_SCORE, MIN_FID_WARN_SCORE);

    const clsScore = lighthouseAuditMetrics.cumulativeLayoutShift;
    const clsStatus = this.getStatus(clsScore, MIN_CLS_PASS_SCORE, MIN_CLS_WARN_SCORE);

    const psiWebUrl = new URL('https://developers.google.com/speed/pagespeed/insights/');
    psiWebUrl.searchParams.append('url', url.toString());

    return {
      status: passed ? 'PASS' : 'FAIL',
      psiWebUrl: psiWebUrl.toString(),
      scores: {
        accessibility: {
          value: accessibilityScore,
          printValue: (Math.trunc(accessibilityScore * 100)).toString(),
          status: 'PASS',
        },
        pwa: {
          value: pwaScore,
          printValue: pwaPass ? 'YES' : 'NO',
          status: pwaPass ? 'PASS' : 'FAIL',
        },
        performance: {
          value: pwaScore,
          printValue: (Math.trunc(performanceScore * 100)).toString(),
          status: performancePass ? 'PASS' : 'FAIL',
        },
        largestContentfulPaint: {
          value: lcpScore,
          printValue: (roundedLcpScore / 1000).toFixed(1) + ' s',
          status: lcpStatus,
        },
        firstInputDelay: {
          value: fidScore,
          printValue: fidScore.toString() + ' ms',
          status: fidStatus,
        },
        cumulativeLayoutShift: {
          value: clsScore,
          printValue: clsScore.toFixed(2),
          status: clsStatus,
        },
      },
    };
  }

  /**
   * Rounds a value nearest multiple of multiple.
   * Examples:
   *  - roundToNearestMultiple(2549, 100) returns 2500
   *  - roundToNearestMultiple(2550, 100) returns 2600
   */
  private static roundToNearestMultiple(value: number, multiple: number): number {
    return Math.round(value / multiple) * multiple;
  }

  /**
   * A shortcut method to invoke PwaBuilder#validate with the default PageSpeedInsight
   * implementation.
   * @param url the URL to be validated.
   * @returns {PwaValidationResult} the result of the validation.
   */
  static async validate(url: URL): Promise<PwaValidationResult> {
    const validator = new PwaValidator(new PageSpeedInsights());
    return await validator.validate(url);
  }

  getStatus(value: number, minPassScore: number, minWarnScore: number): ValidationResult {
    return value <= minPassScore ? 'PASS' : value <= minWarnScore ? 'WARN' : 'FAIL';
  }
}
