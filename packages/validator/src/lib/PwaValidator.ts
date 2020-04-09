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

type ValidationResult = 'PASS' | 'FAIL';

type ScoreResult = {
  value: number;
  printValue: string;
  status: ValidationResult;
}

export type PwaValidationResult = {
  readonly scores: {
    pwa: ScoreResult;
    performance: ScoreResult;
    accessibility: ScoreResult;
  };
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

    const psiResult = await this.psi.runPageSpeedInsights(psiRequest);
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

    return {
      status: passed ? 'PASS' : 'FAIL',
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
          status: pwaPass ? 'PASS' : 'FAIL',
        },
      },
    };
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
}
