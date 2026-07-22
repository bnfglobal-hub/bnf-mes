"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateClaimAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { CLAIM_STATUS_LABEL } from "@/lib/constants";

export function ClaimAdminControls({ claimId, status, adminNote }: { claimId: string; status: string; adminNote: string | null }) {
  const router = useRouter();
  const [newStatus, setNewStatus] = useState(status);
  const [note, setNote] = useState(adminNote ?? "");
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select className="h-9 w-40" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
        {Object.entries(CLAIM_STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
      </Select>
      <Input className="h-9 flex-1 min-w-48" placeholder="처리 메모 (가맹점에 표시됩니다)" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button size="sm" disabled={pending}
        onClick={() => startTransition(async () => {
          const r = await updateClaimAction(claimId, newStatus, note || undefined);
          setMsg(r.ok ? "저장됨" : r.error ?? "실패");
          router.refresh();
        })}>
        {pending ? "저장 중..." : "저장"}
      </Button>
      {msg && <span className="text-xs text-muted">{msg}</span>}
    </div>
  );
}
