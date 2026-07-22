"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { syncStocksAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function SyncStocksButton() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-sm text-muted">{msg}</span>}
      <Button
        variant="outline" disabled={pending}
        onClick={() => startTransition(async () => {
          const r = await syncStocksAction();
          setMsg(`${r.updated}개 품목 재고 반영됨`);
          router.refresh();
        })}
      >
        <RefreshCw size={16} className={pending ? "animate-spin" : ""} /> 재고 동기화
      </Button>
    </div>
  );
}
