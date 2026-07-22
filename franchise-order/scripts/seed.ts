/**
 * 데모 데이터 시드 스크립트.
 * 사용법:
 *   1) .env.local 에 NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 설정
 *   2) supabase/migrations/00001_init.sql 적용 후
 *   3) npm run seed
 *
 * 데모 계정 (아이디 / 비밀번호):
 *   admin / admin1234!      — 최고 관리자
 *   hq / hq1234!            — 본사 관리자
 *   wh / wh1234!            — 창고 담당
 *   가맹점: 아이디 = 사업자등록번호(숫자만), 초기 비밀번호 1234 (최초 로그인 시 변경 강제)
 *   1234567890 — 강남점 / 2345678901 — 하남점 / 3456789012 — 성수점
 */
import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config({ path: ".env.local" });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY 를 .env.local 에 설정하세요.");
  process.exit(1);
}
const db = createClient(url, key, { auth: { persistSession: false } });
const EMAIL_DOMAIN = "bnf-order.local";

async function upsertUser(username: string, password: string, fullName: string, role: string, storeId: string | null, mustChangePassword = false) {
  const email = `${username}@${EMAIL_DOMAIN}`;
  const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
  let user = list?.users.find((u) => u.email === email);
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email, password, email_confirm: true,
      user_metadata: { must_change_password: mustChangePassword },
    });
    if (error) throw error;
    user = data.user!;
  }
  await db.from("profiles").upsert({ id: user.id, username, full_name: fullName, role, store_id: storeId, is_active: true });
  return user.id;
}

/** 구버전 시드 계정 정리 */
async function removeUser(username: string) {
  const email = `${username}@${EMAIL_DOMAIN}`;
  const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
  const user = list?.users.find((u) => u.email === email);
  if (user) {
    await db.from("profiles").delete().eq("id", user.id);
    await db.auth.admin.deleteUser(user.id);
    console.log(`구 계정 삭제: ${username}`);
  }
}

