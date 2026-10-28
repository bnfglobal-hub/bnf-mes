// msg-hub: 업무폰(안드로이드 MacroDroid) ↔ MES 메시지 수발주 허브
//  · 휴대폰  → in(문자/카톡 수신 전달) · next/ack(MES가 쌓은 문자 발송 대기열 처리) · ping
//  · MES     → list · cfg_get/cfg_set · update · send(phone_sms|kakao_reply|api_sms|alimtalk) · reparse
//  · AI 인식은 Gemini(GEMINI_API_KEY), 문자 API·알림톡은 솔라피(SOLAPI_API_KEY/SOLAPI_API_SECRET)
// 배포: verify_jwt=false (휴대폰은 device_key, MES는 apikey 헤더로 호출)
import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const SB = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
const GEMINI = Deno.env.get("GEMINI_API_KEY") || "";
const SOL_KEY = Deno.env.get("SOLAPI_API_KEY") || "";
const SOL_SECRET = Deno.env.get("SOLAPI_API_SECRET") || "";
const MODELS = ["gemini-2.5-flash", "gemini-flash-latest", "gemini-flash-lite-latest"];

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};
const J = (o: unknown, status = 200) =>
  new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json" } });
const T = (s: string) => new Response(s, { headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8" } });

const normPhone = (s: string) => String(s || "").replace(/[^\d]/g, "").replace(/^82/, "0");
const now = () => new Date().toISOString();

async function getCfg(): Promise<any> {
  const { data } = await SB.from("msg_hub_cfg").select("cfg").eq("id", 1).maybeSingle();
  return (data && data.cfg) || {};
}
async function patchCfg(p: any) {
  const cur = await getCfg();
  const next = { ...cur, ...p };
  await SB.from("msg_hub_cfg").upsert({ id: 1, cfg: next, updated_at: now() });
  return next;
}

/* 연락처 매칭: 전화번호 또는 카톡방/보낸사람 이름 */
function findContact(cfg: any, peer: string, name: string) {
  const list = Array.isArray(cfg.contacts) ? cfg.contacts : [];
  const p = normPhone(peer);
  const nm = String(name || "").replace(/\s/g, "");
  const pr = String(peer || "").replace(/\s/g, "");
  return list.find((c: any) =>
    (p && c.phone && normPhone(c.phone) === p) ||
    (c.room && (String(c.room).replace(/\s/g, "") === pr || String(c.room).replace(/\s/g, "") === nm))
  ) || null;
}

/* 주문처럼 보이는지 1차 거름(모르는 번호의 사적인 메시지는 저장도 AI 호출도 하지 않음) */
const ORDER_HINT = /(발주|주문|보내\s*주|부탁|넣어\s*주|박스|box|ea|개|kg|키로|입고|납품|출고|배송|수량)/i;
const AD_HINT = /(\(광고\)|무료거부|수신거부|인증번호|본인확인|택배.*도착)/;

async function gemini(prompt: string): Promise<string> {
  if (!GEMINI) throw new Error("GEMINI_API_KEY 없음");
  let last = "";
  for (const mdl of MODELS) {
    const url = "https://generativelanguage.googleapis.com/v1beta/models/" + mdl + ":generateContent?key=" + GEMINI;
    const genCfg: any = { temperature: 0.1, maxOutputTokens: 2048, responseMimeType: "application/json" };
    if (mdl.indexOf("2.5") >= 0) genCfg.thinkingConfig = { thinkingBudget: 0 };
    const r = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: genCfg }),
    });
    const j = await r.json().catch(() => ({}));
    if (r.ok) return (((j.candidates || [])[0] || {}).content?.parts || []).map((p: any) => p.text || "").join("");
    last = "Gemini " + r.status;
    if (![429, 503, 404, 400].includes(r.status)) break;
  }
  throw new Error(last || "Gemini 실패");
}

async function productNames(): Promise<string[]> {
  const { data } = await SB.from("app_state").select("p:state_data->prods").eq("id", 1).maybeSingle();
  const arr = Array.isArray(data?.p) ? data!.p : [];
  return arr.map((x: any) => String(x?.name || "")).filter(Boolean).slice(0, 120);
}

