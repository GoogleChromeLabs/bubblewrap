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

import android.content.pm.ActivityInfo;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;

import java.util.HashMap;
import java.util.Map;

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
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Setting an orientation crashes the app due to the transparent background on Android 8.0
        // Oreo and below. We only set the orientation on Oreo and above. This only affects the
        // splash screen and Chrome will still respect the orientation.
        // See https://github.com/GoogleChromeLabs/bubblewrap/issues/496 for details.
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.O) {
            setRequestedOrientation(<%= toAndroidScreenOrientation(orientation) %>);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        }
    }

    private final Map<String, String> mProtocolHandlers = new HashMap<String, String>() {{
        <% for(const protocol of protocolHandlers) { %>
            put("<%= protocol.protocol %>", "<%= protocol.url %>");
        <% } %>
    }};

    @Override
    protected Uri getLaunchingUrl() {
        // Get the original launch Url.
        Uri uri = super.getLaunchingUrl();

        <% for(const code of launcherActivity.launchUrl) { %>
            <%= code %>
        <% } %>

        /* Protocol Handler support */
        String scheme = uri.getScheme();
        if (mProtocolHandlers.containsKey(scheme)) {
            String target = uri.toString().replace(scheme + "://", "");
            String format = mProtocolHandlers.get(scheme);
            String baseUrl = getString(R.string.launchUrl);
            return Uri.parse(baseUrl + String.format(format, target));
        }

        return uri;
    }
}