async function main() {
  console.log("=== BNF 데모 데이터 시드 시작 ===");

  // 본사/브랜드/거래처/창고
  const { data: hq } = await db.from("headquarters").upsert({ name: "㈜비엔에프글로벌" }, { onConflict: "id" }).select().single();
  const { data: brand } = await db.from("brands").upsert({ name: "BNF 테스트 프랜차이즈", code: "BNF-TEST", headquarters_id: hq?.id }, { onConflict: "code" }).select().single();
  const { data: customer } = await db.from("customers").upsert({ name: "BNF 테스트 프랜차이즈 본부", ecount_customer_code: "C-TEST", brand_id: brand?.id }, { onConflict: "ecount_customer_code" }).select().single();
  const { data: wh1 } = await db.from("warehouses").upsert({ code: "W100", name: "본사 물류센터" }, { onConflict: "code" }).select().single();
  await db.from("warehouses").upsert({ code: "W200", name: "냉동 전용창고" }, { onConflict: "code" });

  // 상품 (상온/냉장/냉동 혼합)
  const PRODUCTS = [
    { code: "I-NM500", name: "냉면육수 500g", spec: "500g×20", storage: "CHILLED", price: 1800, box: 20, tax: "EXEMPT" },
    { code: "I-GB1K", name: "갈비탕 육수 1kg", spec: "1kg×10", storage: "CHILLED", price: 3500, box: 10, tax: "EXEMPT" },
    { code: "I-SSG150", name: "쌀국수면 150g", spec: "150g×40", storage: "ROOM", price: 850, box: 40, tax: "EXEMPT" },
    { code: "I-JJ280", name: "짜조 280g", spec: "280g×20", storage: "FROZEN", price: 4200, box: 20, tax: "TAXABLE" },
    { code: "I-SHRIMP", name: "칵테일새우 500g", spec: "500g×10", storage: "FROZEN", price: 8900, box: 10, tax: "EXEMPT" },
    { code: "I-SQUID", name: "냉동 오징어 1kg", spec: "1kg×10", storage: "FROZEN", price: 7500, box: 10, tax: "EXEMPT" },
    { code: "I-DSD", name: "소고기 다시다 1kg", spec: "1kg×12", storage: "ROOM", price: 9800, box: 12, tax: "TAXABLE" },
    { code: "I-FISH", name: "피쉬소스 700ml", spec: "700ml×12", storage: "ROOM", price: 4500, box: 12, tax: "TAXABLE" },
  ];
  const productIds: Record<string, string> = {};
  for (const [i, p] of PRODUCTS.entries()) {
    const { data } = await db.from("products").upsert({
      ecount_item_code: p.code, name: p.name, spec: p.spec, storage_type: p.storage,
      tax_type: p.tax, base_price: p.price, box_qty: p.box, order_unit: "EA",
      min_order_qty: 1, qty_step: 1, sort_order: i, is_new: i >= 6, is_recommended: i < 2,
    }, { onConflict: "ecount_item_code" }).select("id").single();
    if (data) productIds[p.code] = data.id;
  }

  // 가맹점 3곳 (보이는 상품·단가 다르게)
  const STORES = [
    { code: "GN001", name: "강남점", bizNo: "123-45-67890", min: 300000, fee: 0, addr: "서울 강남구 테헤란로 123", zone: "강남", ecount: "C-GN001" },
    { code: "HN001", name: "하남점", bizNo: "234-56-78901", min: 200000, fee: 30000, free: 500000, addr: "경기 하남시 미사대로 456", zone: "동부", ecount: "C-HN001" },
    { code: "SS001", name: "성수점", bizNo: "345-67-89012", min: 100000, fee: 0, addr: "서울 성동구 성수이로 789", zone: "성동", ecount: "C-SS001" },
  ];
  const storeIds: Record<string, string> = {};
  for (const s of STORES) {
    const { data } = await db.from("stores").upsert({
      store_code: s.code, name: s.name, brand_id: brand?.id, customer_id: customer?.id, biz_no: s.bizNo,
      ecount_customer_code: s.ecount, phone: "02-0000-0000", address1: s.addr, delivery_zone: s.zone,
      default_warehouse_id: wh1?.id, min_order_amount: s.min, delivery_fee: s.fee,
      free_delivery_threshold: "free" in s ? (s as { free: number }).free : null,
      delivery_days: [1, 2, 3, 4, 5], order_cutoff: "15:00",
    }, { onConflict: "store_code" }).select("id").single();
    if (data) storeIds[s.code] = data.id;
  }

  // 가맹점별 취급상품 매핑 (다르게)
  const MAPPING: Record<string, { code: string; price?: number }[]> = {
    GN001: [
      { code: "I-NM500", price: 1700 }, { code: "I-GB1K", price: 3300 }, { code: "I-SSG150" },
      { code: "I-JJ280" }, { code: "I-SHRIMP", price: 8500 }, { code: "I-DSD" }, { code: "I-FISH" },
    ],
    HN001: [
      { code: "I-NM500" }, { code: "I-SSG150", price: 800 }, { code: "I-JJ280", price: 4000 },
      { code: "I-SQUID" }, { code: "I-FISH" },
    ],
    SS001: [
      { code: "I-GB1K" }, { code: "I-SSG150" }, { code: "I-SHRIMP" }, { code: "I-SQUID", price: 7200 }, { code: "I-DSD", price: 9500 },
    ],
  };
  for (const [storeCode, items] of Object.entries(MAPPING)) {
    for (const it of items) {
      await db.from("store_products").upsert({
        store_id: storeIds[storeCode], product_id: productIds[it.code],
        custom_price: it.price ?? null, is_visible: true,
      }, { onConflict: "store_id,product_id" });
    }
  }

  // 재고 스냅샷
  const { data: whs } = await db.from("warehouses").select("id, code");
  for (const p of Object.values(productIds)) {
    for (const w of whs ?? []) {
      await db.from("inventory_snapshots").upsert({
        product_id: p, warehouse_id: w.id, qty: 100 + Math.floor(Math.random() * 200), safety_qty: 10,
      }, { onConflict: "product_id,warehouse_id" });
    }
  }

  // 사용자 — 가맹점 아이디는 사업자등록번호(숫자만), 초기 비밀번호 1234 + 변경 강제
  await upsertUser("admin", "admin1234!", "시스템 관리자", "super_admin", null);
  await upsertUser("hq", "hq1234!", "본사 담당자", "hq_admin", null);
  await upsertUser("wh", "wh1234!", "창고 담당자", "warehouse", null);
  await upsertUser("1234567890", "1234", "강남점 점주", "franchise_owner", storeIds.GN001, true);
  await upsertUser("2345678901", "1234", "하남점 점주", "franchise_owner", storeIds.HN001, true);
  await upsertUser("3456789012", "1234", "성수점 점주", "franchise_owner", storeIds.SS001, true);
  // 구버전 아이디 정리
  await removeUser("gangnam");
  await removeUser("hanam");
  await removeUser("seongsu");

  // 공지 (중복 방지)
  const { data: existingAnn } = await db.from("announcements").select("id").eq("title", "BNF 발주 시스템 오픈 안내").limit(1);
  if (!existingAnn?.length) {
    await db.from("announcements").insert({
      title: "BNF 발주 시스템 오픈 안내", body: "이제 문자/카톡 대신 이 앱에서 발주해주세요.\n주문 마감은 평일 15시입니다.",
      is_pinned: true, is_important: true, target_all: true,
    });
  }

  console.log("=== 시드 완료 ===");
  console.log("관리자: admin/admin1234!  hq/hq1234!  wh/wh1234!");
  console.log("가맹점(사업자번호/초기비번 1234, 최초 로그인 시 변경): 1234567890(강남) 2345678901(하남) 3456789012(성수)");
}

main().catch((e) => { console.error(e); process.exit(1); });
