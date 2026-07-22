import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";
import { ERP_STATUS_LABEL, ERP_STATUS_COLOR } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EcountControls, RetryJobButton } from "@/components/admin/ecount-controls";

export const dynamic = "force-dynamic";

export default async function EcountPage() {
  await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();

  const mode = process.env.ECOUNT_SYNC_ENABLED === "true" && process.env.ECOUNT_MODE === "REAL" ? "REAL" : "MOCK";

  const [{ data: jobs }, { data: logs }] = await Promise.all([
    admin.from("ecount_sync_jobs").select("*, orders(order_no, stores(name))").order("created_at", { ascending: false }).limit(50),
    admin.from("ecount_sync_logs").select("*").order("created_at", { ascending: false }).limit(30),
  ]);

  return (
    <div>
      <h1 className="text-xl font-bold">이카운트 연동</h1>

      <Card className="mt-4">
        <CardHeader><CardTitle>연동 상태</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-3">
            <Badge className={mode === "REAL" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-700"}>
              {mode === "REAL" ? "실제 이카운트 연동" : "Mock 모드 (실전송 안함)"}
            </Badge>
            <p className="text-sm text-muted">
              모드 전환은 서버 환경변수 <code className="rounded bg-gray-100 px-1">ECOUNT_MODE=REAL</code>,{" "}
              <code className="rounded bg-gray-100 px-1">ECOUNT_SYNC_ENABLED=true</code> 로 설정합니다. (docs/ECOUNT_INTEGRATION.md 참고)
            </p>
          </div>
          <div className="mt-3">
            <EcountControls />
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>전송 작업 큐 (최근 50건)</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead><tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-2 pr-3">주문번호</th><th className="py-2 pr-3">가맹점</th><th className="py-2 pr-3">유형</th>
              <th className="py-2 pr-3">상태</th><th className="py-2 pr-3">시도</th><th className="py-2 pr-3">전표번호</th>
              <th className="py-2 pr-3">오류</th><th className="py-2 pr-3">다음 재시도</th><th className="py-2"></th>
            </tr></thead>
            <tbody>
              {(jobs ?? []).length === 0 && <tr><td colSpan={9} className="py-10 text-center text-gray-400">전송 작업이 없습니다.</td></tr>}
              {(jobs ?? []).map((j) => (
                <tr key={j.id} className="border-b border-gray-50">
                  <td className="py-2 pr-3 font-semibold">{(j.orders as { order_no?: string } | null)?.order_no ?? "-"}</td>
                  <td className="py-2 pr-3">{(j.orders as { stores?: { name?: string } | null } | null)?.stores?.name ?? "-"}</td>
                  <td className="py-2 pr-3 text-xs">{j.job_type}</td>
                  <td className="py-2 pr-3"><Badge className={ERP_STATUS_COLOR[j.status]}>{ERP_STATUS_LABEL[j.status]}</Badge></td>
                  <td className="py-2 pr-3">{j.attempts}/{j.max_attempts}</td>
                  <td className="py-2 pr-3 text-xs">{j.ecount_doc_no ?? "-"}</td>
                  <td className="max-w-[220px] truncate py-2 pr-3 text-xs text-danger" title={j.last_error_message ?? ""}>{j.last_error_message ?? "-"}</td>
                  <td className="py-2 pr-3 text-xs text-muted">{j.status === "RETRYING" && j.next_retry_at ? formatDateTime(j.next_retry_at) : "-"}</td>
                  <td className="py-2">
                    {["FAILED", "RETRYING", "MANUAL_REVIEW"].includes(j.status) && <RetryJobButton jobId={j.id} />}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>동기화 로그 (민감정보 마스킹, 최근 30건)</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-1 text-xs">
            {(logs ?? []).length === 0 && <p className="py-6 text-center text-sm text-gray-400">로그가 없습니다.</p>}
            {(logs ?? []).map((l) => (
              <li key={l.id} className="flex items-start gap-2 border-b border-gray-50 py-1.5">
                <span className={`shrink-0 rounded px-1.5 py-0.5 font-semibold ${l.direction === "REQUEST" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"}`}>{l.direction}</span>
                <span className="min-w-0 flex-1 truncate text-gray-600" title={JSON.stringify(l.masked_payload)}>{l.summary}</span>
                <span className="shrink-0 text-gray-400">{formatDateTime(l.created_at)}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