/* 메시지 → 주문 인식 */
async function parseOrder(text: string, contactName: string, cfg: any) {
  const prods = await productNames();
  const extra = Array.isArray(cfg.extra_items) ? cfg.extra_items : [];
  const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
  const prompt =
    "너는 식품제조사 B&F의 수발주 담당자다. 거래처가 카카오톡/문자로 보낸 메시지를 읽고 JSON 하나만 출력하라.\n" +
    "오늘 날짜(한국): " + today + "\n" +
    "보낸 사람(등록된 거래처명, 없으면 빈칸): " + (contactName || "") + "\n" +
    "우리 제품 목록(가능하면 이 이름으로 매칭):\n- " + [...prods, ...extra].join("\n- ") + "\n\n" +
    "출력 형식: {\"is_order\":true|false, \"kind\":\"수주\"|\"발주회신\"|\"문의\"|\"기타\", \"customer\":\"거래처명(메시지 서명/보낸사람에서)\", " +
    "\"items\":[{\"name\":\"메시지에 적힌 품목명\",\"matched\":\"제품목록의 정확한 이름 또는 빈칸\",\"qty\":숫자,\"unit\":\"박스|ea|kg 등\"}], " +
    "\"due\":\"YYYY-MM-DD 또는 빈칸(내일/모레/요일은 날짜로 변환)\", \"note\":\"요청사항 요약\", \"confidence\":0~1}\n" +
    "규칙: 주문/발주 요청이 아니면 is_order=false, items=[]. 수량이 없으면 qty=0. 추측으로 품목을 만들지 마라.\n\n" +
    "메시지:\n" + text;
  const raw = await gemini(prompt);
  let s = raw.replace(/```json/gi, "").replace(/```/g, "").trim();
  const a = s.indexOf("{"), b = s.lastIndexOf("}");
  if (a >= 0 && b > a) s = s.slice(a, b + 1);
  const o = JSON.parse(s);
  o.items = Array.isArray(o.items) ? o.items : [];
  return o;
}

const itemsLine = (items: any[]) =>
  items.map((i) => "· " + (i.matched || i.name) + (i.qty ? " " + i.qty + (i.unit || "") : "")).join("\n");
function fill(tpl: string, v: Record<string, string>) {
  return String(tpl || "").replace(/\{(\w+)\}/g, (_, k) => (v[k] ?? ""));
}
const DEF_RECEIPT = "[B&F글로벌] {customer}님 주문 접수되었습니다.\n{items}\n{due}확인 후 확정 안내드리겠습니다.";

/* ── 솔라피 (문자 API / 알림톡) ── */
async function solapiSend(msg: any) {
  if (!SOL_KEY || !SOL_SECRET) throw new Error("솔라피 키 미등록(SOLAPI_API_KEY/SOLAPI_API_SECRET)");
  const date = now();
  const salt = crypto.randomUUID().replace(/-/g, "");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(SOL_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = Array.from(new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(date + salt))))
    .map((b) => b.toString(16).padStart(2, "0")).join("");
  const r = await fetch("https://api.solapi.com/messages/v4/send-many/detail", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `HMAC-SHA256 apiKey=${SOL_KEY}, date=${date}, salt=${salt}, signature=${sig}`,
    },
    body: JSON.stringify({ messages: [msg] }),
  });
  const j = await r.json().catch(() => ({}));
  const fail = (j.failedMessageList || [])[0];
  if (!r.ok || fail) throw new Error("솔라피 " + r.status + " " + (fail?.statusMessage || j.errorMessage || j.message || ""));
  return j;
}

async function notifyStaff(cfg: any, title: string, body: string) {
  const ids = Array.isArray(cfg.notify_ids) ? cfg.notify_ids : [];
  if (!ids.length) return;
  try {
    await fetch(Deno.env.get("SUPABASE_URL") + "/functions/v1/send-push", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: "Bearer " + Deno.env.get("SUPABASE_ANON_KEY") },
      body: JSON.stringify({ items: ids.map((to: string) => ({ to, title, body, url: "./?page=msghub" })) }),
    });
  } catch (_) { /* 알림 실패는 무시 */ }
}

