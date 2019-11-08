#!/usr/bin/env bash

#
# Copyright 2019 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# Check if at least 1 argument is provided
if [[ $# -eq 0 ]]
    then
        echo "Usage: 'enable-debug.sh <host>'"
        exit 1
    fi

# Invokes ADB and creates the file with the command line
adb shell "echo '_ --disable-digital-asset-link-verification-for-url=\"$1\"' > /data/local/tmp/chrome-command-line"
