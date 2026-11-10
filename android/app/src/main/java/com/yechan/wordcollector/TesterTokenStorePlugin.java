package com.yechan.wordcollector;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * Keeps the tester bearer token outside WebView localStorage and app backups.
 * An AndroidKeyStore-backed AES-GCM key encrypts the token before it is saved
 * in private app SharedPreferences. No token is logged or written to source.
 */
@CapacitorPlugin(name = "TesterTokenStore")
public class TesterTokenStorePlugin extends Plugin {
    private static final String ALIAS = "wordcollector_tester_token_v1";
    private static final String PREFS = "wordcollector_secure_tester_auth";
    private static final String TOKEN = "encrypted_token";
    private static final String IV = "initialization_vector";

    private SharedPreferences prefs() {
        return getContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private SecretKey key(boolean create) throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        if (store.containsAlias(ALIAS)) {
            return ((KeyStore.SecretKeyEntry) store.getEntry(ALIAS, null)).getSecretKey();
        }
        if (!create) return null;
        KeyGenerator generator = KeyGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
        generator.init(new KeyGenParameterSpec.Builder(
            ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
            .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
            .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
            .setKeySize(256)
            .build());
        return generator.generateKey();
    }

    @PluginMethod
    public void save(PluginCall call) {
        String raw = call.getString("token", "");
        if (!raw.matches("wc_[a-f0-9]{64}")) {
            call.reject("테스터 인증 코드 형식을 확인해 주세요.");
            return;
        }
        try {
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key(true));
            byte[] ciphertext = cipher.doFinal(raw.getBytes(StandardCharsets.UTF_8));
            boolean ok = prefs().edit()
                .putString(TOKEN, Base64.encodeToString(ciphertext, Base64.NO_WRAP))
                .putString(IV, Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP))
                .commit();
            if (!ok) throw new IllegalStateException("Storage write failed");
            call.resolve(new JSObject());
        } catch (Exception ignored) {
            call.reject("인증 코드를 기기에 안전하게 저장하지 못했습니다.");
        }
    }

    @PluginMethod
    public void read(PluginCall call) {
        try {
            SharedPreferences p = prefs();
            String encrypted = p.getString(TOKEN, "");
            String iv = p.getString(IV, "");
            JSObject result = new JSObject();
            if (encrypted.isEmpty() && iv.isEmpty()) {
                result.put("token", "");
                call.resolve(result);
                return;
            }
            if (encrypted.isEmpty() || iv.isEmpty()) throw new IllegalStateException("Incomplete record");
            SecretKey secret = key(false);
            if (secret == null) throw new IllegalStateException("Key unavailable");
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, secret,
                new GCMParameterSpec(128, Base64.decode(iv, Base64.NO_WRAP)));
            String token = new String(cipher.doFinal(Base64.decode(encrypted, Base64.NO_WRAP)),
                StandardCharsets.UTF_8);
            if (!token.matches("wc_[a-f0-9]{64}")) throw new IllegalStateException("Invalid token");
            result.put("token", token);
            call.resolve(result);
        } catch (Exception ignored) {
            call.reject("저장된 인증 코드를 읽지 못했습니다. 인증 코드를 지우고 다시 등록해 주세요.");
        }
    }

    @PluginMethod
    public void clear(PluginCall call) {
        if (prefs().edit().remove(TOKEN).remove(IV).commit()) {
            call.resolve(new JSObject());
        } else {
            call.reject("기기에 저장된 인증 코드를 지우지 못했습니다.");
        }
    }
}