/* 휴대폰에서 들어온 메시지 처리 → 자동답장 문구 반환 */
async function handleIn(b: any, cfg: any) {
  const ch = b.ch === "kakao" ? "kakao" : "sms";
  const text = String(b.text || "").trim();
  const peer = ch === "sms" ? normPhone(b.from) : String(b.room || b.from || "").trim();
  const peerName = String(b.name || b.from || "").trim();
  if (!text || !peer) return { reply: "", skip: "empty" };
  if (AD_HINT.test(text)) return { reply: "", skip: "ad" };
  const contact = findContact(cfg, peer, peerName);
  if (cfg.only_contacts && !contact) return { reply: "", skip: "not_contact" };
  if (!contact && !ORDER_HINT.test(text)) return { reply: "", skip: "no_hint" };

  // 카톡 알림은 같은 내용이 여러 번 올라옴 → 10분 내 동일 메시지 무시
  const since = new Date(Date.now() - 10 * 60e3).toISOString();
  const { data: dup } = await SB.from("msg_hub").select("id").eq("kind", "in").eq("peer", peer).eq("body", text).gte("created_at", since).limit(1);
  if (dup && dup.length) return { reply: "", skip: "dup" };

  let parsed: any = null, perr = "";
  try { parsed = await parseOrder(text, contact?.name || "", cfg); } catch (e) { perr = String((e as Error).message || e); }
  const isOrder = !!(parsed && parsed.is_order && parsed.items.length);
  if (!isOrder && !contact && !perr) return { reply: "", skip: "not_order" };

  const customer = contact?.name || parsed?.customer || peerName || peer;
  const { data: row } = await SB.from("msg_hub").insert({
    kind: "in", status: isOrder ? "new" : "ignored", ch, peer, peer_name: peerName, customer, body: text,
    parsed, meta: { contact: contact?.name || "", perr },
  }).select("id").single();

  let reply = "";
  if (isOrder && cfg.auto_reply !== false) {
    // 같은 상대에게 3분 내 자동답장 했으면 생략(대화 폭주 방지)
    const s3 = new Date(Date.now() - 3 * 60e3).toISOString();
    const { data: recent } = await SB.from("msg_hub").select("id").eq("kind", "in").eq("peer", peer).not("reply", "is", null).gte("created_at", s3).limit(1);
    if (!recent || !recent.length) {
      reply = fill(cfg.receipt_tpl || DEF_RECEIPT, {
        customer, items: itemsLine(parsed.items), due: parsed.due ? "희망일 " + parsed.due + "\n" : "",
      });
    }
  }
  // 카톡: 이 방으로 보내려고 쌓아둔 메시지가 있으면 이번 답장에 붙여서 내보냄
  if (ch === "kakao") {
    const { data: q } = await SB.from("msg_hub").select("id,body").eq("kind", "out").eq("ch", "kakao_reply").eq("status", "queued").eq("peer", peer).order("id");
    if (q && q.length) {
      reply = [reply, ...q.map((x: any) => x.body)].filter(Boolean).join("\n\n");
      await SB.from("msg_hub").update({ status: "sent", updated_at: now() }).in("id", q.map((x: any) => x.id));
    }
  }
  if (reply && row) await SB.from("msg_hub").update({ reply, updated_at: now() }).eq("id", row.id);
  if (isOrder) notifyStaff(cfg, "📨 새 주문 (" + (ch === "kakao" ? "카톡" : "문자") + ")", customer + ": " + itemsLine(parsed.items).replace(/\n/g, " ").slice(0, 80));
  return { reply, id: row?.id, order: isOrder };
}

