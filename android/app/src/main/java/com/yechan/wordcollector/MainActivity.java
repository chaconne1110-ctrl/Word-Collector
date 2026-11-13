package com.yechan.wordcollector;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.webkit.WebSettings;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WordExportPlugin.class);
        registerPlugin(TesterTokenStorePlugin.class);
        super.onCreate(savedInstanceState);
        // Honour the page's <meta name="viewport"> width so www/screen-scale.js can
        // scale text and buttons to the screen size (same as mobile Chrome).
        WebSettings settings = getBridge().getWebView().getSettings();
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
    }
}
