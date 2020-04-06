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
export type LighthouseCategoryGroup = {
  title: string;
  description?: string;
}
export type LighthouseCategoryGroups = {
  'pwa-installable': LighthouseCategoryGroup;
  'seo-mobile': LighthouseCategoryGroup;
  diagnostics: LighthouseCategoryGroup;
  'a11y-best-practices': LighthouseCategoryGroup;
  'seo-crawl': LighthouseCategoryGroup;
  'a11y-color-contrast': LighthouseCategoryGroup;
  'seo-content': LighthouseCategoryGroup;
  'pwa-optimized': LighthouseCategoryGroup;
  'a11y-navigation': LighthouseCategoryGroup;
  'pwa-fast-reliable': LighthouseCategoryGroup;
  'a11y-aria': LighthouseCategoryGroup;
  'a11y-audio-video': LighthouseCategoryGroup;
  'a11y-language': LighthouseCategoryGroup;
  'a11y-tables-lists': LighthouseCategoryGroup;
  'a11y-names-labels': LighthouseCategoryGroup;
  budgets: LighthouseCategoryGroup;
  metrics: LighthouseCategoryGroup;
  'load-opportunities': LighthouseCategoryGroup;
};

export type LighthouseCategory = {
  id: LighthouseCategoryName;
  title: string;
  description: string;
  manualDescription: string;
  score: number;
  auditRef: LighthouseAuditRef[];
}

export type LighthouseAuditRef = {
  id: string;
  weight: number;
  group?: string;
}

export type LighthouseCategories = {
  [key in LighthouseCategoryName]: LighthouseCategory;
};

export type LighthouseI18n = {
  rendererFormattedStrings: {
    varianceDisclaimer: string;
    opportunityResourceColumnLabel: string;
    opportunitySavingsColumnLabel: string;
    errorMissingAuditInfo: string;
    errorLabel: string;
    warningHeader: string;
    auditGroupExpandTooltip: string;
    passedAuditsGroupTitle: string;
    notApplicableAuditsGroupTitle: string;
    manualAuditsGroupTitle: string;
    toplevelWarningsMessage: string;
    crcLongestDurationLabel: string;
    crcInitialNavigation: string;
    lsPerformanceCategoryDescription: string;
    labDataTitle: string;
  };
};

export type DebugDataDetail = {
  type: 'debugdata';
  items: object[]; // TODO(andreban): Find type
}

export type DebugDataTable = { // TODO 'third-party-summary' has more deetails
  type: 'table';
  summary: object;
  headings: object[];// TODO(andreban): Find type
  items: object[];// TODO(andreban): Find type
}

export type DebugDataOpportunity = {
  type: 'opportunity';
  overallSavingsMs: number;
  overallSavingsBytes?: number;
  headings: object[]; // TODO(andreban): Find type
  items: object[]; // TODO(andreban): Find type
}

export type DebugDataCriticalRequestChain = {
  type: 'criticalrequestchain';
  chains: object[]; // TODO(andreban): Find type
  logestChain: object[]; // TODO(andreban): Find type
}

export type DebugDataScreenshot = {
  type: 'screenshot';
  timing: number;
  timestamp: number;
  data: string;
}

export type DebugDataFilmStrip = {
  type: 'filmstrip';
  items: object[];// TODO(andreban): Find type
  scale: number;
}

export type LighthouseAudit<T> = {
  id: string;
  title: string;
  description: string;
  score?: number;
  scoreDisplayMode: string; // 'informative' | 'numeric' | 'manual' | 'binary' | 'notApplicable'
  details?: T; // TODO(andreban): Each score has its specific details.
  numericValue: number;
  warnings: object[]; // TODO(andreban): Find type
}

