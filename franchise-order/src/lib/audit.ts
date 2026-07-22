import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export async function auditLog(args: {
  actorId?: string | null;
  actorName?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  before?: unknown;
  after?: unknown;
}): Promise<void> {
  const admin = createAdminClient();
  await admin.from("audit_logs").insert({
    actor_id: args.actorId ?? null,
    actor_name: args.actorName ?? null,
    action: args.action,
    entity: args.entity,
    entity_id: args.entityId ?? null,
    before_data: (args.before as object) ?? null,
    after_data: (args.after as object) ?? null,
  });
}
