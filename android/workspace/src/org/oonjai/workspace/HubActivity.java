package org.oonjai.workspace;

import android.view.View;

public final class HubActivity extends WorkspaceActivity {
    static final int GREEN = 0xff032e22, CREAM = 0xfffff3d8;

    static void fitSystemBars(View view) {
        view.setOnApplyWindowInsetsListener((v, insets) -> {
            v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
            return insets.consumeSystemWindowInsets();
        });
    }
}
