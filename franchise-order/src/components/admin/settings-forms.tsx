"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateDeliveryRuleAction, addHolidayAction, removeHolidayAction, setStockDisplayAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { DOW_LABEL } from "@/lib/constants";

interface RuleState {
  weekdayCutoff: string; allowSaturdayOrder: boolean; allowHolidayOrder: boolean;
  minLeadDays: number; allowSameDay: boolean; shipDays: number[];
}

export function DeliveryRuleForm({ initial }: { initial: RuleState }) {
  const router = useRouter();
  const [rule, setRule] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <div><Label>평일 주문 마감시간</Label><Input type="time" value={rule.weekdayCutoff} onChange={(e) => setRule({ ...rule, weekdayCutoff: e.target.value })} /></div>
        <div><Label>최소 리드타임 (일)</Label><Input type="number" min={0} max={14} value={rule.minLeadDays} onChange={(e) => setRule({ ...rule, minLeadDays: parseInt(e.target.value || "1", 10) })} /></div>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={rule.allowSaturdayOrder} onChange={(e) => setRule({ ...rule, allowSaturdayOrder: e.target.checked })} className="h-4 w-4 accent-orange-500" /> 토요일 주문 허용</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={rule.allowHolidayOrder} onChange={(e) => setRule({ ...rule, allowHolidayOrder: e.target.checked })} className="h-4 w-4 accent-orange-500" /> 공휴일 주문 허용</label>
        <label className="flex items-center gap-1.5"><input type="checkbox" checked={rule.allowSameDay} onChange={(e) => setRule({ ...rule, allowSameDay: e.target.checked })} className="h-4 w-4 accent-orange-500" /> 당일 출고 허용</label>
      </div>
      <div>
        <Label>출고 가능 요일</Label>
        <div className="flex gap-3 text-sm">
          {DOW_LABEL.map((d, i) => (
            <label key={i} className="flex items-center gap-1">
              <input type="checkbox" checked={rule.shipDays.includes(i)} className="h-4 w-4 accent-orange-500"
                onChange={(e) => setRule({ ...rule, shipDays: e.target.checked ? [...rule.shipDays, i].sort() : rule.shipDays.filter((x) => x !== i) })} />
              {d}
            </label>
          ))}
        </div>
      </div>
      {msg && <p className="text-sm text-muted">{msg}</p>}
      <Button disabled={pending} onClick={() => startTransition(async () => {
        const r = await updateDeliveryRuleAction(rule);
        setMsg(r.ok ? "저장되었습니다." : r.error ?? "실패");
        router.refresh();
      })}>
        {pending ? "저장 중..." : "저장"}
      </Button>
      <p className="text-xs text-muted">예: 마감 15:00, 리드타임 1일 → 월요일 15시 이전 주문은 화요일 출고, 15시 이후 주문은 수요일 출고.</p>
    </div>
  );
}

export function HolidayManager({ holidays }: { holidays: { id: string; date: string; name: string | null }[] }) {
  const router = useRouter();
  const [date, setDate] = useState("");
  const [name, setName] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <ul className="flex flex-wrap gap-2">
        {holidays.length === 0 && <p className="text-sm text-gray-400">등록된 휴무일이 없습니다.</p>}
        {holidays.map((h) => (
          <li key={h.id} className="flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-sm">
            <span className="font-medium">{h.date}</span>
            {h.name && <span className="text-muted">{h.name}</span>}
            <button className="ml-1 text-gray-400 hover:text-danger" disabled={pending}
              onClick={() => startTransition(async () => { await removeHolidayAction(h.id); router.refresh(); })}>
              ✕
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex gap-2">
        <Input type="date" className="w-44" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input className="w-44" placeholder="이름 (예: 설날)" value={name} onChange={(e) => setName(e.target.value)} />
        <Button variant="outline" disabled={pending || !date}
          onClick={() => startTransition(async () => {
            await addHolidayAction(date, name);
            setDate(""); setName("");
            router.refresh();
          })}>
          추가
        </Button>
      </div>
    </div>
  );
}

const STOCK_MODES = [
  { key: "EXACT", label: "정확한 숫자 공개" },
  { key: "LEVEL", label: "충분/부족/품절만" },
  { key: "SOLDOUT_ONLY", label: "품절만 표시" },
  { key: "HIDDEN", label: "재고 숨김" },
];

export function StockDisplayForm({ current }: { current: string }) {
  const router = useRouter();
  const [mode, setMode] = useState(current);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      {STOCK_MODES.map((m) => (
        <button
          key={m.key} disabled={pending}
          onClick={() => {
            setMode(m.key);
            startTransition(async () => { await setStockDisplayAction(m.key); router.refresh(); });
          }}
          className={`rounded-full px-4 py-2 text-sm font-semibold ${mode === m.key ? "bg-primary text-white" : "border border-border bg-white text-gray-600"}`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
