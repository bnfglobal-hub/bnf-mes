package com.bnf.phone;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.provider.Telephony;
import android.telephony.SmsMessage;

import java.util.LinkedHashMap;
import java.util.Map;

/** 문자 수신 → msg-hub(action=in) → 답장 문구가 오면 그 번호로 문자 */
public class SmsReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context ctx, Intent intent) {
        if (!Telephony.Sms.Intents.SMS_RECEIVED_ACTION.equals(intent.getAction())) return;
        SmsMessage[] msgs = Telephony.Sms.Intents.getMessagesFromIntent(intent);
        if (msgs == null || msgs.length == 0) return;
        // 긴 문자는 여러 조각으로 오므로 보낸 번호별로 이어 붙인다
        Map<String, StringBuilder> byFrom = new LinkedHashMap<>();
        for (SmsMessage m : msgs) {
            if (m == null) continue;
            String from = m.getDisplayOriginatingAddress();
            byFrom.computeIfAbsent(from, k -> new StringBuilder()).append(m.getMessageBody());
        }
        final Context c = ctx.getApplicationContext();
        final PendingResult pr = goAsync();
        Hub.IO.execute(() -> {
            try {
                for (Map.Entry<String, StringBuilder> e : byFrom.entrySet()) handle(c, e.getKey(), e.getValue().toString());
            } finally {
                pr.finish();
            }
        });
    }

    static void handle(Context c, String from, String text) {
        try {
            Map<String, String> p = new LinkedHashMap<>();
            p.put("action", "in");
            p.put("fmt", "text");
            p.put("ch", "sms");
            p.put("from", from);
            p.put("name", Hub.contactName(c, from));
            p.put("text", text);
            String reply = Hub.post(c, p).trim();
            if (reply.isEmpty()) {
                Hub.log(c, "문자 " + from + " (주문 아님) " + Hub.cut(text, 20));
                return;
            }
            Hub.sendSms(c, from, reply);
            Hub.log(c, "📩 문자 주문 접수 " + from + " → 답장 보냄");
        } catch (Exception e) {
            Hub.log(c, "⚠ 문자 처리 실패 " + from + ": " + e.getMessage());
        }
    }
}