async function handleSend(b: any) {
  const ch = String(b.ch || "");
  const to = ch === "kakao_reply" ? String(b.to || "").trim() : normPhone(b.to);
  const text = String(b.text || "").trim();
  if (!to || !text) throw new Error("받는 사람과 내용을 입력하세요");
  if (!["phone_sms", "kakao_reply", "api_sms", "alimtalk"].includes(ch)) throw new Error("발송 방식 오류");
  const { data: row, error } = await SB.from("msg_hub").insert({
    kind: "out", status: "queued", ch, peer: to, peer_name: b.name || "", customer: b.customer || b.name || "",
    body: text, meta: { ref: b.ref || null, by: b.by || "", tpl: b.tpl || null },
  }).select("*").single();
  if (error) throw new Error(error.message);
  if (ch === "api_sms" || ch === "alimtalk") {
    const cfg = await getCfg();
    try {
      const from = normPhone(cfg.sender || "");
      if (!from) throw new Error("발신번호 미설정(설정 탭)");
      const msg: any = { to, from, text };
      if (ch === "alimtalk") {
        if (!cfg.pf_id || !(b.tpl || cfg.tpl_id)) throw new Error("알림톡 채널(pfId)/템플릿 ID 미설정");
        msg.kakaoOptions = { pfId: cfg.pf_id, templateId: b.tpl || cfg.tpl_id, variables: b.vars || { "#{내용}": text }, disableSms: false };
      }
      const res = await solapiSend(msg);
      await SB.from("msg_hub").update({ status: "sent", updated_at: now(), meta: { ...row.meta, group: res.groupInfo?._id || "" } }).eq("id", row.id);
      return { ...row, status: "sent" };
    } catch (e) {
      const err = String((e as Error).message || e);
      await SB.from("msg_hub").update({ status: "failed", updated_at: now(), meta: { ...row.meta, err } }).eq("id", row.id);
      return { ...row, status: "failed", err };
    }
  }
  return row; // phone_sms / kakao_reply 는 휴대폰이 가져가서 보냄
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  const u = new URL(req.url);
  let b: any = {};
  if (req.method === "POST") {
    // MacroDroid는 JSON 본문에 따옴표·줄바꿈 이스케이프를 못 하므로 폼/쿼리 형식도 받는다
    const ct = req.headers.get("content-type") || "";
    const raw = await req.text().catch(() => "");
    if (ct.includes("json")) { try { b = JSON.parse(raw); } catch (_) { b = {}; } }
    else if (raw) new URLSearchParams(raw).forEach((v, k) => { b[k] = v; });
  }
  u.searchParams.forEach((v, k) => { if (b[k] === undefined) b[k] = v; });
  const act = String(b.action || "");
  const asText = b.fmt === "text";
  try {
    const cfg = await getCfg();
    const PHONE_ACTS = ["in", "next", "ack", "ping"];
    if (PHONE_ACTS.includes(act)) {
      if (!cfg.device_key || b.key !== cfg.device_key) return asText ? T("") : J({ error: "bad key" }, 401);
      // 휴대폰 생존 신호 (1분에 한 번만 기록)
      if (!cfg.last_seen || Date.now() - Date.parse(cfg.last_seen) > 60e3) patchCfg({ last_seen: now(), last_seen_act: act });
    }
    if (act === "ping") return asText ? T("ok") : J({ ok: true });
    if (act === "in") {
      const r = await handleIn(b, cfg);
      return asText ? T(r.reply || "") : J(r);
    }
    if (act === "next") {
      // 다른 휴대폰이 가져갔는데 2분 넘게 응답이 없으면 다시 대기열로
      await SB.from("msg_hub").update({ status: "queued" }).eq("kind", "out").eq("ch", "phone_sms").eq("status", "sending").lt("updated_at", new Date(Date.now() - 120e3).toISOString());
      const { data } = await SB.from("msg_hub").select("id,peer,body").eq("kind", "out").eq("ch", "phone_sms").eq("status", "queued").order("id").limit(1);
      const it = data && data[0];
      if (!it) return asText ? T("") : J({ id: 0, to: "", text: "" });
      await SB.from("msg_hub").update({ status: "sending", updated_at: now() }).eq("id", it.id);
      if (asText) return T(it.id + "\n" + it.peer + "\n" + it.body);
      return J({ id: it.id, to: it.peer, text: it.body });
    }
    if (act === "ack") {
      const id = parseInt(String(b.id || "0"));
      const ok = String(b.ok ?? "1") !== "0";
      await SB.from("msg_hub").update({ status: ok ? "sent" : "failed", updated_at: now() }).eq("id", id).eq("kind", "out");
      return asText ? T("ok") : J({ ok: true });
    }

    /* ── MES 화면 ── */
    if (act === "list") {
      const lim = Math.min(300, parseInt(String(b.limit || "150")));
      let q = SB.from("msg_hub").select("*").order("id", { ascending: false }).limit(lim);
      if (b.kind) q = q.eq("kind", b.kind);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      const { device_key: _k, ...safe } = cfg;
      return J({ rows: data || [], cfg: safe, has_solapi: !!(SOL_KEY && SOL_SECRET), has_gemini: !!GEMINI });
    }
    if (act === "cfg_get") return J({ cfg, has_solapi: !!(SOL_KEY && SOL_SECRET), has_gemini: !!GEMINI });
    if (act === "cfg_set") {
      const p = { ...(b.patch || {}) };
      delete p.device_key; delete p.last_seen;
      if (b.new_key) p.device_key = crypto.randomUUID().replace(/-/g, "").slice(0, 24);
      return J({ cfg: await patchCfg(p) });
    }
    if (act === "update") {
      const id = parseInt(String(b.id || "0"));
      const p: any = { updated_at: now() };
      ["status", "customer", "parsed", "meta"].forEach((k) => { if (b.patch && b.patch[k] !== undefined) p[k] = b.patch[k]; });
      const { data, error } = await SB.from("msg_hub").update(p).eq("id", id).select("*").single();
      if (error) throw new Error(error.message);
      return J({ row: data });
    }
    if (act === "reparse") {
      const id = parseInt(String(b.id || "0"));
      const { data: r } = await SB.from("msg_hub").select("*").eq("id", id).single();
      if (!r) throw new Error("없음");
      const parsed = await parseOrder(r.body, r.customer || "", cfg);
      const { data } = await SB.from("msg_hub").update({ parsed, status: parsed.is_order ? "new" : r.status, updated_at: now() }).eq("id", id).select("*").single();
      return J({ row: data });
    }
    if (act === "send") return J({ row: await handleSend(b) });
    if (act === "test_in") {
      // MES 화면의 '인식 테스트' — 저장·답장 없이 AI 결과만
      return J({ parsed: await parseOrder(String(b.text || ""), String(b.customer || ""), cfg), receipt_tpl: cfg.receipt_tpl || DEF_RECEIPT });
    }
    return J({ error: "unknown action" }, 400);
  } catch (e) {
    const msg = String((e as Error).message || e);
    return asText ? T("") : J({ error: msg }, 500);
  }
});
