"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { orderStatusAction, updateOrderItemsAction, requeueOrderAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { STORAGE_LABEL, STORAGE_COLOR } from "@/lib/constants";
import { formatNumber } from "@/lib/utils";

export function OrderActions({ orderId, status, erpStatus, isAdmin }: { orderId: string; status: string; erpStatus: string; isAdmin: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [reasonFor, setReasonFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const change = (toStatus: string, withReason?: string) => {
    setError(null);
    startTransition(async () => {
      const r = await orderStatusAction(orderId, toStatus, withReason);
      if (!r.ok) setError(r.error ?? "실패했습니다.");
      else { setReasonFor(null); setReason(""); router.refresh(); }
    });
  };

  const NEEDS_REASON = ["REJECTED", "CANCELLED"];
  const buttons: { to: string; label: string; variant?: "primary" | "outline" | "danger-outline"; adminOnly?: boolean }[] = [];
  if (status === "PENDING") buttons.push(
    { to: "CONFIRMED", label: "주문 확정 (ERP 전송)", adminOnly: true },
    { to: "REJECTED", label: "반려", variant: "danger-outline", adminOnly: true },
  );
  if (status === "CONFIRMED") buttons.push(
    { to: "PICKING", label: "피킹 시작" },
    { to: "CANCELLED", label: "주문 취소", variant: "danger-outline", adminOnly: true },
  );
  if (status === "PICKING") buttons.push({ to: "PICKED", label: "피킹 완료" });
  if (["PICKED", "PARTIALLY_SHIPPED"].includes(status)) buttons.push({ to: "SHIPPED", label: "출고 완료" });
  if (["SHIPPED", "PARTIALLY_SHIPPED"].includes(status)) buttons.push({ to: "DELIVERED", label: "배송 완료" });
  if (status === "CANCEL_REQUESTED") buttons.push(
    { to: "CANCELLED", label: "취소 승인", variant: "danger-outline", adminOnly: true },
    { to: "CONFIRMED", label: "취소 거부 (확정 유지)", variant: "outline", adminOnly: true },
  );

  return (
    <div className="space-y-2">
      {buttons.filter((b) => !b.adminOnly || isAdmin).map((b) => (
        <Button
          key={b.to} variant={b.variant ?? "primary"} className="w-full" disabled={pending}
          onClick={() => (NEEDS_REASON.includes(b.to) ? setReasonFor(b.to) : change(b.to))}
        >
          {b.label}
        </Button>
      ))}
      {isAdmin && ["FAILED", "MANUAL_REVIEW", "NOT_READY"].includes(erpStatus) && status !== "PENDING" && !["CANCELLED", "REJECTED"].includes(status) && (
        <Button variant="outline" className="w-full" disabled={pending}
          onClick={() => startTransition(async () => { await requeueOrderAction(orderId); router.refresh(); })}>
          ERP 수동 재전송
        </Button>
      )}
      {reasonFor && (
        <div className="rounded-xl border border-red-100 bg-red-50/50 p-3">
          <Textarea rows={2} placeholder="사유 입력" value={reason} onChange={(e) => setReason(e.target.value)} />
          <div className="mt-2 flex gap-2">
            <Button size="sm" variant="outline" className="flex-1" onClick={() => setReasonFor(null)}>취소</Button>
            <Button size="sm" variant="danger" className="flex-1" disabled={pending || !reason.trim()} onClick={() => change(reasonFor, reason)}>확인</Button>
          </div>
        </div>
      )}
      {buttons.length === 0 && <p className="py-2 text-center text-sm text-gray-400">처리할 작업이 없습니다.</p>}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-danger">{error}</p>}
    </div>
  );
}

interface EditableItem {
  id: string; name: string; spec: string; storage: string; itemCode: string;
  qty: number; shippedQty: number; unitPrice: number; supply: number; vat: number;
}

export function OrderItemEditor({ orderId, items, editable }: { orderId: string; items: EditableItem[]; editable: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [qtys, setQtys] = useState<Map<string, number>>(new Map(items.map((i) => [i.id, i.qty])));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const save = () => {
    const changes = items.filter((i) => qtys.get(i.id) !== i.qty).map((i) => ({ orderItemId: i.id, qty: qtys.get(i.id) ?? i.qty }));
    if (changes.length === 0) { setEditing(false); return; }
    startTransition(async () => {
      const r = await updateOrderItemsAction(orderId, changes, reason || "관리자 수정");
      if (!r.ok) setError(r.error ?? "저장 실패");
      else { setEditing(false); setReason(""); router.refresh(); }
    });
  };

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs text-muted">
              <th className="py-2 pr-3">품목</th>
              <th className="py-2 pr-3">품목코드</th>
              <th className="py-2 pr-3 text-right">단가</th>
              <th className="py-2 pr-3 text-right">수량</th>
              <th className="py-2 pr-3 text-right">출고수량</th>
              <th className="py-2 text-right">공급가+VAT</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => (
              <tr key={it.id} className="border-b border-gray-50">
                <td className="py-2 pr-3">
                  <div className="flex items-center gap-1.5">
                    <Badge className={STORAGE_COLOR[it.storage]}>{STORAGE_LABEL[it.storage]}</Badge>
                    <span className="font-medium">{it.name}</span>
                    <span className="text-xs text-muted">{it.spec}</span>
                  </div>
                </td>
                <td className="py-2 pr-3 text-gray-500">{it.itemCode || "-"}</td>
                <td className="py-2 pr-3 text-right">{formatNumber(it.unitPrice)}</td>
                <td className="py-2 pr-3 text-right">
                  {editing ? (
                    <Input
                      type="number" className="ml-auto h-8 w-20 text-right"
                      value={qtys.get(it.id) ?? it.qty}
                      min={0}
                      onChange={(e) => {
                        const v = Math.max(0, parseInt(e.target.value || "0", 10));
                        setQtys((prev) => new Map(prev).set(it.id, v));
                      }}
                    />
                  ) : (
                    <b>{it.qty}</b>
                  )}
                </td>
                <td className="py-2 pr-3 text-right">{it.shippedQty || "-"}</td>
                <td className="py-2 text-right">{formatNumber(it.supply + it.vat)}원</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {editable && (
        <div className="mt-3">
          {!editing ? (
            <Button size="sm" variant="outline" onClick={() => setEditing(true)}>수량 수정</Button>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <Input className="h-9 w-64" placeholder="수정 사유 (가맹점에 알림됩니다)" value={reason} onChange={(e) => setReason(e.target.value)} />
              <Button size="sm" disabled={pending} onClick={save}>{pending ? "저장 중..." : "저장"}</Button>
              <Button size="sm" variant="outline" onClick={() => { setEditing(false); setQtys(new Map(items.map((i) => [i.id, i.qty]))); }}>취소</Button>
              <span className="text-xs text-muted">수량 0 = 품목 삭제</span>
            </div>
          )}
          {error && <p className="mt-2 text-xs text-danger">{error}</p>}
        </div>
      )}
    </div>
  );
}
