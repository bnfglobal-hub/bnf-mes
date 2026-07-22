"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingCart, CheckCircle2 } from "lucide-react";
import { formatNumber } from "@/lib/utils";
import { STORAGE_LABEL, STORAGE_COLOR } from "@/lib/constants";
import { calcOrderTotals, checkMinOrderAmount } from "@/lib/domain/pricing";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { setCartItemAction, clearCartAction, placeOrderAction } from "@/app/app/actions";
import type { CatalogItem } from "@/lib/franchise-data";

interface StoreCfg {
  minOrderAmount: number;
  minAmountBasis: "SUPPLY" | "WITH_VAT";
  deliveryFee: number;
  freeDeliveryThreshold: number | null;
  orderBlocked: boolean;
}

export function CartView({
  catalog, cartLines, addresses, store, plannedShipDate,
}: {
  catalog: CatalogItem[];
  cartLines: { productId: string; qty: number }[];
  addresses: { id: string; label: string; address1: string; address2: string | null; is_default: boolean }[];
  store: StoreCfg;
  plannedShipDate: string;
}) {
  const router = useRouter();
  const [lines, setLines] = useState(cartLines);
  const [memo, setMemo] = useState("");
  const [addressId, setAddressId] = useState<string | undefined>(addresses.find((a) => a.is_default)?.id);
  const [confirming, setConfirming] = useState(false);
  const [result, setResult] = useState<{ orderNo: string; shipDate?: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const requestIdRef = useRef<string>(crypto.randomUUID());
  const submittingRef = useRef(false);

  const entries = useMemo(() => {
    return lines
      .map((l) => ({ line: l, item: catalog.find((c) => c.productId === l.productId) }))
      .filter((e): e is { line: { productId: string; qty: number }; item: CatalogItem } => !!e.item);
  }, [lines, catalog]);

  const totals = useMemo(() => calcOrderTotals(
    entries.filter((e) => !e.item.isSoldout).map((e) => ({ qty: e.line.qty, unitPrice: e.item.unitPrice, taxType: e.item.taxType })),
    { deliveryFee: store.deliveryFee, freeDeliveryThreshold: store.freeDeliveryThreshold, basis: store.minAmountBasis }
  ), [entries, store]);

  const minCheck = checkMinOrderAmount(totals, store.minOrderAmount, store.minAmountBasis);
  const hasSoldout = entries.some((e) => e.item.isSoldout);
  const canSubmit = entries.length > 0 && minCheck.ok && !store.orderBlocked && !pending;

  const setQty = (item: CatalogItem, qty: number) => {
    const clamped = Math.max(0, Math.min(qty, item.maxQty ?? 9999));
    setLines((prev) => clamped === 0
      ? prev.filter((l) => l.productId !== item.productId)
      : prev.map((l) => (l.productId === item.productId ? { ...l, qty: clamped } : l)));
    startTransition(async () => { await setCartItemAction(item.productId, clamped); });
  };

  const submit = () => {
    if (submittingRef.current) return; // 연속 클릭 방지
    submittingRef.current = true;
    setError(null);
    startTransition(async () => {
      const r = await placeOrderAction({
        memo: memo || undefined,
        addressId,
        clientRequestId: requestIdRef.current,
      });
      if (r.ok && r.orderNo) {
        setResult({ orderNo: r.orderNo, shipDate: r.plannedShipDate });
        setConfirming(false);
      } else {
        setError(r.error ?? "주문에 실패했습니다.");
        setConfirming(false);
        submittingRef.current = false;
        requestIdRef.current = crypto.randomUUID();
      }
    });
  };

  // 주문 완료 화면
  if (result) {
    return (
      <div className="flex flex-col items-center px-4 py-16 text-center">
        <CheckCircle2 size={56} className="text-success" />
        <h2 className="mt-4 text-xl font-bold">주문이 접수되었습니다</h2>
        <p className="mt-2 text-sm text-muted">주문번호</p>
        <p className="text-lg font-bold text-primary">{result.orderNo}</p>
        {result.shipDate && <p className="mt-2 text-sm text-gray-600">예상 출고일: <b>{result.shipDate}</b></p>}
        <p className="mt-1 text-xs text-muted">본사 확정 후 출고가 진행됩니다.</p>
        <div className="mt-8 flex w-full max-w-xs flex-col gap-2">
          <Button size="lg" onClick={() => router.push("/app/orders")}>주문내역 보기</Button>
          <Button size="lg" variant="outline" onClick={() => router.push("/app/products")}>계속 쇼핑하기</Button>
        </div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center py-24 text-gray-400">
        <ShoppingCart size={48} strokeWidth={1.2} />
        <p className="mt-3 text-sm">장바구니가 비어 있습니다.</p>
        <Link href="/app/products" className="mt-4 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white">
          상품 보러가기
        </Link>
      </div>
    );
  }

  const grouped: Record<string, typeof entries> = {};
  for (const e of entries) (grouped[e.item.storageType] ??= []).push(e);

  return (
    <div className="pb-40">
      <div className="flex items-center justify-between px-4 pt-2">
        <p className="text-sm text-muted">{entries.length}개 상품</p>
        <button
          onClick={() => { setLines([]); startTransition(async () => { await clearCartAction(); }); }}
          className="text-xs text-gray-400 underline"
        >
          전체 삭제
        </button>
      </div>

      {(["FROZEN", "CHILLED", "ROOM"] as const).filter((s) => grouped[s]?.length).map((storage) => (
        <section key={storage} className="mt-3 px-4">
          <Badge className={STORAGE_COLOR[storage]}>{STORAGE_LABEL[storage]}</Badge>
          <ul className="mt-2 space-y-2">
            {grouped[storage].map(({ line, item }) => (
              <li key={item.productId} className={`rounded-2xl border p-3.5 ${item.isSoldout ? "border-red-100 bg-red-50/50" : "border-border bg-white"}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-[15px] font-semibold">{item.name}</p>
                    <p className="text-xs text-muted">{item.spec} · {formatNumber(item.unitPrice)}원 {item.taxType === "TAXABLE" ? "(VAT 별도)" : "(면세)"}</p>
                    {item.isSoldout && <p className="mt-1 text-xs font-semibold text-danger">품절 — 주문에서 제외됩니다</p>}
                  </div>
                  <button onClick={() => setQty(item, 0)} className="p-1.5 text-gray-300" aria-label="삭제">
                    <Trash2 size={17} />
                  </button>
                </div>
                {!item.isSoldout && (
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-0.5 rounded-xl border border-border bg-white">
                      <button className="flex h-10 w-10 items-center justify-center" onClick={() => setQty(item, line.qty - item.qtyStep < item.minQty ? 0 : line.qty - item.qtyStep)} aria-label="감소"><Minus size={16} /></button>
                      <input
                        type="number" inputMode="numeric" value={line.qty}
                        onChange={(e) => { const v = parseInt(e.target.value || "0", 10); if (!Number.isNaN(v)) setQty(item, v); }}
                        className="w-11 border-0 bg-transparent text-center text-[15px] font-bold outline-none"
                      />
                      <button className="flex h-10 w-10 items-center justify-center text-primary" onClick={() => setQty(item, line.qty + item.qtyStep)} aria-label="증가"><Plus size={16} /></button>
                    </div>
                    <p className="text-[15px] font-bold">{formatNumber(item.unitPrice * line.qty)}원</p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {/* 배송지 / 메모 */}
      <section className="mt-5 px-4">
        {addresses.length > 0 && (
          <div className="mb-3">
            <p className="mb-1.5 text-sm font-semibold">배송지</p>
            <div className="space-y-1.5">
              {addresses.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAddressId(a.id)}
                  className={`w-full rounded-xl border px-3.5 py-3 text-left text-sm ${addressId === a.id ? "border-primary bg-primary-light" : "border-border bg-white"}`}
                >
                  <span className="font-semibold">{a.label}</span>
                  <span className="ml-2 text-muted">{a.address1} {a.address2 ?? ""}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <p className="mb-1.5 text-sm font-semibold">주문 메모</p>
        <Textarea rows={2} maxLength={500} placeholder="요청사항을 입력해주세요 (선택)" value={memo} onChange={(e) => setMemo(e.target.value)} />
      </section>

      {/* 금액 요약 */}
      <section className="mt-4 px-4">
        <div className="rounded-2xl bg-gray-50 p-4 text-sm">
          <div className="flex justify-between py-0.5"><span className="text-muted">공급가</span><span>{formatNumber(totals.supplyAmount)}원</span></div>
          <div className="flex justify-between py-0.5"><span className="text-muted">부가세</span><span>{formatNumber(totals.vatAmount)}원</span></div>
          <div className="flex justify-between py-0.5"><span className="text-muted">배송비</span><span>{totals.deliveryFee === 0 ? "무료" : `${formatNumber(totals.deliveryFee)}원`}</span></div>
          <div className="mt-1.5 flex justify-between border-t border-gray-200 pt-2 text-base font-bold">
            <span>결제 예정금액</span><span className="text-primary">{formatNumber(totals.totalAmount)}원</span>
          </div>
        </div>
        {hasSoldout && <p className="mt-2 text-xs text-amber-600">품절 상품은 주문에서 자동 제외됩니다.</p>}
      </section>

      {/* 하단 고정 주문 바 */}
      <div className="fixed inset-x-0 bottom-[56px] z-30 mx-auto max-w-lg border-t border-border bg-white px-4 py-3">
        {!minCheck.ok && (
          <p className="mb-2 text-center text-[13px] font-semibold text-danger">
            최소 주문금액 {formatNumber(store.minOrderAmount)}원까지 <u>{formatNumber(minCheck.shortage)}원</u> 남았습니다.
          </p>
        )}
        {error && <p className="mb-2 rounded-lg bg-red-50 px-3 py-2 text-center text-[13px] text-danger">{error}</p>}
        <Button size="lg" className="w-full" disabled={!canSubmit} onClick={() => setConfirming(true)}>
          {store.orderBlocked ? "주문 차단됨 (본사 문의)" : `${formatNumber(totals.totalAmount)}원 주문하기`}
        </Button>
      </div>

      {/* 최종 확인 모달 */}
      {confirming && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => !pending && setConfirming(false)}>
          <div className="w-full max-w-lg rounded-t-3xl bg-white p-5 pb-safe sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold">주문을 확정할까요?</h3>
            <div className="mt-3 rounded-xl bg-gray-50 p-3.5 text-sm">
              <div className="flex justify-between py-0.5"><span className="text-muted">상품</span><span>{entries.filter((e) => !e.item.isSoldout).length}개 품목</span></div>
              <div className="flex justify-between py-0.5"><span className="text-muted">총 금액</span><span className="font-bold">{formatNumber(totals.totalAmount)}원</span></div>
              <div className="flex justify-between py-0.5"><span className="text-muted">예상 출고일</span><span>{plannedShipDate}</span></div>
            </div>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" size="lg" className="flex-1" disabled={pending} onClick={() => setConfirming(false)}>취소</Button>
              <Button size="lg" className="flex-1" disabled={pending} onClick={submit}>
                {pending ? "주문 중..." : "주문 확정"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
