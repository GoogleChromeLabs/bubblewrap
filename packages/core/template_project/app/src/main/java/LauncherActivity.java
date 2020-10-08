/*
 * Copyright 2020 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package <%= packageId %>;

import android.net.Uri;

<% for(const imp of launcherActivity.imports) { %>
    import <%= imp %>;
<% } %>

public class LauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {
    <% for(const variable of launcherActivity.variables) { %>
        <%= variable %>
    <% } %>

    <% for(const method of launcherActivity.methods) { %>
        <%= method %>
    <% } %>

    @Override
    protected Uri getLaunchingUrl() {
        // Get the original launch Url.
        Uri uri = super.getLaunchingUrl();

        <% for(const code of launcherActivity.launchUrl) { %>
            <%= code %>
        <% } %>

        return uri;
    }
}
