import Link from "next/link";
import { revalidatePath } from "next/cache";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatNumber } from "@/lib/utils";
import { STORAGE_LABEL, STORAGE_COLOR } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { auditLog } from "@/lib/audit";
import { GeneralProductBulkBar, ImportEcountItemsButton } from "@/components/admin/product-general-controls";

export const dynamic = "force-dynamic";

async function createProduct(formData: FormData) {
  "use server";
  const profile = await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const { data } = await admin.from("products").insert({
    name,
    ecount_item_code: String(formData.get("ecount_item_code") ?? "").trim() || null,
    spec: String(formData.get("spec") ?? "").trim() || null,
    storage_type: String(formData.get("storage_type") ?? "ROOM"),
    tax_type: String(formData.get("tax_type") ?? "TAXABLE"),
    base_price: Number(formData.get("base_price") ?? 0),
    box_qty: formData.get("box_qty") ? Number(formData.get("box_qty")) : null,
    order_unit: String(formData.get("order_unit") ?? "EA").trim() || "EA",
    min_order_qty: Number(formData.get("min_order_qty") ?? 1) || 1,
    qty_step: Number(formData.get("qty_step") ?? 1) || 1,
    is_general: formData.get("is_general") === "on",
    created_by: profile.id,
  }).select("id").single();
  await auditLog({ actorId: profile.id, actorName: profile.full_name, action: "PRODUCT_CREATE", entity: "products", entityId: data?.id, after: { name } });
  revalidatePath("/admin/products");
}

const PAGE_SIZE = 100;

