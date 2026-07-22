"use server";

import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseTradeRows } from "@/lib/domain/trade-import";
import { auditLog } from "@/lib/audit";

export interface TradePreview {
  matched: { customerCode: string; storeName: string; itemCode: string; productName: string; already: boolean }[];
  unknownCustomers: string[];
  unknownItems: string[];
  alreadyMapped: number;
  errors: { line: number; message: string }[];
}

async function analyze(text: string) {
  const admin = createAdminClient();
  const { pairs, errors } = parseTradeRows(text.slice(0, 500_000));

  const customerCodes = [...new Set(pairs.map((p) => p.customerCode))];
  const itemCodes = [...new Set(pairs.map((p) => p.itemCode))];

  const [{ data: stores }, { data: products }] = await Promise.all([
    admin.from("stores").select("id, name, ecount_customer_code").in("ecount_customer_code", customerCodes.length ? customerCodes : ["-"]),
    admin.from("products").select("id, name, ecount_item_code").in("ecount_item_code", itemCodes.length ? itemCodes : ["-"]),
  ]);
  const storeMap = new Map((stores ?? []).map((s) => [s.ecount_customer_code!, s]));
  const productMap = new Map((products ?? []).map((p) => [p.ecount_item_code!, p]));

  const storeIds = (stores ?? []).map((s) => s.id);
  const { data: existing } = await admin.from("store_products").select("store_id, product_id")
    .in("store_id", storeIds.length ? storeIds : ["00000000-0000-0000-0000-000000000000"]);
  const existingSet = new Set((existing ?? []).map((e) => `${e.store_id}::${e.product_id}`));

  const unknownCustomers = new Set<string>();
  const unknownItems = new Set<string>();
  const matched: TradePreview["matched"] = [];
  const toInsert: { store_id: string; product_id: string }[] = [];

  for (const p of pairs) {
    const store = storeMap.get(p.customerCode);
    const product = productMap.get(p.itemCode);
    if (!store) { unknownCustomers.add(p.customerCode); continue; }
    if (!product) { unknownItems.add(p.itemCode); continue; }
    const already = existingSet.has(`${store.id}::${product.id}`);
    matched.push({ customerCode: p.customerCode, storeName: store.name, itemCode: p.itemCode, productName: product.name, already });
    if (!already) toInsert.push({ store_id: store.id, product_id: product.id });
  }

  return {
    preview: {
      matched,
      unknownCustomers: [...unknownCustomers],
      unknownItems: [...unknownItems],
      alreadyMapped: matched.filter((m) => m.already).length,
      errors,
    } satisfies TradePreview,
    toInsert,
  };
}

export async function previewTradeImportAction(text: string): Promise<TradePreview> {
  await requireRole(ADMIN_ROLES);
  const { preview } = await analyze(text);
  return preview;
}

export async function applyTradeImportAction(text: string): Promise<{ ok: boolean; added: number; skipped: number; error?: string }> {
  const profile = await requireRole(ADMIN_ROLES);
  const { preview, toInsert } = await analyze(text);
  if (toInsert.length === 0) return { ok: true, added: 0, skipped: preview.alreadyMapped };

  const admin = createAdminClient();
  const { error } = await admin.from("store_products").upsert(
    toInsert.map((t) => ({ ...t, is_visible: true, created_by: profile.id })),
    { onConflict: "store_id,product_id", ignoreDuplicates: true }
  );
  if (error) return { ok: false, added: 0, skipped: 0, error: error.message };

  await auditLog({
    actorId: profile.id, actorName: profile.full_name, action: "TRADE_IMPORT",
    entity: "store_products", after: { added: toInsert.length, skipped: preview.alreadyMapped },
  });
  return { ok: true, added: toInsert.length, skipped: preview.alreadyMapped };
}
