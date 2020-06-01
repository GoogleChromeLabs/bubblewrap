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

export type LighthouseCategoryName =
    'accessibility' | 'best-practices' | 'performance' | 'pwa' | 'seo';
export type LighthouseEmulatedFormFactor = 'desktop' | 'mobile';

export type LighthouseCategory = {
  id: LighthouseCategoryName;
  title: string;
  description: string;
  manualDescription: string;
  score: number;
}

export type LighthouseCategories = {
  [key in LighthouseCategoryName]: LighthouseCategory;
};

export type LighthouseAuditDetailsItem = {
  [key: string]: number;
}

export type LighthouseAudit = {
  id: string;
  title: string;
  description: string;
  details: {
    type: string;
    items: LighthouseAuditDetailsItem[];
  };
};

export type PsiLighthouseResult = {
  requestedUrl: string;
  finalUrl: string;
  lighthouseVersion: string;
  userAgent: string;
  fetchTime: string;
  environment: {
    networkUserAgent: string;
    hostUserAgent: string;
    benchmarkIndex: number;
  };
  configSettings: {
    emulatedFormFactor: LighthouseEmulatedFormFactor;
    locale: string;
    onlyCategories: LighthouseCategoryName[];
    channel: string;
  };
  audits: {
    metrics: LighthouseAudit;
  };
  categories: LighthouseCategories;
  timing: {
    total: number;
  };
};

/**
 * Defines the types from the PageSpeed Insights API response, relevant to the Trusted Web Activity
 * validation. A comprehensive documentation on fields available for the API response is available
 * at https://developers.google.com/speed/docs/insights/v5/reference/pagespeedapi/runpagespeed#response_1.
 */
export type PsiResult = {
  captchaResult: string;
  kind: string;
  id: string;
  loadingExperience: {
    initial_url: string;
  };
  lighthouseResult: PsiLighthouseResult;
  analysisUTCTimestamp: string;
  version: {
    major: number;
    minor: number;
  };
};
