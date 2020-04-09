/*
 * Copyright 2020 Google Inc. All Rights Reserved.
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

import fetch from 'node-fetch';
import {PsiResult} from './PsiResult';

const BASE_PSI_URL = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed';
export type PsiStrategy = 'desktop' | 'mobile';
export type PsiCategory = 'accessibility' | 'best-practices' | 'performance' | 'pwa' | 'seo';

/**
 * A wrapper for a request to the PageSpeed Ingights API.
 */
export class PsiRequest {
  /**
   * Builds a new PsiRequest;
   * @param url the full URL of the PSI endpoint, with parameters
   */
  constructor(readonly url: URL) {
  }
}

/**
 * Builds requests for the PSI endpoint. A full list of parameters is available at
 * https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed
 */
export class PsiRequestBuilder {
  private url: URL;

  /**
   * Constructs a new PsiRequestBuilder instance
   * @param validationUrl the URL to be validated
   */
  constructor(validationUrl: URL) {
    this.url = new URL(BASE_PSI_URL);
    this.setUrl(validationUrl);
  }

  /**
   * Sets the URL to be validated
   * @param url the URL to be validated
   */
  setUrl(url: URL): PsiRequestBuilder {
    this.url.searchParams.delete('url');
    this.url.searchParams.append('url', url.toString());
    return this;
  }

  /**
   * Sets the strategy to use when validating a PWA.
   * @param {PsiStrategy} strategy
   */
  setStrategy(strategy: PsiStrategy): PsiRequestBuilder {
    this.url.searchParams.delete('strategy');
    this.url.searchParams.append('strategy', strategy);
    return this;
  }

  /**
   * Adds a category to be added when generating the PSI report.
   * @param {PsiCategory} category
   */
  addCategory(category: PsiCategory): PsiRequestBuilder {
    this.url.searchParams.append('category', category);
    return this;
  }

  /**
   * Builds a PsiRequest using the parameters in this builder.
   * @returns {PsiRequest}
   */
  build(): PsiRequest {
    return new PsiRequest(this.url);
  }
}

/**
 * A Wrapper for the PageSpeedInsights API.
 *
 * More information on the API is available at:
 * - https://developers.google.com/speed/docs/insights/v5/get-started
 */
export class PageSpeedInsights {
  async runPageSpeedInsights(request: PsiRequest): Promise<PsiResult> {
    const response = await fetch(request.url);
    if (response.status !== 200) {
      throw new Error(
          `Failed to run the PageSpeed Insight report for ${request.url}. ` +
          `Server responded with status ${response.status}`);
    }
    return (await response.json()) as PsiResult;
  }
}
