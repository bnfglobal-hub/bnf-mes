"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { reorderAction } from "@/app/app/actions";

export function ReorderButton({ orderId, children }: { orderId: string; children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div>
      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const r = await reorderAction(orderId);
            if (r.ok) {
              setMsg(r.skipped > 0 ? `${r.added}개 담김 (품절 등 ${r.skipped}개 제외)` : null);
              if (r.skipped === 0) router.push("/app/cart");
              else router.refresh();
            } else {
              setMsg(r.error ?? "오류가 발생했습니다.");
            }
          })
        }
        className="flex items-center gap-1 text-[13px] font-semibold text-primary disabled:opacity-50"
      >
        {pending ? "담는 중..." : children}
      </button>
      {msg && <p className="mt-1 text-xs text-amber-600">{msg}</p>}
    </div>
  );
}
