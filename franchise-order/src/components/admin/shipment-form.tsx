"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createShipmentAction, orderStatusAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ShipmentForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [driver, setDriver] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [tracking, setTracking] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) {
    return <Button size="sm" onClick={() => setOpen(true)}>출고 처리</Button>;
  }
  return (
    <div className="w-full rounded-xl bg-gray-50 p-3">
      <div className="grid grid-cols-3 gap-2">
        <Input className="h-9 bg-white" placeholder="배송기사" value={driver} onChange={(e) => setDriver(e.target.value)} />
        <Input className="h-9 bg-white" placeholder="차량번호" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
        <Input className="h-9 bg-white" placeholder="운송장번호" value={tracking} onChange={(e) => setTracking(e.target.value)} />
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      <div className="mt-2 flex justify-end gap-2">
        <Button size="sm" variant="outline" onClick={() => setOpen(false)}>취소</Button>
        <Button
          size="sm" disabled={pending}
          onClick={() => startTransition(async () => {
            const r = await createShipmentAction({ orderId, driverName: driver || undefined, vehicleNo: vehicle || undefined, trackingNo: tracking || undefined });
            if (!r.ok) setError(("error" in r ? r.error : null) ?? "실패했습니다.");
            else { setOpen(false); router.refresh(); }
          })}
        >
          {pending ? "처리 중..." : "출고 확정"}
        </Button>
      </div>
    </div>
  );
}

export function DeliveredButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button size="sm" variant="outline" disabled={pending}
      onClick={() => startTransition(async () => { await orderStatusAction(orderId, "DELIVERED"); router.refresh(); })}>
      배송 완료
    </Button>
  );
}
