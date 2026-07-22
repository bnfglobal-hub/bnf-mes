import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ChevronLeft } from "lucide-react";
import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { auditLog } from "@/lib/audit";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export const dynamic = "force-dynamic";

async function updateProduct(formData: FormData) {
  "use server";
  const profile = await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  const id = String(formData.get("id"));
  const { data: before } = await admin.from("products").select("*").eq("id", id).single();
  if (!before) return;
  const patch = {
    name: String(formData.get("name") ?? "").trim(),
    ecount_item_code: String(formData.get("ecount_item_code") ?? "").trim() || null,
    spec: String(formData.get("spec") ?? "").trim() || null,
    barcode: String(formData.get("barcode") ?? "").trim() || null,
    storage_type: String(formData.get("storage_type")),
    tax_type: String(formData.get("tax_type")),
    base_price: Number(formData.get("base_price") ?? 0),
    retail_price: formData.get("retail_price") ? Number(formData.get("retail_price")) : null,
    box_qty: formData.get("box_qty") ? Number(formData.get("box_qty")) : null,
    order_unit: String(formData.get("order_unit") ?? "EA"),
    min_order_qty: Number(formData.get("min_order_qty") ?? 1) || 1,
    max_order_qty: formData.get("max_order_qty") ? Number(formData.get("max_order_qty")) : null,
    qty_step: Number(formData.get("qty_step") ?? 1) || 1,
    thumbnail_url: String(formData.get("thumbnail_url") ?? "").trim() || null,
    description: String(formData.get("description") ?? "").trim() || null,
    sort_order: Number(formData.get("sort_order") ?? 0) || 0,
    is_general: formData.get("is_general") === "on",
    is_soldout: formData.get("is_soldout") === "on",
    is_discontinued: formData.get("is_discontinued") === "on",
    is_new: formData.get("is_new") === "on",
    is_recommended: formData.get("is_recommended") === "on",
    is_active: formData.get("is_active") === "on",
    updated_by: profile.id,
  };
  await admin.from("products").update(patch).eq("id", id);
  await auditLog({
    actorId: profile.id, actorName: profile.full_name, action: "PRODUCT_UPDATE", entity: "products", entityId: id,
    before: { name: before.name, base_price: before.base_price, is_soldout: before.is_soldout, is_active: before.is_active },
    after: { name: patch.name, base_price: patch.base_price, is_soldout: patch.is_soldout, is_active: patch.is_active },
  });
  revalidatePath("/admin/products");
  redirect("/admin/products");
}

export default async function ProductEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();
  const { data: p } = await admin.from("products").select("*").eq("id", id).single();
  if (!p) notFound();

  const CHECKS = [
    { name: "is_active", label: "사용", checked: p.is_active },
    { name: "is_general", label: "공산품 (전 거래처 공용)", checked: p.is_general },
    { name: "is_soldout", label: "품절", checked: p.is_soldout },
    { name: "is_discontinued", label: "판매중지", checked: p.is_discontinued },
    { name: "is_new", label: "신상품", checked: p.is_new },
    { name: "is_recommended", label: "추천상품", checked: p.is_recommended },
  ];

  return (
    <div className="max-w-3xl">
      <div className="flex items-center gap-2">
        <Link href="/admin/products" className="rounded-full p-1.5 hover:bg-gray-100" aria-label="뒤로"><ChevronLeft size={20} /></Link>
        <h1 className="text-xl font-bold">상품 수정 — {p.name}</h1>
      </div>

      <form action={updateProduct} className="mt-4 rounded-2xl border border-border bg-white p-5">
        <input type="hidden" name="id" value={p.id} />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          <div className="col-span-2"><Label>품명 *</Label><Input name="name" required defaultValue={p.name} maxLength={100} /></div>
          <div><Label>이카운트 품목코드</Label><Input name="ecount_item_code" defaultValue={p.ecount_item_code ?? ""} maxLength={30} /></div>
          <div><Label>규격</Label><Input name="spec" defaultValue={p.spec ?? ""} maxLength={50} /></div>
          <div><Label>바코드</Label><Input name="barcode" defaultValue={p.barcode ?? ""} maxLength={30} /></div>
          <div><Label>정렬순서</Label><Input name="sort_order" type="number" defaultValue={p.sort_order} /></div>
          <div><Label>보관구분</Label>
            <Select name="storage_type" defaultValue={p.storage_type}>
              <option value="ROOM">상온</option><option value="CHILLED">냉장</option><option value="FROZEN">냉동</option>
            </Select>
          </div>
          <div><Label>과세구분</Label>
            <Select name="tax_type" defaultValue={p.tax_type}>
              <option value="TAXABLE">과세</option><option value="EXEMPT">면세</option>
            </Select>
          </div>
          <div><Label>주문단위</Label><Input name="order_unit" defaultValue={p.order_unit} maxLength={10} /></div>
          <div><Label>기본 공급가(원)</Label><Input name="base_price" type="number" min={0} defaultValue={Number(p.base_price)} /></div>
          <div><Label>소비자가(원)</Label><Input name="retail_price" type="number" min={0} defaultValue={p.retail_price != null ? Number(p.retail_price) : undefined} /></div>
          <div><Label>박스 입수량</Label><Input name="box_qty" type="number" min={1} defaultValue={p.box_qty ?? undefined} /></div>
          <div><Label>최소주문수량</Label><Input name="min_order_qty" type="number" min={1} defaultValue={p.min_order_qty} /></div>
          <div><Label>최대주문수량</Label><Input name="max_order_qty" type="number" min={1} defaultValue={p.max_order_qty ?? undefined} /></div>
          <div><Label>수량 증감단위</Label><Input name="qty_step" type="number" min={1} defaultValue={p.qty_step} /></div>
          <div className="col-span-2 md:col-span-3"><Label>썸네일 URL</Label><Input name="thumbnail_url" defaultValue={p.thumbnail_url ?? ""} /></div>
          <div className="col-span-2 md:col-span-3"><Label>설명</Label><Input name="description" defaultValue={p.description ?? ""} maxLength={500} /></div>
        </div>
        <div className="mt-4 flex flex-wrap gap-4">
          {CHECKS.map((c) => (
            <label key={c.name} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" name={c.name} defaultChecked={c.checked} className="h-4 w-4 accent-orange-500" /> {c.label}
            </label>
          ))}
        </div>
        <Button type="submit" className="mt-5">저장</Button>
      </form>
    </div>
  );
}
