import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

type NotificationType =
  | "ORDER_PLACED" | "ORDER_CONFIRMED" | "ORDER_REJECTED" | "ORDER_UPDATED" | "ORDER_CANCELLED"
  | "SHIPPED" | "DELIVERED" | "ERP_FAILED" | "LOW_STOCK" | "ANNOUNCEMENT" | "CLAIM";

export interface NotifyInput {
  profileIds: string[];
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

/** 알림 채널 추상화 — 현재 IN_APP + Mock 외부채널. 알림톡/SMS 는 provider 추가로 확장. */
export interface NotificationProvider {
  channel: string;
  send(input: { recipient: string; title: string; body?: string }): Promise<{ ok: boolean; error?: string }>;
}

export class MockProvider implements NotificationProvider {
  constructor(public channel: string) {}
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- 실제 발송 provider 구현 시 사용
  async send(_input: { recipient: string; title: string; body?: string }): Promise<{ ok: boolean; error?: string }> {
    return { ok: true }; // 실제 발송 없음 — notification_logs에 기록만
  }
}

export async function notify(input: NotifyInput): Promise<void> {
  const admin = createAdminClient();
  if (input.profileIds.length === 0) return;
  await admin.from("notifications").insert(
    input.profileIds.map((pid) => ({
      profile_id: pid, type: input.type, title: input.title, body: input.body ?? null, link: input.link ?? null,
    }))
  );
  // 외부 채널(Mock) 로그
  const provider = new MockProvider("MOCK");
  const r = await provider.send({ recipient: input.profileIds.join(","), title: input.title, body: input.body });
  await admin.from("notification_logs").insert({
    channel: provider.channel, recipient: `${input.profileIds.length}명`, title: input.title, body: input.body ?? null,
    status: r.ok ? "SENT" : "FAILED", error: r.error ?? null,
  });
}

/** 본사 관리자 전원에게 알림 */
export async function notifyAdmins(type: NotificationType, title: string, body?: string, link?: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id").in("role", ["super_admin", "hq_admin"]).eq("is_active", true);
  await notify({ profileIds: (data ?? []).map((p) => p.id), type, title, body, link });
}

/** 특정 가맹점 사용자 전원에게 알림 */
export async function notifyStore(storeId: string, type: NotificationType, title: string, body?: string, link?: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id").eq("store_id", storeId).eq("is_active", true);
  await notify({ profileIds: (data ?? []).map((p) => p.id), type, title, body, link });
}
