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

'use strict';

class Log {
  constructor(tag='', verbose=false, output=console) {
    this.tag_ = tag;
    this.verbose_ = verbose;
    this.prefix_ = this.inverse_(tag);
    this.output_ = output;
  }

  debug(message, ...args) {
    if (!this.verbose_) {
      return;
    }
    this.log_(this.output_.log, this.dim_(message), args);
  }

  info(message, ...args) {
    this.log_(this.output_.log, message, ...args);
  }

  warn(message, ...args) {
    this.log_(this.output_.warn, this.yellow_('WARNING ' + message), args);
  }

  error(message, ...args) {
    this.output_.log('\n');
    this.log_(this.output_.error, this.red_('ERROR ' + message), args);
    this.output_.log('\n');
  }

  verbose(isVerbose=true) {
    this.verbose_ = Boolean.valueOf(isVerbose);
  }

  tag(newTag) {
    if (this.tag_) {
      newTag = this.tag_ + ' ' + newTag;
    }
    return new Log(newTag, this.verbose_, this.output_);
  }

  log_(fn, message, args) {
    if (this.prefix_) {
      message = this.prefix_ + ' ' + message;
    }
    if (args) {
      fn(...[message].concat(args));
    } else {
      fn(message);
    }
  }

  inverse_(string) {
    return `\x1b[7m${string}\x1b[0m`;
  }

  dim_(string) {
    return `\x1b[36m${string}\x1b[0m`;
  }

  yellow_(string) {
    return `\x1b[33m${string}\x1b[0m`;
  }

  red_(string) {
    return `\x1b[31m${string}\x1b[0m`;
  }
}

module.exports = new Log();