export default async function ProductsAdminPage({ searchParams }: { searchParams: Promise<{ q?: string; view?: string; page?: string; cat?: string }> }) {
  await requireRole(ADMIN_ROLES);
  const { q, view, page: pageParam, cat } = await searchParams;
  const admin = createAdminClient();
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  let query = admin.from("products").select("*, product_categories(name)", { count: "exact" })
    .order("sort_order").order("name")
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (q) query = query.or(`name.ilike.%${q}%,ecount_item_code.ilike.%${q}%`);
  if (view === "general") query = query.eq("is_general", true);
  if (view === "unpriced") query = query.eq("base_price", 0);
  if (cat) query = query.eq("category_id", cat);
  const { data: products, count } = await query;

  const [{ count: totalCount }, { count: generalCount }, { data: categories }] = await Promise.all([
    admin.from("products").select("id", { count: "exact", head: true }),
    admin.from("products").select("id", { count: "exact", head: true }).eq("is_general", true),
    admin.from("product_categories").select("id, name").order("name"),
  ]);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));
  const qs = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries({ q, view, cat, page: String(page), ...patch })) if (v) params.set(k, v);
    return `/admin/products?${params.toString()}`;
  };

  const VIEWS = [
    { key: undefined, label: `전체 (${totalCount ?? 0})` },
    { key: "general", label: `공산품 (${generalCount ?? 0})` },
    { key: "unpriced", label: "단가 미설정" },
  ];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">상품관리</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ImportEcountItemsButton />
          <form method="get" className="flex gap-2">
            {view && <input type="hidden" name="view" value={view} />}
            <Input name="q" defaultValue={q} placeholder="품명/품목코드 검색" className="h-10 w-56" />
            <Button type="submit" size="sm" className="h-10">검색</Button>
          </form>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {VIEWS.map((v) => (
          <Link key={v.label} href={qs({ view: v.key, page: "1" })}
            className={`rounded-full px-3.5 py-1.5 text-sm font-semibold ${view === v.key ? "bg-primary text-white" : "border border-border bg-white text-gray-600"}`}>
            {v.label}
          </Link>
        ))}
      </div>

      {(categories ?? []).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Link href={qs({ cat: undefined, page: "1" })}
            className={`rounded-full px-3 py-1 text-xs font-medium ${!cat ? "bg-orange-100 text-primary" : "bg-gray-50 text-gray-500"}`}>
            전체 분류
          </Link>
          {(categories ?? []).map((c) => (
            <Link key={c.id} href={qs({ cat: cat === c.id ? undefined : c.id, page: "1" })}
              className={`rounded-full px-3 py-1 text-xs font-medium ${cat === c.id ? "bg-orange-100 text-primary" : "bg-gray-50 text-gray-500"}`}>
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <GeneralProductBulkBar>
      <div className="mt-3 overflow-x-auto rounded-2xl border border-border bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead><tr className="border-b border-border bg-gray-50/60 text-left text-xs text-muted">
            <th className="w-10 px-3 py-2.5"></th>
            <th className="px-3 py-2.5">품목코드</th><th className="px-3 py-2.5">품명</th><th className="px-3 py-2.5">규격</th>
            <th className="px-3 py-2.5">보관</th><th className="px-3 py-2.5">과세</th><th className="px-3 py-2.5 text-right">기본 공급가</th>
            <th className="px-3 py-2.5">상태</th><th className="px-3 py-2.5"></th>
          </tr></thead>
          <tbody>
            {(products ?? []).length === 0 && <tr><td colSpan={9} className="py-12 text-center text-gray-400">상품이 없습니다.</td></tr>}
            {(products ?? []).map((p) => (
              <tr key={p.id} className="border-b border-gray-50 hover:bg-orange-50/30">
                <td className="px-3 py-2.5">
                  <input type="checkbox" data-product-id={p.id} className="h-4 w-4 accent-orange-500" />
                </td>
                <td className="px-3 py-2.5 text-gray-500">{p.ecount_item_code ?? <span className="text-amber-600">미매핑</span>}</td>
                <td className="px-3 py-2.5 font-medium">
                  {p.name}
                  {p.is_general && <Badge className="ml-1 bg-violet-50 text-violet-600">공산품</Badge>}
                  {p.is_new && <Badge className="ml-1 bg-orange-50 text-primary">NEW</Badge>}
                  {p.is_recommended && <Badge className="ml-1 bg-emerald-50 text-emerald-600">추천</Badge>}
                </td>
                <td className="px-3 py-2.5 text-gray-600">{p.spec}</td>
                <td className="px-3 py-2.5"><Badge className={STORAGE_COLOR[p.storage_type]}>{STORAGE_LABEL[p.storage_type]}</Badge></td>
                <td className="px-3 py-2.5 text-gray-600">{p.tax_type === "TAXABLE" ? "과세" : "면세"}</td>
                <td className="px-3 py-2.5 text-right font-semibold">{formatNumber(Number(p.base_price))}원</td>
                <td className="px-3 py-2.5">
                  {!p.is_active ? <Badge className="bg-gray-100 text-gray-500">비활성</Badge>
                    : p.is_discontinued ? <Badge className="bg-gray-100 text-gray-500">판매중지</Badge>
                    : p.is_soldout ? <Badge className="bg-red-50 text-danger">품절</Badge>
                    : <Badge className="bg-emerald-50 text-emerald-600">판매중</Badge>}
                </td>
                <td className="px-3 py-2.5"><Link href={`/admin/products/${p.id}`} className="text-primary hover:underline">수정</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      </GeneralProductBulkBar>

      <div className="mt-3 flex items-center justify-between text-sm">
        <p className="text-muted">총 {count ?? 0}건</p>
        <div className="flex gap-1">
          {page > 1 && <Link href={qs({ page: String(page - 1) })} className="rounded-lg border border-border bg-white px-3 py-1.5">이전</Link>}
          <span className="px-3 py-1.5 text-muted">{page} / {totalPages}</span>
          {page < totalPages && <Link href={qs({ page: String(page + 1) })} className="rounded-lg border border-border bg-white px-3 py-1.5">다음</Link>}
        </div>
      </div>

      <form action={createProduct} className="mt-5 rounded-2xl border border-border bg-white p-4">
        <h2 className="mb-3 text-[15px] font-bold">새 상품 등록</h2>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div><Label>품명 *</Label><Input name="name" required maxLength={100} /></div>
          <div><Label>이카운트 품목코드</Label><Input name="ecount_item_code" maxLength={30} /></div>
          <div><Label>규격</Label><Input name="spec" maxLength={50} placeholder="예: 500g×20" /></div>
          <div><Label>기본 공급가(원)</Label><Input name="base_price" type="number" min={0} defaultValue={0} /></div>
          <div><Label>보관구분</Label>
            <Select name="storage_type" defaultValue="ROOM">
              <option value="ROOM">상온</option><option value="CHILLED">냉장</option><option value="FROZEN">냉동</option>
            </Select>
          </div>
          <div><Label>과세구분</Label>
            <Select name="tax_type" defaultValue="TAXABLE">
              <option value="TAXABLE">과세</option><option value="EXEMPT">면세</option>
            </Select>
          </div>
          <div><Label>주문단위</Label><Input name="order_unit" defaultValue="EA" maxLength={10} /></div>
          <div><Label>박스 입수량</Label><Input name="box_qty" type="number" min={1} /></div>
          <div><Label>최소주문수량</Label><Input name="min_order_qty" type="number" min={1} defaultValue={1} /></div>
          <div><Label>수량 증감단위</Label><Input name="qty_step" type="number" min={1} defaultValue={1} /></div>
        </div>
        <label className="mt-3 flex items-center gap-1.5 text-sm">
          <input type="checkbox" name="is_general" className="h-4 w-4 accent-orange-500" />
          공산품 (전 거래처 공용 판매 — 가맹점별 부여 없이 모두에게 노출)
        </label>
        <Button type="submit" className="mt-4">상품 등록</Button>
      </form>
    </div>
  );
}
