import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";
import { CLAIM_TYPE_LABEL, CLAIM_STATUS_LABEL, CLAIM_RESOLUTION_LABEL } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ClaimAdminControls } from "@/components/admin/claim-admin-controls";

export const dynamic = "force-dynamic";

export default async function ClaimsAdminPage() {
  await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  const { data: claims } = await admin
    .from("claims")
    .select("*, orders(order_no), stores(name), claim_items(qty, products(name))")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-xl font-bold">클레임관리</h1>
      {(claims ?? []).length === 0 ? (
        <p className="mt-6 rounded-2xl border border-border bg-white py-16 text-center text-gray-400">접수된 클레임이 없습니다.</p>
      ) : (
        <div className="mt-4 space-y-3">
          {(claims ?? []).map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{c.claim_no}</p>
                  <Badge className="bg-gray-100 text-gray-600">{CLAIM_TYPE_LABEL[c.claim_type]}</Badge>
                  <Badge className={c.status === "RESOLVED" ? "bg-emerald-50 text-emerald-600" : c.status === "REJECTED" ? "bg-red-50 text-danger" : "bg-orange-50 text-orange-600"}>
                    {CLAIM_STATUS_LABEL[c.status]}
                  </Badge>
                  {c.resolution && <span className="text-xs text-muted">희망: {CLAIM_RESOLUTION_LABEL[c.resolution]}</span>}
                </div>
                <span className="text-xs text-muted">{formatDateTime(c.created_at)}</span>
              </div>
              <p className="mt-1.5 text-sm">
                <b>{(c.stores as { name?: string } | null)?.name}</b> · {(c.orders as { order_no?: string } | null)?.order_no} — {c.reason}
              </p>
              {(c.claim_items as { qty: number; products: { name?: string } | null }[]).length > 0 && (
                <p className="mt-1 text-xs text-muted">
                  대상: {(c.claim_items as { qty: number; products: { name?: string } | null }[]).map((ci) => `${ci.products?.name ?? "?"} ${ci.qty}개`).join(", ")}
                </p>
              )}
              {c.detail && <p className="mt-1.5 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600">{c.detail}</p>}
              <div className="mt-3 border-t border-gray-50 pt-3">
                <ClaimAdminControls claimId={c.id} status={c.status} adminNote={c.admin_note} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
