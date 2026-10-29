package com.bnf.phone;

import android.app.Notification;
import android.app.RemoteInput;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;

import java.util.LinkedHashMap;
import java.util.Map;

/** 카톡 알림 → msg-hub(action=in, ch=kakao) → 답장 문구가 오면 알림의 [답장]으로 그 방에 보냄 */
public class KakaoListener extends NotificationListenerService {
    static final String KAKAO = "com.kakao.talk";

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null || !KAKAO.equals(sbn.getPackageName())) return;
        if (!Hub.prefs(this).getBoolean("kakao_on", true)) return;
        Notification n = sbn.getNotification();
        if (n == null || (n.flags & Notification.FLAG_GROUP_SUMMARY) != 0) return;
        Bundle x = n.extras;
        if (x == null) return;
        String title = str(x.getCharSequence(Notification.EXTRA_TITLE));
        String text = str(x.getCharSequence(Notification.EXTRA_TEXT));
        // 단톡방은 방 이름이 부제목/대화 제목에, 1:1은 제목(보낸 사람)이 곧 방 이름
        String room = str(x.getCharSequence(Notification.EXTRA_CONVERSATION_TITLE));
        if (room.isEmpty()) room = str(x.getCharSequence(Notification.EXTRA_SUB_TEXT));
        if (room.isEmpty()) room = title;
        if (text.isEmpty() || room.isEmpty()) return;

        Notification.Action replyAct = null;
        if (n.actions != null) {
            for (Notification.Action a : n.actions) {
                if (a != null && a.getRemoteInputs() != null && a.getRemoteInputs().length > 0) {
                    replyAct = a;
                    break;
                }
            }
        }
        final Notification.Action act = replyAct;
        final String fRoom = room, fTitle = title, fText = text;
        final Context c = getApplicationContext();
        Hub.IO.execute(() -> handle(c, fRoom, fTitle, fText, act));
    }

    static void handle(Context c, String room, String name, String text, Notification.Action act) {
        try {
            Map<String, String> p = new LinkedHashMap<>();
            p.put("action", "in");
            p.put("fmt", "text");
            p.put("ch", "kakao");
            p.put("room", room);
            p.put("name", name);
            p.put("text", text);
            String reply = Hub.post(c, p).trim();
            if (reply.isEmpty()) return;   // 주문 아닌 카톡은 기록도 안 남김(사적 대화)
            if (act == null) {
                Hub.log(c, "⚠ 카톡 주문 접수 [" + room + "] — 답장 버튼이 없어 답장 못 보냄");
                return;
            }
            Intent i = new Intent();
            Bundle res = new Bundle();
            for (RemoteInput ri : act.getRemoteInputs()) res.putCharSequence(ri.getResultKey(), reply);
            RemoteInput.addResultsToIntent(act.getRemoteInputs(), i, res);
            act.actionIntent.send(c, 0, i);
            Hub.log(c, "💬 카톡 주문 접수 [" + room + "] → 답장 보냄");
        } catch (Exception e) {
            Hub.log(c, "⚠ 카톡 처리 실패 [" + room + "]: " + e.getMessage());
        }
    }

    static String str(CharSequence s) {
        return s == null ? "" : s.toString().trim();
    }
}
