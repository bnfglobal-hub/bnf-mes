package com.bnf.phone;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;

import org.json.JSONObject;

import java.util.LinkedHashMap;
import java.util.Map;

/** 상시 실행: 1분마다 MES 발송 대기열(action=next)을 받아 문자로 보내고 결과(ack)를 알린다. 서버엔 생존 신호도 됨 */
public class PollService extends Service {
    static final long EVERY = 60_000;
    final Handler h = new Handler(Looper.getMainLooper());
    PowerManager.WakeLock wl;

    static void start(Context c) {
        if (Hub.key(c).isEmpty()) return;
        try {
            c.startForegroundService(new Intent(c, PollService.class));
        } catch (Exception e) {
            Hub.log(c, "⚠ 백그라운드 시작 실패: " + e.getMessage());
        }
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        NotificationManager nm = getSystemService(NotificationManager.class);
        nm.createNotificationChannel(new NotificationChannel("run", "연결 유지", NotificationManager.IMPORTANCE_MIN));
        PendingIntent open = PendingIntent.getActivity(this, 0, new Intent(this, MainActivity.class), PendingIntent.FLAG_IMMUTABLE);
        Notification n = new Notification.Builder(this, "run")
            .setSmallIcon(android.R.drawable.stat_notify_chat)
            .setContentTitle("BNF 업무폰 연결 중")
            .setContentText("문자·카톡 주문을 MES로 보내고 있습니다")
            .setContentIntent(open)
            .setOngoing(true)
            .build();
        if (Build.VERSION.SDK_INT >= 34) startForeground(1, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_SPECIAL_USE);
        else startForeground(1, n);
        if (wl == null) {
            // 화면이 꺼져도 1분 간격을 지키도록 CPU만 깨워 둔다
            wl = getSystemService(PowerManager.class).newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "bnf:poll");
            wl.setReferenceCounted(false);
            wl.acquire();
        }
        h.removeCallbacks(tick);
        h.post(tick);
        return START_STICKY;
    }

    final Runnable tick = new Runnable() {
        @Override
        public void run() {
            final Context c = getApplicationContext();
            Hub.IO.execute(() -> pollOnce(c));
            h.postDelayed(this, EVERY);
        }
    };

    static void pollOnce(Context c) {
        // 한 번에 최대 10건까지 연달아 처리
        for (int k = 0; k < 10; k++) {
            try {
                Map<String, String> p = new LinkedHashMap<>();
                p.put("action", "next");
                JSONObject j = new JSONObject(Hub.post(c, p));
                Hub.prefs(c).edit().putLong("last_ok", System.currentTimeMillis()).putString("last_err", "").apply();
                long id = j.optLong("id", 0);
                if (id <= 0) return;
                String to = j.optString("to", ""), text = j.optString("text", "");
                boolean ok = true;
                try {
                    Hub.sendSms(c, to, text);
                    Hub.log(c, "📤 MES 문자 발송 " + to + " " + Hub.cut(text, 18));
                } catch (Exception e) {
                    ok = false;
                    Hub.log(c, "⚠ MES 문자 발송 실패 " + to + ": " + e.getMessage());
                }
                Map<String, String> a = new LinkedHashMap<>();
                a.put("action", "ack");
                a.put("id", String.valueOf(id));
                a.put("ok", ok ? "1" : "0");
                Hub.post(c, a);
            } catch (Exception e) {
                Hub.prefs(c).edit().putString("last_err", String.valueOf(e.getMessage())).apply();
                return;
            }
        }
    }

    @Override
    public void onDestroy() {
        h.removeCallbacks(tick);
        if (wl != null && wl.isHeld()) wl.release();
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
