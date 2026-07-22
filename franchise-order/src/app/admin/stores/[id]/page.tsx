import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ChevronLeft } from "lucide-react";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { auditLog } from "@/lib/audit";
import { formatNumber } from "@/lib/utils";
import { STORAGE_LABEL, STORAGE_COLOR, ROLE_LABEL, DOW_LABEL } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

async function updateStore(formData: FormData) {
  "use server";
  const profile = await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  const { data: before } = await admin.from("stores").select("*").eq("id", id).single();
  if (!before) return;
  const deliveryDays = [0, 1, 2, 3, 4, 5, 6].filter((d) => formData.get(`dd_${d}`) === "on");
  const patch = {
    name: String(formData.get("name") ?? "").trim(),
    store_code: String(formData.get("store_code") ?? "").trim(),
    ecount_customer_code: String(formData.get("ecount_customer_code") ?? "").trim() || null,
    biz_no: String(formData.get("biz_no") ?? "").trim() || null,
    ceo_name: String(formData.get("ceo_name") ?? "").trim() || null,
    manager_name: String(formData.get("manager_name") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    email: String(formData.get("email") ?? "").trim() || null,
    postal_code: String(formData.get("postal_code") ?? "").trim() || null,
    address1: String(formData.get("address1") ?? "").trim() || null,
    address2: String(formData.get("address2") ?? "").trim() || null,
    delivery_note: String(formData.get("delivery_note") ?? "").trim() || null,
    delivery_zone: String(formData.get("delivery_zone") ?? "").trim() || null,
    default_warehouse_id: String(formData.get("warehouse_id") ?? "") || null,
    delivery_days: deliveryDays.length ? deliveryDays : [1, 2, 3, 4, 5],
    order_cutoff: String(formData.get("order_cutoff") ?? "15:00"),
    min_order_amount: Number(formData.get("min_order_amount") ?? 0) || 0,
    min_amount_basis: String(formData.get("min_amount_basis") ?? "SUPPLY"),
    delivery_fee: Number(formData.get("delivery_fee") ?? 0) || 0,
    free_delivery_threshold: formData.get("free_delivery_threshold") ? Number(formData.get("free_delivery_threshold")) : null,
    payment_terms: String(formData.get("payment_terms") ?? "").trim() || null,
    is_active: formData.get("is_active") === "on",
    order_blocked: formData.get("order_blocked") === "on",
    is_dormant: formData.get("is_dormant") === "on",
    admin_memo: String(formData.get("admin_memo") ?? "").trim() || null,
    updated_by: profile.id,
  };
  await admin.from("stores").update(patch).eq("id", id);
  await auditLog({
    actorId: profile.id, actorName: profile.full_name, action: "STORE_UPDATE", entity: "stores", entityId: id,
    before: { min_order_amount: before.min_order_amount, order_blocked: before.order_blocked, is_active: before.is_active },
    after: { min_order_amount: patch.min_order_amount, order_blocked: patch.order_blocked, is_active: patch.is_active },
  });
  revalidatePath(`/admin/stores/${id}`);
}

async function toggleStoreProduct(formData: FormData) {
  "use server";
  const profile = await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  const storeId = String(formData.get("store_id"));
  const productId = String(formData.get("product_id"));
  const mapped = formData.get("mapped") === "1";
  if (mapped) {
    await admin.from("store_products").delete().eq("store_id", storeId).eq("product_id", productId);
  } else {
    await admin.from("store_products").insert({ store_id: storeId, product_id: productId, created_by: profile.id });
  }
  await auditLog({ actorId: profile.id, actorName: profile.full_name, action: mapped ? "STORE_PRODUCT_REMOVE" : "STORE_PRODUCT_ADD", entity: "store_products", entityId: `${storeId}:${productId}` });
  revalidatePath(`/admin/stores/${storeId}`);
}

async function updateStoreProduct(formData: FormData) {
  "use server";
  const profile = await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  const id = String(formData.get("sp_id"));
  const storeId = String(formData.get("store_id"));
  const { data: before } = await admin.from("store_products").select("custom_price, is_soldout, is_visible").eq("id", id).single();
  const patch = {
    custom_price: formData.get("custom_price") ? Number(formData.get("custom_price")) : null,
    min_order_qty: formData.get("min_order_qty") ? Number(formData.get("min_order_qty")) : null,
    max_order_qty: formData.get("max_order_qty") ? Number(formData.get("max_order_qty")) : null,
    is_visible: formData.get("is_visible") === "on",
    is_soldout: formData.get("is_soldout") === "on",
    updated_by: profile.id,
  };
  await admin.from("store_products").update(patch).eq("id", id);
  await auditLog({ actorId: profile.id, actorName: profile.full_name, action: "STORE_PRODUCT_UPDATE", entity: "store_products", entityId: id, before: before ?? undefined, after: patch });
  revalidatePath(`/admin/stores/${storeId}`);
}

export default async function StoreDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const { tab = "info" } = await searchParams;
  await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();

  const [{ data: store }, { data: warehouses }] = await Promise.all([
    admin.from("stores").select("*, brands(name)").eq("id", id).single(),
    admin.from("warehouses").select("id, name").eq("is_active", true),
  ]);
  if (!store) notFound();

  const TABS = [
    { key: "info", label: "기본 정보" },
    { key: "products", label: "취급상품·단가" },
    { key: "users", label: "사용자" },
  ];

  return (
    <div>
      <div className="flex items-center gap-2">
        <Link href="/admin/stores" className="rounded-full p-1.5 hover:bg-gray-100" aria-label="뒤로"><ChevronLeft size={20} /></Link>
        <h1 className="text-xl font-bold">{store.name}</h1>
        <span className="font-mono text-xs text-muted">{store.store_code}</span>
        {(store.brands as { name?: string } | null)?.name && <Badge className="bg-gray-100 text-gray-600">{(store.brands as { name?: string }).name}</Badge>}
      </div>

      <div className="mt-4 flex gap-1.5">
        {TABS.map((t) => (
          <Link key={t.key} href={`/admin/stores/${id}?tab=${t.key}`}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === t.key ? "bg-primary text-white" : "bg-white text-gray-600 border border-border"}`}>
            {t.label}
          </Link>
        ))}
      </div>

      {tab === "info" && (
        <form action={updateStore} className="mt-4 rounded-2xl border border-border bg-white p-5">
          <input type="hidden" name="id" value={store.id} />
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div><Label>상호 *</Label><Input name="name" required defaultValue={store.name} /></div>
            <div><Label>고객 고유코드 *</Label><Input name="store_code" required defaultValue={store.store_code} /></div>
            <div><Label>이카운트 거래처코드</Label><Input name="ecount_customer_code" defaultValue={store.ecount_customer_code ?? ""} /></div>
            <div><Label>사업자번호</Label><Input name="biz_no" defaultValue={store.biz_no ?? ""} /></div>
            <div><Label>대표자</Label><Input name="ceo_name" defaultValue={store.ceo_name ?? ""} /></div>
            <div><Label>담당자</Label><Input name="manager_name" defaultValue={store.manager_name ?? ""} /></div>
            <div><Label>전화번호</Label><Input name="phone" defaultValue={store.phone ?? ""} /></div>
            <div><Label>이메일</Label><Input name="email" type="email" defaultValue={store.email ?? ""} /></div>
            <div><Label>우편번호</Label><Input name="postal_code" defaultValue={store.postal_code ?? ""} /></div>
            <div className="col-span-2"><Label>기본 배송지</Label><Input name="address1" defaultValue={store.address1 ?? ""} /></div>
            <div><Label>상세 배송지</Label><Input name="address2" defaultValue={store.address2 ?? ""} /></div>
            <div className="col-span-2"><Label>배송 요청사항</Label><Input name="delivery_note" defaultValue={store.delivery_note ?? ""} /></div>
            <div><Label>배송 권역</Label><Input name="delivery_zone" defaultValue={store.delivery_zone ?? ""} placeholder="예: 강남" /></div>
            <div><Label>기본 출고창고</Label>
              <Select name="warehouse_id" defaultValue={store.default_warehouse_id ?? ""}>
                <option value="">선택 안함</option>
                {(warehouses ?? []).map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </Select>
            </div>
            <div><Label>주문 마감시간</Label><Input name="order_cutoff" type="time" defaultValue={String(store.order_cutoff).slice(0, 5)} /></div>
            <div><Label>최소 주문금액(원)</Label><Input name="min_order_amount" type="number" min={0} defaultValue={Number(store.min_order_amount)} /></div>
            <div><Label>최소금액 기준</Label>
              <Select name="min_amount_basis" defaultValue={store.min_amount_basis}>
                <option value="SUPPLY">공급가 기준</option><option value="WITH_VAT">VAT 포함 기준</option>
              </Select>
            </div>
            <div><Label>배송비(원)</Label><Input name="delivery_fee" type="number" min={0} defaultValue={Number(store.delivery_fee)} /></div>
            <div><Label>무료배송 기준(원)</Label><Input name="free_delivery_threshold" type="number" min={0} defaultValue={store.free_delivery_threshold != null ? Number(store.free_delivery_threshold) : undefined} /></div>
            <div><Label>결제조건</Label><Input name="payment_terms" defaultValue={store.payment_terms ?? ""} placeholder="예: 월말 정산" /></div>
            <div className="col-span-2 md:col-span-4"><Label>관리자 메모</Label><Input name="admin_memo" defaultValue={store.admin_memo ?? ""} /></div>
          </div>

          <div className="mt-4">
            <Label>배송요일</Label>
            <div className="flex gap-3">
              {DOW_LABEL.map((d, i) => (
                <label key={i} className="flex items-center gap-1 text-sm">
                  <input type="checkbox" name={`dd_${i}`} defaultChecked={(store.delivery_days ?? []).includes(i)} className="h-4 w-4 accent-orange-500" /> {d}
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-4">
            <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="is_active" defaultChecked={store.is_active} className="h-4 w-4 accent-orange-500" /> 사용</label>
            <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="order_blocked" defaultChecked={store.order_blocked} className="h-4 w-4 accent-orange-500" /> 주문 차단</label>
            <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="is_dormant" defaultChecked={store.is_dormant} className="h-4 w-4 accent-orange-500" /> 휴면</label>
          </div>
          <Button type="submit" className="mt-5">저장</Button>
        </form>
      )}

      {tab === "products" && <StoreProductsTab storeId={id} />}
      {tab === "users" && <StoreUsersTab storeId={id} />}
    </div>
  );
}

async function StoreProductsTab({ storeId }: { storeId: string }) {
  const admin = createAdminClient();
  const [{ data: products }, { data: sps }] = await Promise.all([
    admin.from("products").select("id, name, spec, storage_type, base_price, ecount_item_code").eq("is_active", true).order("name"),
    admin.from("store_products").select("*").eq("store_id", storeId),
  ]);
  const spMap = new Map((sps ?? []).map((sp) => [sp.product_id, sp]));

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>취급상품 및 가맹점 단가</CardTitle>
        <p className="mt-1 text-xs text-muted">체크된 상품만 가맹점 앱에 표시됩니다. 전용 공급가가 비어 있으면 기본 공급가가 적용됩니다.</p>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-sm">
          <thead><tr className="border-b border-border text-left text-xs text-muted">
            <th className="py-2 pr-2">취급</th><th className="py-2 pr-2">품명</th><th className="py-2 pr-2 text-right">기본가</th>
            <th className="py-2 pr-2 text-right">전용 공급가</th><th className="py-2 pr-2">최소/최대</th>
            <th className="py-2 pr-2">노출</th><th className="py-2 pr-2">품절</th><th className="py-2"></th>
          </tr></thead>
          <tbody>
            {(products ?? []).map((p) => {
              const sp = spMap.get(p.id);
              return (
                <tr key={p.id} className="border-b border-gray-50">
                  <td className="py-1.5 pr-2">
                    <form action={toggleStoreProduct}>
                      <input type="hidden" name="store_id" value={storeId} />
                      <input type="hidden" name="product_id" value={p.id} />
                      <input type="hidden" name="mapped" value={sp ? "1" : "0"} />
                      <button type="submit" className={`rounded-lg px-2.5 py-1 text-xs font-semibold ${sp ? "bg-primary text-white" : "bg-gray-100 text-gray-500"}`}>
                        {sp ? "취급중" : "미취급"}
                      </button>
                    </form>
                  </td>
                  <td className="py-1.5 pr-2">
                    <Badge className={STORAGE_COLOR[p.storage_type]}>{STORAGE_LABEL[p.storage_type]}</Badge>
                    <span className="ml-1.5 font-medium">{p.name}</span>
                    <span className="ml-1 text-xs text-muted">{p.spec}</span>
                  </td>
                  <td className="py-1.5 pr-2 text-right text-gray-500">{formatNumber(Number(p.base_price))}</td>
                  {sp ? (
                    <SPForm sp={sp} storeId={storeId} />
                  ) : (
                    <td colSpan={5} className="py-1.5 text-xs text-gray-300">—</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function SPForm({ sp, storeId }: { sp: Record<string, unknown>; storeId: string }) {
  const formId = `sp-${sp.id}`;
  return (
    <>
      <td className="py-1.5 pr-2 text-right">
        <input form={formId} name="custom_price" type="number" min={0} defaultValue={sp.custom_price != null ? Number(sp.custom_price) : undefined}
          placeholder="기본가" className="h-8 w-24 rounded-lg border border-border px-2 text-right text-sm" />
      </td>
      <td className="py-1.5 pr-2">
        <input form={formId} name="min_order_qty" type="number" min={1} defaultValue={sp.min_order_qty != null ? Number(sp.min_order_qty) : undefined} placeholder="최소" className="h-8 w-14 rounded-lg border border-border px-1.5 text-sm" />
        <span className="mx-0.5 text-gray-300">/</span>
        <input form={formId} name="max_order_qty" type="number" min={1} defaultValue={sp.max_order_qty != null ? Number(sp.max_order_qty) : undefined} placeholder="최대" className="h-8 w-14 rounded-lg border border-border px-1.5 text-sm" />
      </td>
      <td className="py-1.5 pr-2"><input form={formId} type="checkbox" name="is_visible" defaultChecked={Boolean(sp.is_visible)} className="h-4 w-4 accent-orange-500" /></td>
      <td className="py-1.5 pr-2"><input form={formId} type="checkbox" name="is_soldout" defaultChecked={Boolean(sp.is_soldout)} className="h-4 w-4 accent-orange-500" /></td>
      <td className="py-1.5">
        <form id={formId} action={updateStoreProduct}>
          <input type="hidden" name="sp_id" value={String(sp.id)} />
          <input type="hidden" name="store_id" value={storeId} />
          <button type="submit" className="rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-orange-100 hover:text-primary">저장</button>
        </form>
      </td>
    </>
  );
}

async function StoreUsersTab({ storeId }: { storeId: string }) {
  const admin = createAdminClient();
  const { data: users } = await admin.from("profiles").select("*").eq("store_id", storeId).order("created_at");
  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>가맹점 사용자</CardTitle>
        <p className="mt-1 text-xs text-muted">계정 생성/비밀번호 초기화는 <Link href="/admin/users" className="text-primary underline">사용자·권한</Link> 메뉴에서 할 수 있습니다.</p>
      </CardHeader>
      <CardContent>
        {(users ?? []).length === 0 ? <p className="py-6 text-center text-sm text-gray-400">등록된 사용자가 없습니다.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-2">아이디</th><th className="py-2">이름</th><th className="py-2">역할</th><th className="py-2">연락처</th><th className="py-2">상태</th>
            </tr></thead>
            <tbody>
              {(users ?? []).map((u) => (
                <tr key={u.id} className="border-b border-gray-50">
                  <td className="py-2 font-mono text-xs">{u.username}</td>
                  <td className="py-2">{u.full_name}</td>
                  <td className="py-2">{ROLE_LABEL[u.role]}</td>
                  <td className="py-2 text-gray-500">{u.phone ?? "-"}</td>
                  <td className="py-2">{u.is_active ? <Badge className="bg-emerald-50 text-emerald-600">활성</Badge> : <Badge className="bg-gray-100 text-gray-500">중지</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  );
}
