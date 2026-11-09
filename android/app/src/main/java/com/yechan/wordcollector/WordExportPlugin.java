package com.yechan.wordcollector;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.OutputStream;

/** Uses Android's document picker; does not request broad storage access. */
@CapacitorPlugin(name = "WordExport")
public class WordExportPlugin extends Plugin {
    private volatile byte[] pending;

    @PluginMethod
    public void save(PluginCall call) {
        if (pending != null) { call.reject("다른 파일 저장을 먼저 완료해 주세요."); return; }
        String mime = call.getString("mimeType", "");
        String encoded = call.getString("base64", "");
        String filename = call.getString("filename", "wordcollector");
        boolean csv = mime.equals("text/csv");
        if (!csv && !mime.equals("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")) {
            call.reject("지원하지 않는 파일 형식입니다."); return;
        }
        if (encoded.isEmpty() || encoded.length() > 32 * 1024 * 1024) {
            call.reject("파일이 비어 있거나 24 MiB를 넘었습니다."); return;
        }
        try {
            pending = Base64.decode(encoded, Base64.DEFAULT);
            if (pending.length == 0 || pending.length > 24 * 1024 * 1024) throw new IllegalArgumentException();
            filename = filename.replaceAll("[\\\\/:*?\"<>|\\p{Cntrl}]", "_");
            String extension = csv ? ".csv" : ".xlsx";
            if (!filename.endsWith(extension)) filename += extension;
            Intent intent = new Intent(Intent.ACTION_CREATE_DOCUMENT);
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            intent.setType(mime);
            intent.putExtra(Intent.EXTRA_TITLE, filename);
            startActivityForResult(call, intent, "documentCreated");
        } catch (Exception error) {
            pending = null;
            call.reject("파일 저장 창을 열지 못했습니다. 다시 시도해 주세요.");
        }
    }

    @ActivityCallback
    private void documentCreated(PluginCall call, ActivityResult result) {
        byte[] bytes = pending;
        pending = null;
        if (call == null) return;
        if (result.getResultCode() != Activity.RESULT_OK) {
            JSObject response = new JSObject(); response.put("cancelled", true); call.resolve(response); return;
        }
        Uri uri = result.getData() == null ? null : result.getData().getData();
        if (uri == null || bytes == null) { call.reject("저장 내용을 찾지 못했습니다. 다시 내보내 주세요."); return; }
        getBridge().execute(() -> {
            try (OutputStream stream = getContext().getContentResolver().openOutputStream(uri, "w")) {
                if (stream == null) throw new java.io.IOException();
                stream.write(bytes);
                stream.flush();
            } catch (Exception error) { call.reject("파일을 저장하지 못했습니다. 저장 위치와 남은 공간을 확인해 주세요."); return; }
            JSObject response = new JSObject(); response.put("cancelled", false); call.resolve(response);
        });
    }
}
