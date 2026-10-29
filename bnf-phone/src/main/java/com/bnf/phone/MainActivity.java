package com.bnf.phone;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import android.provider.Settings;
import android.text.InputType;
import android.view.Gravity;
import android.view.View;
import android.widget.Button;
import android.widget.EditText;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Switch;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** 설정 화면: 아래 4가지가 모두 ✅면 끝. 연결 키는 MES 설정의 [앱에 연결] 링크로 자동 입력 */
public class MainActivity extends Activity {
    static final int ORANGE = Color.parseColor("#E8632B"), OK = Color.parseColor("#10b981"), BAD = Color.parseColor("#ef4444");
    LinearLayout root;
    TextView logView, testRes;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        takeKey(getIntent());
    }

    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        takeKey(i);
    }

    void takeKey(Intent i) {
        Uri u = i == null ? null : i.getData();
        if (u != null && "bnfphone".equals(u.getScheme())) {
            String k = u.getQueryParameter("key");
            if (k != null && !k.trim().isEmpty()) {
                Hub.prefs(this).edit().putString("key", k.trim()).apply();
                Hub.log(this, "🔑 MES에서 연결 키를 받았습니다");
            }
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        build();
        PollService.start(this);
    }

    boolean has(String p) {
        return checkSelfPermission(p) == PackageManager.PERMISSION_GRANTED;
    }

    boolean smsOk() {
        return has(Manifest.permission.RECEIVE_SMS) && has(Manifest.permission.SEND_SMS);
    }

    boolean listenerOk() {
        String s = Settings.Secure.getString(getContentResolver(), "enabled_notification_listeners");
        return s != null && s.contains(getPackageName());
    }

    boolean batteryOk() {
        return getSystemService(PowerManager.class).isIgnoringBatteryOptimizations(getPackageName());
    }

    void build() {
        ScrollView sv = new ScrollView(this);
        sv.setBackgroundColor(Color.parseColor("#FAF7F4"));
        root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        int pad = dp(18);
        root.setPadding(pad, dp(28), pad, dp(40));
        sv.addView(root);
        setContentView(sv);

        TextView h = text("📨 BNF 업무폰", 24, true, Color.parseColor("#2B211B"));
        root.addView(h);
        root.addView(text("문자·카톡으로 오는 주문을 MES 메시지 수발주로 자동 접수하고 답장합니다. 아래 4개가 모두 ✅ 가 되면 설정 끝입니다.", 14, false, Color.parseColor("#6E645C")));

        String key = Hub.key(this);
        step(1, "MES와 연결", !key.isEmpty(),
            key.isEmpty() ? "이 휴대폰 크롬에서 MES → 📨 메시지 수발주 → 설정 → [📲 이 휴대폰 앱에 연결]을 누르세요." : "연결 키 입력됨",
            key.isEmpty() ? "키 직접 입력" : null, v -> askKey());

        step(2, "문자 받기·보내기 허용", smsOk(),
            "[허용]을 눌러 나오는 창에서 모두 '허용'을 누르세요. 회색으로 막혀 있으면 아래 [앱 정보] → 오른쪽 위 ⋮ → '제한된 설정 허용' 후 다시.",
            "허용", v -> askPerms());

        step(3, "카톡 알림 읽기 허용", listenerOk(),
            "목록에서 'BNF 업무폰'을 켜세요. 카카오톡 → 설정 → 알림 → '메시지 미리보기'도 켜져 있어야 주문 내용을 읽을 수 있어요.",
            "허용", v -> {
                try {
                    startActivity(new Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS));
                } catch (Exception e) {
                    openAppInfo();
                }
            });

        step(4, "배터리 제한 해제", batteryOk(),
            "밤에도 꺼지지 않게 합니다. 나오는 창에서 '허용'을 누르세요.",
            "해제", v -> {
                try {
                    startActivity(new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, Uri.parse("package:" + getPackageName())));
                } catch (Exception e) {
                    openAppInfo();
                }
            });

        // 연결 시험
        LinearLayout card = card();
        card.addView(text("🔌 연결 시험", 16, true, Color.parseColor("#2B211B")));
        long last = Hub.prefs(this).getLong("last_ok", 0);
        String err = Hub.prefs(this).getString("last_err", "");
        String st = last == 0 ? "아직 서버와 통신한 적 없음" : "마지막 서버 통신: " + ago(last);
        if (!err.isEmpty()) st += "\n⚠ " + err;
        card.addView(text(st, 13, false, Color.parseColor("#6E645C")));
        testRes = text("", 13, true, Color.parseColor("#2B211B"));
        card.addView(btn("서버 연결 확인", v -> ping()));
        card.addView(testRes);
        root.addView(card);

        // 카톡 켜고 끄기
        LinearLayout c2 = card();
        Switch sw = new Switch(this);
        sw.setText("카톡 주문도 받기");
        sw.setTextSize(15);
        sw.setChecked(Hub.prefs(this).getBoolean("kakao_on", true));
        sw.setOnCheckedChangeListener((b, on) -> Hub.prefs(this).edit().putBoolean("kakao_on", on).apply());
        c2.addView(sw);
        c2.addView(text("갤럭시끼리 보낸 문자가 '채팅+'로 오면 이 앱이 못 받습니다. 메시지 앱 → 설정 → 채팅 설정 → 채팅+ 끄기를 권장합니다.", 12, false, Color.parseColor("#9A9088")));
        c2.addView(btn("앱 정보 (제한된 설정 허용)", v -> openAppInfo()));
        root.addView(c2);

        // 최근 기록
        LinearLayout c3 = card();
        c3.addView(text("🧾 최근 기록", 16, true, Color.parseColor("#2B211B")));
        String lg = Hub.prefs(this).getString("log", "");
        logView = text(lg.isEmpty() ? "아직 기록이 없습니다" : lg, 12, false, Color.parseColor("#5D534B"));
        c3.addView(logView);
        c3.addView(btn("새로고침", v -> build()));
        root.addView(c3);

        root.addView(text("버전 " + version(), 11, false, Color.parseColor("#B5ABA2")));
    }

    void step(int n, String title, boolean done, String desc, String btnLabel, View.OnClickListener on) {
        LinearLayout c = card();
        if (done) ((GradientDrawable) c.getBackground()).setStroke(dp(2), OK);
        c.addView(text((done ? "✅ " : n + ". ") + title, 17, true, done ? OK : Color.parseColor("#2B211B")));
        if (!done || n == 1) c.addView(text(desc, 13, false, Color.parseColor("#6E645C")));
        if (!done && btnLabel != null) c.addView(btn(btnLabel, on));
        root.addView(c);
    }

    void askPerms() {
        List<String> p = new ArrayList<>();
        p.add(Manifest.permission.RECEIVE_SMS);
        p.add(Manifest.permission.SEND_SMS);
        p.add(Manifest.permission.READ_CONTACTS);
        if (Build.VERSION.SDK_INT >= 33) p.add(Manifest.permission.POST_NOTIFICATIONS);
        requestPermissions(p.toArray(new String[0]), 1);
    }

    @Override
    public void onRequestPermissionsResult(int rc, String[] perms, int[] res) {
        build();
        if (!smsOk()) openAppInfo();   // '다시 묻지 않음' 상태면 앱 정보에서 직접 켜야 함
    }

    void openAppInfo() {
        startActivity(new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, Uri.parse("package:" + getPackageName())));
    }

    void askKey() {
        EditText e = new EditText(this);
        e.setInputType(InputType.TYPE_CLASS_TEXT);
        e.setHint("MES 설정 화면의 업무폰 연결 키");
        new android.app.AlertDialog.Builder(this).setTitle("연결 키 입력").setView(e)
            .setPositiveButton("저장", (d, w) -> {
                String k = e.getText().toString().trim();
                if (!k.isEmpty()) Hub.prefs(this).edit().putString("key", k).apply();
                build();
                PollService.start(this);
            }).setNegativeButton("취소", null).show();
    }

    void ping() {
        testRes.setText("확인 중…");
        Hub.IO.execute(() -> {
            String r;
            try {
                Map<String, String> p = new LinkedHashMap<>();
                p.put("action", "ping");
                Hub.post(this, p);
                Hub.prefs(this).edit().putLong("last_ok", System.currentTimeMillis()).putString("last_err", "").apply();
                r = "✅ 연결 성공 — MES 설정 화면에 '마지막 연결'이 표시됩니다";
            } catch (Exception e) {
                r = "❌ " + e.getMessage();
            }
            final String fr = r;
            runOnUiThread(() -> testRes.setText(fr));
        });
    }

    LinearLayout card() {
        LinearLayout c = new LinearLayout(this);
        c.setOrientation(LinearLayout.VERTICAL);
        c.setPadding(dp(16), dp(14), dp(16), dp(14));
        GradientDrawable g = new GradientDrawable();
        g.setColor(Color.WHITE);
        g.setCornerRadius(dp(14));
        g.setStroke(dp(1), Color.parseColor("#E9E2DC"));
        c.setBackground(g);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.topMargin = dp(12);
        c.setLayoutParams(lp);
        return c;
    }

    TextView text(String s, int sp, boolean bold, int color) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(color);
        t.setLineSpacing(0, 1.25f);
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD);
        t.setPadding(0, dp(4), 0, dp(2));
        return t;
    }

    Button btn(String s, View.OnClickListener on) {
        Button b = new Button(this);
        b.setText(s);
        b.setTextSize(15);
        b.setAllCaps(false);
        b.setTextColor(Color.WHITE);
        b.setGravity(Gravity.CENTER);
        GradientDrawable g = new GradientDrawable();
        g.setColor(ORANGE);
        g.setCornerRadius(dp(10));
        b.setBackground(g);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, dp(48));
        lp.topMargin = dp(10);
        b.setLayoutParams(lp);
        b.setOnClickListener(on);
        return b;
    }

    int dp(int v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    String ago(long t) {
        long m = (System.currentTimeMillis() - t) / 60000;
        return m < 1 ? "방금" : m < 60 ? m + "분 전" : (m / 60) + "시간 전";
    }

    String version() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "?";
        }
    }
}
