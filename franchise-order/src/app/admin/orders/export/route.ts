import { NextResponse } from "next/server";
import { getSessionProfile, STAFF_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ORDER_STATUS_LABEL, ERP_STATUS_LABEL } from "@/lib/constants";

function csvCell(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(request: Request) {
  const profile = await getSessionProfile();
  if (!profile || !STAFF_ROLES.includes(profile.role)) {
    return NextResponse.json({ error: "권한이 없습니다." }, { status: 403 });
  }
  const url = new URL(request.url);
  const admin = createAdminClient();
  let query = admin.from("orders")
    .select("order_no, ordered_at, planned_ship_date, status, erp_status, supply_amount, vat_amount, delivery_fee, total_amount, ecount_doc_no, memo, stores(name, store_code), order_items(qty, unit_price, supply_amount, product_snapshot)")
    .neq("status", "DRAFT").order("ordered_at", { ascending: false }).limit(2000);
  const p = url.searchParams;
  if (p.get("status")) query = query.eq("status", p.get("status")!);
  if (p.get("erp")) query = query.eq("erp_status", p.get("erp")!);
  if (p.get("from")) query = query.gte("ordered_at", p.get("from")!);
  if (p.get("to")) query = query.lte("ordered_at", p.get("to")! + "T23:59:59");
  const { data: orders } = await query;

  const rows: string[] = [
    ["주문번호", "가맹점", "고객코드", "주문일시", "출고예정일", "상태", "ERP상태", "전표번호", "품목명", "수량", "단가", "공급가", "주문총액", "메모"].join(","),
  ];
  for (const o of orders ?? []) {
    const store = o.stores as { name?: string; store_code?: string } | null;
    for (const it of (o.order_items as { qty: number; unit_price: number; supply_amount: number; product_snapshot: { name?: string } }[]) ?? []) {
      rows.push([
        o.order_no, store?.name, store?.store_code, String(o.ordered_at).slice(0, 16).replace("T", " "),
        o.planned_ship_date ?? "", ORDER_STATUS_LABEL[o.status] ?? o.status, ERP_STATUS_LABEL[o.erp_status] ?? o.erp_status,
        o.ecount_doc_no ?? "", it.product_snapshot?.name ?? "", it.qty, it.unit_price, it.supply_amount,
        o.total_amount, o.memo ?? "",
      ].map(csvCell).join(","));
    }
  }
  const bom = "﻿";
  return new NextResponse(bom + rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
