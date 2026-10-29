package com.bnf.phone;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** 휴대폰을 껐다 켜거나 앱이 업데이트되면 자동으로 다시 연결 */
public class BootReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context c, Intent intent) {
        PollService.start(c.getApplicationContext());
    }
}
