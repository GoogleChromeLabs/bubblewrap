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

const JdkHelper = require('./JdkHelper');
const KeyTool = require('./KeyTool');
const config = require('../Config');

const jdkHelper = new JdkHelper(process, config);

module.exports = {
  jdkHelper: jdkHelper,
  keytool: new KeyTool(jdkHelper),
};
