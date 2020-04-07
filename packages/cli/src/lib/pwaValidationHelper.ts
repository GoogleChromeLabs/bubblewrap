import {PwaValidationResult} from '@bubblewrap/validator';
import {red, green, bold, underline, gray} from 'colors';
import {Log} from '@bubblewrap/core';

export function printValidationResult(validationResult: PwaValidationResult, log: Log): void {
  const performanceValue = validationResult.scores.performance.status === 'PASS' ?
  green(validationResult.scores.performance.printValue) :
  red(validationResult.scores.performance.printValue);

  const pwaValue = validationResult.scores.pwa.status === 'PASS' ?
  green(validationResult.scores.pwa.printValue) :
  red(validationResult.scores.pwa.printValue);

  const overallStatus = validationResult.status === 'PASS' ?
  green(validationResult.status) : red(validationResult.status);

  const accessibilityValue = gray(validationResult.scores.accessibility.printValue);

  log.info('');
  log.info(underline('Quality Criteria scores'));
  log.info(`Lighthouse Performance score: ......... ${performanceValue}`);
  log.info(`Lighthouse PWA check: ................. ${pwaValue}`);
  log.info('');
  log.info(underline('Other scores'));
  log.info(`Lighthouse Accessibility score......... ${accessibilityValue}`);
  log.info('');
  log.info(underline('Summary'));
  log.info(bold(`Overall result: ....................... ${overallStatus}`));
}
