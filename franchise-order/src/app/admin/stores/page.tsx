import Link from "next/link";
import { revalidatePath } from "next/cache";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { auditLog } from "@/lib/audit";

export const dynamic = "force-dynamic";

async function createStore(formData: FormData) {
  "use server";
  const profile = await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  const name = String(formData.get("name") ?? "").trim();
  const storeCode = String(formData.get("store_code") ?? "").trim();
  if (!name || !storeCode) return;
  const { data } = await admin.from("stores").insert({
    name,
    store_code: storeCode,
    brand_id: String(formData.get("brand_id") ?? "") || null,
    ecount_customer_code: String(formData.get("ecount_customer_code") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    address1: String(formData.get("address1") ?? "").trim() || null,
    min_order_amount: Number(formData.get("min_order_amount") ?? 0) || 0,
    delivery_fee: Number(formData.get("delivery_fee") ?? 0) || 0,
    default_warehouse_id: String(formData.get("warehouse_id") ?? "") || null,
    created_by: profile.id,
  }).select("id").single();
  await auditLog({ actorId: profile.id, actorName: profile.full_name, action: "STORE_CREATE", entity: "stores", entityId: data?.id, after: { name, storeCode } });
  revalidatePath("/admin/stores");
}

export default async function StoresAdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requireRole(ADMIN_ROLES);
  const { q } = await searchParams;
  const admin = createAdminClient();
  let query = admin.from("stores").select("*, brands(name), warehouses(name)").order("name").limit(200);
  if (q) query = query.or(`name.ilike.%${q}%,store_code.ilike.%${q}%`);
  const [{ data: stores }, { data: brands }, { data: warehouses }] = await Promise.all([
    query,
    admin.from("brands").select("id, name").eq("is_active", true),
    admin.from("warehouses").select("id, name").eq("is_active", true),
  ]);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">가맹점관리</h1>
        <form method="get" className="flex gap-2">
          <Input name="q" defaultValue={q} placeholder="상호/고객코드 검색" className="h-10 w-56" />
          <Button type="submit" size="sm" className="h-10">검색</Button>
        </form>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead><tr className="border-b border-border bg-gray-50/60 text-left text-xs text-muted">
            <th className="px-3 py-2.5">고객코드</th><th className="px-3 py-2.5">상호</th><th className="px-3 py-2.5">브랜드</th>
            <th className="px-3 py-2.5">거래처코드</th><th className="px-3 py-2.5 text-right">최소주문</th>
            <th className="px-3 py-2.5">출고창고</th><th className="px-3 py-2.5">상태</th><th className="px-3 py-2.5"></th>
          </tr></thead>
          <tbody>
            {(stores ?? []).length === 0 && <tr><td colSpan={8} className="py-12 text-center text-gray-400">가맹점이 없습니다.</td></tr>}
            {(stores ?? []).map((s) => (
              <tr key={s.id} className="border-b border-gray-50 hover:bg-orange-50/30">
                <td className="px-3 py-2.5 font-mono text-xs">{s.store_code}</td>
                <td className="px-3 py-2.5 font-medium">{s.name}</td>
                <td className="px-3 py-2.5">{(s.brands as { name?: string } | null)?.name ?? "-"}</td>
                <td className="px-3 py-2.5 text-gray-500">{s.ecount_customer_code ?? <span className="text-amber-600">미지정</span>}</td>
                <td className="px-3 py-2.5 text-right">{formatNumber(Number(s.min_order_amount))}원</td>
                <td className="px-3 py-2.5">{(s.warehouses as { name?: string } | null)?.name ?? "-"}</td>
                <td className="px-3 py-2.5">
                  {!s.is_active ? <Badge className="bg-gray-100 text-gray-500">비활성</Badge>
                    : s.order_blocked ? <Badge className="bg-red-50 text-danger">주문차단</Badge>
                    : s.is_dormant ? <Badge className="bg-amber-50 text-amber-700">휴면</Badge>
                    : <Badge className="bg-emerald-50 text-emerald-600">정상</Badge>}
                </td>
                <td className="px-3 py-2.5"><Link href={`/admin/stores/${s.id}`} className="text-primary hover:underline">관리</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <form action={createStore} className="mt-5 rounded-2xl border border-border bg-white p-4">
        <h2 className="mb-3 text-[15px] font-bold">새 가맹점 등록</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div><Label>상호 *</Label><Input name="name" required maxLength={100} /></div>
          <div><Label>고객 고유코드 *</Label><Input name="store_code" required maxLength={20} placeholder="예: GN001" /></div>
          <div><Label>브랜드</Label>
            <Select name="brand_id" defaultValue="">
              <option value="">선택 안함</option>
              {(brands ?? []).map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </Select>
          </div>
          <div><Label>이카운트 거래처코드</Label><Input name="ecount_customer_code" maxLength={30} /></div>
          <div><Label>전화번호</Label><Input name="phone" maxLength={20} /></div>
          <div className="col-span-2"><Label>주소</Label><Input name="address1" maxLength={200} /></div>
          <div><Label>기본 출고창고</Label>
            <Select name="warehouse_id" defaultValue="">
              <option value="">선택 안함</option>
              {(warehouses ?? []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </Select>
          </div>
          <div><Label>최소 주문금액(원)</Label><Input name="min_order_amount" type="number" min={0} defaultValue={0} /></div>
          <div><Label>배송비(원)</Label><Input name="delivery_fee" type="number" min={0} defaultValue={0} /></div>
        </div>
        <Button type="submit" className="mt-4">가맹점 등록</Button>
      </form>
    </div>
  );
}
