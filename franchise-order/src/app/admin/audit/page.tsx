import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireRole(["super_admin"]);
  const { q } = await searchParams;
  const admin = createAdminClient();
  let query = admin.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(200);
  if (q) query = query.or(`action.ilike.%${q}%,entity.ilike.%${q}%,actor_name.ilike.%${q}%`);
  const { data: logs } = await query;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">감사로그</h1>
        <form method="get" className="flex gap-2">
          <input name="q" defaultValue={q} placeholder="액션/대상/사용자 검색" className="h-10 w-56 rounded-lg border border-border bg-white px-3 text-sm" />
          <button className="h-10 rounded-lg bg-primary px-4 text-sm font-semibold text-white">검색</button>
        </form>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[880px] text-sm">
          <thead><tr className="border-b border-border bg-gray-50/60 text-left text-xs text-muted">
            <th className="px-3 py-2.5">일시</th><th className="px-3 py-2.5">사용자</th><th className="px-3 py-2.5">액션</th>
            <th className="px-3 py-2.5">대상</th><th className="px-3 py-2.5">변경 전</th><th className="px-3 py-2.5">변경 후</th>
          </tr></thead>
          <tbody>
            {(logs ?? []).length === 0 && <tr><td colSpan={6} className="py-12 text-center text-gray-400">로그가 없습니다.</td></tr>}
            {(logs ?? []).map((l) => (
              <tr key={l.id} className="border-b border-gray-50 align-top">
                <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-500">{formatDateTime(l.created_at)}</td>
                <td className="px-3 py-2">{l.actor_name ?? l.actor_id?.slice(0, 8) ?? "시스템"}</td>
                <td className="px-3 py-2 font-mono text-xs">{l.action}</td>
                <td className="px-3 py-2 font-mono text-xs">{l.entity}{l.entity_id ? `#${String(l.entity_id).slice(0, 8)}` : ""}</td>
                <td className="max-w-[240px] px-3 py-2 text-xs text-gray-500"><pre className="whitespace-pre-wrap break-all">{l.before_data ? JSON.stringify(l.before_data) : "-"}</pre></td>
                <td className="max-w-[240px] px-3 py-2 text-xs text-gray-500"><pre className="whitespace-pre-wrap break-all">{l.after_data ? JSON.stringify(l.after_data) : "-"}</pre></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
