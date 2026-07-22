import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnouncementForm, DeleteAnnouncementButton } from "@/components/admin/announcement-form";

export const dynamic = "force-dynamic";

export default async function AnnouncementsAdminPage() {
  await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();

  const [{ data: announcements }, { data: stores }, { data: brands }, { count: franchiseUserCount }] = await Promise.all([
    admin.from("announcements").select("*, announcement_targets(store_id, brand_id, delivery_zone), announcement_reads(profile_id)").order("created_at", { ascending: false }).limit(50),
    admin.from("stores").select("id, name").eq("is_active", true).order("name"),
    admin.from("brands").select("id, name").eq("is_active", true),
    admin.from("profiles").select("id", { count: "exact", head: true }).in("role", ["franchise_owner", "franchise_staff"]).eq("is_active", true),
  ]);

  return (
    <div>
      <h1 className="text-xl font-bold">공지사항</h1>

      <Card className="mt-4">
        <CardHeader><CardTitle>새 공지 등록</CardTitle></CardHeader>
        <CardContent>
          <AnnouncementForm stores={stores ?? []} brands={brands ?? []} />
        </CardContent>
      </Card>

      <div className="mt-4 space-y-3">
        {(announcements ?? []).map((a) => (
          <Card key={a.id} className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {a.is_pinned && <Badge className="bg-gray-100 text-gray-600">고정</Badge>}
                {a.is_important && <Badge className="bg-red-50 text-danger">중요</Badge>}
                <p className="font-bold">{a.title}</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted">
                <span>읽음 {(a.announcement_reads as unknown[]).length}/{franchiseUserCount ?? 0}명</span>
                <span>{formatDateTime(a.created_at)}</span>
                <DeleteAnnouncementButton id={a.id} />
              </div>
            </div>
            <p className="mt-2 line-clamp-2 whitespace-pre-wrap text-sm text-gray-600">{a.body}</p>
            <p className="mt-1.5 text-xs text-muted">
              대상: {a.target_all ? "전체" : (a.announcement_targets as { store_id?: string; brand_id?: string; delivery_zone?: string }[]).map((t) =>
                t.store_id ? (stores ?? []).find((s) => s.id === t.store_id)?.name : t.brand_id ? (brands ?? []).find((b) => b.id === t.brand_id)?.name : t.delivery_zone
              ).filter(Boolean).join(", ") || "없음"}
              {a.ends_at ? ` · 노출 종료 ${formatDateTime(a.ends_at)}` : ""}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
