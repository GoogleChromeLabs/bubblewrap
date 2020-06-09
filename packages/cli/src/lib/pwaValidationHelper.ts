import {PwaValidationResult, ScoreResult} from '@bubblewrap/validator';
import {red, green, bold, underline, yellow} from 'colors';
import {Log} from '@bubblewrap/core';

function getColor(score: ScoreResult): string {
  switch (score.status) {
    case 'PASS': return green(score.printValue);
    case 'WARN': return yellow(score.printValue);
    case 'FAIL': return red(score.printValue);
    default: return score.printValue;
  }
}

export function printValidationResult(validationResult: PwaValidationResult, log: Log): void {
  log.info('');
  log.info('Check the full PageSpeed Insights report at:');
  log.info(`- ${validationResult.psiWebUrl}`);
  log.info('');

  const performanceValue = getColor(validationResult.scores.performance);
  const pwaValue = getColor(validationResult.scores.pwa);

  const overallStatus = validationResult.status === 'PASS' ?
      green(validationResult.status) : red(validationResult.status);

  const accessibilityValue = validationResult.scores.accessibility.printValue;

  const lcpValue = getColor(validationResult.scores.largestContentfulPaint);
  const fidValue = getColor(validationResult.scores.firstInputDelay);
  const clsValue = getColor(validationResult.scores.cumulativeLayoutShift);

  log.info('');
  log.info(underline('Quality Criteria scores'));
  log.info(`Lighthouse Performance score: ................... ${performanceValue}`);
  log.info(`Lighthouse PWA check: ........................... ${pwaValue}`);
  log.info('');
  log.info(underline('Web Vitals'));
  log.info(`Largest Contentful Paint (LCP) .................. ${lcpValue}`);
  log.info(`Maximum Potential First Input Delay (Max FID) ... ${fidValue}`);
  log.info(`Cumulative Layout Shift (CLS) ................... ${clsValue}`);
  log.info('');
  log.info(underline('Other scores'));
  log.info(`Lighthouse Accessibility score................... ${accessibilityValue}`);
  log.info('');
  log.info(underline('Summary'));
  log.info(bold(`Overall result: ................................. ${overallStatus}`));
}
