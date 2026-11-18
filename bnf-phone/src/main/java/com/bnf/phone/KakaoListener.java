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
import java.util.concurrent.ConcurrentHashMap;

/** 카톡 알림 → msg-hub(action=in, ch=kakao) → 답장 문구가 오면 알림의 [답장]으로 그 방에 보냄 */
public class KakaoListener extends NotificationListenerService {
    static final String KAKAO = "com.kakao.talk";
    /** 방 이름 → 그 방 마지막 알림의 [답장] 버튼. MES가 보낼 글(next_kakao)을 새 카톡 없이도 바로 그 방에 보낼 때 씀.
        앱이 다시 켜지면 비워지므로, 그 방에 카톡이 한 번 더 와야 다시 기억함 */
    static final Map<String, Notification.Action> ROOMS = new ConcurrentHashMap<>();

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
        // 단톡방 이름: 최근 카톡은 '숨김 대화 제목'(android.hiddenConversationTitle)에 넣음 → 그다음 대화 제목·부제목·요약, 없으면 1:1 이라 보낸 사람
        String conv = str(x.getCharSequence(Notification.EXTRA_CONVERSATION_TITLE));
        String hidden = str(x.getCharSequence("android.hiddenConversationTitle"));
        String sub = str(x.getCharSequence(Notification.EXTRA_SUB_TEXT));
        String summary = str(x.getCharSequence(Notification.EXTRA_SUMMARY_TEXT));
        boolean group = x.getBoolean("android.isGroupConversation", false);
        String room = !hidden.isEmpty() ? hidden : !conv.isEmpty() ? conv : !sub.isEmpty() ? sub : !summary.isEmpty() ? summary : title;
        final String dbg = "g=" + group + "|hid=" + hidden + "|conv=" + conv + "|sub=" + sub + "|sum=" + summary;
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
        if (replyAct != null) ROOMS.put(room, replyAct);
        final Notification.Action act = replyAct;
        final String fRoom = room, fTitle = title, fText = text;
        final Context c = getApplicationContext();
        Hub.IO.execute(() -> handle(c, fRoom, fTitle, fText, act, dbg));
    }

    static void handle(Context c, String room, String name, String text, Notification.Action act, String dbg) {
        try {
            Map<String, String> p = new LinkedHashMap<>();
            p.put("action", "in");
            p.put("fmt", "text");
            p.put("ch", "kakao");
            p.put("room", room);
            p.put("name", name);
            p.put("text", text);
            p.put("dbg", dbg);   // 방 이름이 어느 칸에 오는지 확인용(내용 아님)
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

    /** 기억해 둔 [답장] 버튼으로 그 방에 글을 보냄. 버튼이 만료됐으면 false */
    static boolean sendTo(Context c, String room, String text) {
        Notification.Action act = ROOMS.get(room);
        if (act == null) return false;
        try {
            Intent i = new Intent();
            Bundle res = new Bundle();
            for (RemoteInput ri : act.getRemoteInputs()) res.putCharSequence(ri.getResultKey(), text);
            RemoteInput.addResultsToIntent(act.getRemoteInputs(), i, res);
            act.actionIntent.send(c, 0, i);
            return true;
        } catch (Exception e) {
            ROOMS.remove(room);
            Hub.log(c, "⚠ 카톡 [" + room + "] 답장 버튼 만료 — 그 방에 카톡이 오면 다시 보냄");
            return false;
        }
    }

    static String str(CharSequence s) {
        return s == null ? "" : s.toString().trim();
    }
}
