package org.oonjai.hub;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.TextView;

public final class HubActivity extends Activity {
    private static final Uri HUB = Uri.parse("https://oonjai-marketplace.github.io/web/hub/");

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        // Custom Tabs share the browser's sign-in, downloads and printing support.
        Intent openHub = new Intent(Intent.ACTION_VIEW, HUB);
        Bundle options = new Bundle();
        options.putString("android.support.customtabs.extra.SESSION", null);
        options.putInt("android.support.customtabs.extra.TOOLBAR_COLOR", 0xff032f23);
        openHub.putExtras(options);
        try {
            startActivity(openHub);
            finish();
        } catch (ActivityNotFoundException noBrowser) {
            TextView message = new TextView(this);
            message.setPadding(32, 48, 32, 32);
            message.setText("Enable a web browser on this device, then reopen Oon Jai Hub.");
            setContentView(message);
        }
    }
}
