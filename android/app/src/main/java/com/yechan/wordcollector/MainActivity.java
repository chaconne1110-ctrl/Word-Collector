package com.yechan.wordcollector;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WordExportPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
