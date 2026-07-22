import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ROLE_LABEL } from "@/lib/constants";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCreateForm, UserRowControls } from "@/components/admin/user-controls";

export const dynamic = "force-dynamic";

export default async function UsersAdminPage() {
  const me = await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  const [{ data: users }, { data: stores }] = await Promise.all([
    admin.from("profiles").select("*, stores(name)").order("created_at", { ascending: false }).limit(200),
    admin.from("stores").select("id, name").eq("is_active", true).order("name"),
  ]);

  return (
    <div>
      <h1 className="text-xl font-bold">사용자·권한</h1>

      <Card className="mt-4">
        <CardHeader><CardTitle>새 계정 생성</CardTitle></CardHeader>
        <CardContent>
          <UserCreateForm stores={stores ?? []} isSuperAdmin={me.role === "super_admin"} />
        </CardContent>
      </Card>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead><tr className="border-b border-border bg-gray-50/60 text-left text-xs text-muted">
            <th className="px-3 py-2.5">아이디</th><th className="px-3 py-2.5">이름</th><th className="px-3 py-2.5">역할</th>
            <th className="px-3 py-2.5">소속 가맹점</th><th className="px-3 py-2.5">생성일</th><th className="px-3 py-2.5">상태</th><th className="px-3 py-2.5"></th>
          </tr></thead>
          <tbody>
            {(users ?? []).map((u) => (
              <tr key={u.id} className="border-b border-gray-50">
                <td className="px-3 py-2.5 font-mono text-xs">{u.username}</td>
                <td className="px-3 py-2.5 font-medium">{u.full_name}</td>
                <td className="px-3 py-2.5">{ROLE_LABEL[u.role]}</td>
                <td className="px-3 py-2.5">{(u.stores as { name?: string } | null)?.name ?? "-"}</td>
                <td className="px-3 py-2.5 text-xs text-muted">{formatDateTime(u.created_at)}</td>
                <td className="px-3 py-2.5">{u.is_active ? <Badge className="bg-emerald-50 text-emerald-600">활성</Badge> : <Badge className="bg-gray-100 text-gray-500">중지</Badge>}</td>
                <td className="px-3 py-2.5">
                  {u.id !== me.id && <UserRowControls userId={u.id} isActive={u.is_active} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