export type LighthouseAudits = {
  'main-thread-tasks': LighthouseAudit<DebugDataTable>;
  'total-blocking-time': LighthouseAudit<void>;
  'viewport': LighthouseAudit<void>;
  'uses-rel-preconnect': LighthouseAudit<DebugDataOpportunity>;
  'bootup-time': LighthouseAudit<DebugDataTable>;
  'network-server-latency': LighthouseAudit<DebugDataTable>;
  'offscreen-images': LighthouseAudit<DebugDataOpportunity>;
  'uses-responsive-images': LighthouseAudit<DebugDataOpportunity>;
  'speed-index': LighthouseAudit<void>;
  'first-cpu-idle': LighthouseAudit<void>;
  'total-byte-weight': LighthouseAudit<DebugDataTable>;
  'mainthread-work-breakdown': LighthouseAudit<DebugDataTable>;
  'first-contentful-paint': LighthouseAudit<void>;
  'critical-request-chains': LighthouseAudit<DebugDataCriticalRequestChain>;
  'dom-size': LighthouseAudit<DebugDataTable>;
  'uses-rel-preload': LighthouseAudit<DebugDataOpportunity>;
  'performance-budget': LighthouseAudit<void>;
  'unminified-javascript': LighthouseAudit<DebugDataOpportunity>;
  'first-meaningful-paint': LighthouseAudit<void>;
  'resource-summary': LighthouseAudit<DebugDataTable>;
  'pwa-cross-browser': LighthouseAudit<void>;
  'installable-manifest': LighthouseAudit<DebugDataOpportunity>;
  'themed-omnibox': LighthouseAudit<DebugDataOpportunity>;
  'efficient-animated-content': LighthouseAudit<DebugDataOpportunity>;
  'final-screenshot': LighthouseAudit<DebugDataScreenshot>;
  'metrics': LighthouseAudit<DebugDataDetail>;
  'network-requests': LighthouseAudit<DebugDataTable>;
  'uses-long-cache-ttl': LighthouseAudit<DebugDataTable>;
  'max-potential-fid': LighthouseAudit<void>;
  'interactive': LighthouseAudit<void>;
  'screenshot-thumbnails': LighthouseAudit<DebugDataFilmStrip>;
  'network-rtt': LighthouseAudit<DebugDataTable>;
  'load-fast-enough-for-pwa': LighthouseAudit<void>;
  'pwa-page-transitions': LighthouseAudit<void>;
  'apple-touch-icon': LighthouseAudit<void>;
  'font-display': LighthouseAudit<DebugDataTable>;
  'estimated-input-latency': LighthouseAudit<void>;
  'content-width': LighthouseAudit<void>;
  'pwa-each-page-has-url': LighthouseAudit<void>;
  'unminified-css': LighthouseAudit<DebugDataOpportunity>;
  'unused-css-rules': LighthouseAudit<DebugDataOpportunity>;
  'redirects-http': LighthouseAudit<void>;
  'uses-webp-images': LighthouseAudit<DebugDataOpportunity>;
  'diagnostics': LighthouseAudit<DebugDataDetail>;
  'redirects': LighthouseAudit<DebugDataOpportunity>;
  'is-on-https': LighthouseAudit<DebugDataTable>;
  'without-javascript': LighthouseAudit<void>;
  'works-offline': LighthouseAudit<void>;
  'user-timings': LighthouseAudit<DebugDataTable>;
  'splash-screen': LighthouseAudit<DebugDataDetail>;
  'time-to-first-byte': LighthouseAudit<DebugDataOpportunity>;
  'render-blocking-resources': LighthouseAudit<DebugDataOpportunity>;
  'uses-optimized-images': LighthouseAudit<DebugDataOpportunity>;
  'service-worker': LighthouseAudit<void>;
  'uses-text-compression': LighthouseAudit<DebugDataOpportunity>;
  'third-party-summary': LighthouseAudit<DebugDataTable>;
  'offline-start-url': LighthouseAudit<void>;
}

export type PsiLighthouseResult = {
  requestedUrl: string;
  finalUrl: string;
  lighthouseVersion: string;
  userAgent: string;
  fetchTime: string;
  environment: {
    networkUserAgent: string;
    hostUserAgent: string;
    benchmarkIndes: number;
  };
  runWarnings: object[]; // TODO(andreban): Figure out what the content of a warning should be.
  configSettings: {
    emulatedFormFactor: LighthouseEmulatedFormFactor;
    locale: string;
    onlyCategories: LighthouseCategoryName[];
    channel: string;
  };
  audits: LighthouseAudits;
  categories: LighthouseCategories;
  categoryGroups: LighthouseCategoryGroups;
  timing: {
    total: number;
  };
  i18n: LighthouseI18n;
};

/**
 * Defines the types fro the PSI API response.
 */
export type PsiResult = {
  captchaResult: string;
  kind: string;
  id: string;
  loadingExperiente: {
    initial_url: string;
  };
  lighthouseResult: PsiLighthouseResult;
  analysisUTCTimestamp: string;
  version: {
    major: number;
    minor: number;
  };
};
