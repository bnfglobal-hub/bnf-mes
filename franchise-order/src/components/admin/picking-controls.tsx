"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Printer } from "lucide-react";
import { orderStatusAction, setPickedQtyAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function PickingControls({ orderId, status }: { orderId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const next = status === "CONFIRMED" ? { to: "PICKING", label: "피킹 시작" }
    : status === "PICKING" ? { to: "PICKED", label: "피킹 완료" }
    : null;
  if (!next) return null;
  return (
    <Button
      size="sm" variant={status === "PICKING" ? "primary" : "outline"} disabled={pending}
      onClick={() => startTransition(async () => { await orderStatusAction(orderId, next.to); router.refresh(); })}
    >
      {pending ? "처리 중..." : next.label}
    </Button>
  );
}

export function PickedQtyInput({ orderItemId, qty, shippedQty, disabled }: { orderItemId: string; qty: number; shippedQty: number; disabled?: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(shippedQty || "");
  const [pending, startTransition] = useTransition();

  const save = (v: number) => {
    startTransition(async () => {
      await setPickedQtyAction(orderItemId, v);
      router.refresh();
    });
  };

  return (
    <span className="inline-flex items-center gap-1">
      <input
        type="number" inputMode="numeric" disabled={disabled || pending}
        value={value} min={0} max={qty}
        placeholder="0"
        onChange={(e) => setValue(e.target.value)}
        onBlur={() => { const v = parseInt(String(value) || "0", 10); if (!Number.isNaN(v)) save(Math.max(0, Math.min(qty, v))); }}
        className="h-8 w-16 rounded-lg border border-border px-1 text-right text-sm outline-none focus:border-primary disabled:bg-gray-50"
      />
      {!disabled && (
        <button
          className="text-xs font-semibold text-primary disabled:opacity-40" disabled={pending}
          onClick={() => { setValue(qty); save(qty); }}
          title="전량 피킹"
        >
          전량
        </button>
      )}
    </span>
  );
}

export function PrintButton() {
  return (
    <Button variant="outline" size="sm" onClick={() => window.print()}>
      <Printer size={15} /> 인쇄
    </Button>
  );
}
