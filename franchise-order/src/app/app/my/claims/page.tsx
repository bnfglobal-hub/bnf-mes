import Link from "next/link";
import { ChevronLeft, MessageSquareWarning } from "lucide-react";
import { requireFranchise } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";
import { CLAIM_TYPE_LABEL, CLAIM_STATUS_LABEL } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function MyClaimsPage() {
  const profile = await requireFranchise();
  const admin = createAdminClient();
  const { data: claims } = await admin
    .from("claims")
    .select("*, orders(order_no)")
    .eq("store_id", profile.store_id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="px-4 pt-4">
      <div className="flex items-center gap-2">
        <Link href="/app/my" className="rounded-full p-1.5" aria-label="뒤로"><ChevronLeft size={22} /></Link>
        <h1 className="text-lg font-bold">클레임 내역</h1>
      </div>
      {(claims ?? []).length === 0 ? (
        <div className="flex flex-col items-center py-24 text-gray-400">
          <MessageSquareWarning size={44} strokeWidth={1.2} />
          <p className="mt-3 text-sm">클레임 내역이 없습니다.</p>
          <p className="mt-1 text-xs">주문 상세에서 클레임을 등록할 수 있습니다.</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-2 pb-6">
          {(claims ?? []).map((c) => (
            <li key={c.id} className="rounded-2xl border border-border bg-white p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">{c.claim_no}</p>
                <Badge className={c.status === "RESOLVED" ? "bg-emerald-50 text-emerald-600" : c.status === "REJECTED" ? "bg-red-50 text-danger" : "bg-orange-50 text-orange-600"}>
                  {CLAIM_STATUS_LABEL[c.status]}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-muted">
                {c.orders?.order_no} · {CLAIM_TYPE_LABEL[c.claim_type]} · {formatDateTime(c.created_at)}
              </p>
              <p className="mt-1.5 text-sm">{c.reason}</p>
              {c.admin_note && <p className="mt-1.5 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-600">본사: {c.admin_note}</p>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
