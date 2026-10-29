package com.bnf.phone;

import android.content.Context;
import android.content.SharedPreferences;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.provider.ContactsContract;
import android.telephony.SmsManager;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/** msg-hub 엣지함수 호출, 문자 발송, 기록 — 화면·수신기·서비스가 같이 쓴다 */
final class Hub {
    static final String URL_HUB = "https://fchxlplnacyycuddvdmu.supabase.co/functions/v1/msg-hub";
    static final ExecutorService IO = Executors.newCachedThreadPool();

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("bnf", Context.MODE_PRIVATE);
    }

    static String key(Context c) {
        return prefs(c).getString("key", "");
    }

    /** 폼 형식 POST. 응답 본문을 돌려준다(fmt=text면 답장 문구 그대로) */
    static String post(Context c, Map<String, String> params) throws Exception {
        String k = key(c);
        if (k.isEmpty()) throw new Exception("연결 키 없음");
        StringBuilder body = new StringBuilder();
        for (Map.Entry<String, String> e : params.entrySet()) {
            if (body.length() > 0) body.append('&');
            body.append(URLEncoder.encode(e.getKey(), "UTF-8")).append('=')
                .append(URLEncoder.encode(e.getValue() == null ? "" : e.getValue(), "UTF-8"));
        }
        HttpURLConnection h = (HttpURLConnection) new URL(URL_HUB + "?key=" + URLEncoder.encode(k, "UTF-8")).openConnection();
        h.setConnectTimeout(15000);
        h.setReadTimeout(40000);   // AI가 주문을 읽는 데 몇 초 걸림
        h.setRequestMethod("POST");
        h.setDoOutput(true);
        h.setRequestProperty("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
        try (OutputStream o = h.getOutputStream()) {
            o.write(body.toString().getBytes(StandardCharsets.UTF_8));
        }
        int code = h.getResponseCode();
        InputStream in = code < 400 ? h.getInputStream() : h.getErrorStream();
        String res = in == null ? "" : read(in);
        h.disconnect();
        if (code == 401) throw new Exception("연결 키가 맞지 않음");
        if (code >= 400) throw new Exception("서버 오류 " + code);
        return res;
    }

    static String read(InputStream in) throws Exception {
        ByteArrayOutputStream b = new ByteArrayOutputStream();
        byte[] buf = new byte[4096];
        int n;
        while ((n = in.read(buf)) > 0) b.write(buf, 0, n);
        in.close();
        return b.toString("UTF-8");
    }

    static void sendSms(Context c, String to, String text) {
        SmsManager sm = Build.VERSION.SDK_INT >= 31 ? c.getSystemService(SmsManager.class) : SmsManager.getDefault();
        ArrayList<String> parts = sm.divideMessage(text);
        if (parts.size() > 1) sm.sendMultipartTextMessage(to, null, parts, null, null);
        else sm.sendTextMessage(to, null, text, null, null);
    }

    /** 연락처에 저장된 이름 (권한 없으면 빈 값) */
    static String contactName(Context c, String phone) {
        try {
            Uri u = Uri.withAppendedPath(ContactsContract.PhoneLookup.CONTENT_FILTER_URI, Uri.encode(phone));
            try (Cursor cur = c.getContentResolver().query(u, new String[]{ContactsContract.PhoneLookup.DISPLAY_NAME}, null, null, null)) {
                if (cur != null && cur.moveToFirst()) return cur.getString(0);
            }
        } catch (Exception ignored) {
        }
        return "";
    }

    /** 최근 기록 40줄 — 앱 화면에 보여줌 */
    static synchronized void log(Context c, String s) {
        String t = new SimpleDateFormat("MM-dd HH:mm", Locale.KOREA).format(new Date());
        String old = prefs(c).getString("log", "");
        String all = t + "  " + s.replace('\n', ' ') + "\n" + old;
        String[] lines = all.split("\n");
        StringBuilder b = new StringBuilder();
        for (int i = 0; i < Math.min(40, lines.length); i++) b.append(lines[i]).append('\n');
        prefs(c).edit().putString("log", b.toString()).apply();
    }

    static String cut(String s, int n) {
        s = s == null ? "" : s.replace('\n', ' ');
        return s.length() > n ? s.substring(0, n) + "…" : s;
    }
}
