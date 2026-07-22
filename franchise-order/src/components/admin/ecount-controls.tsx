"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { testEcountConnectionAction, runSyncQueueAction, retrySyncJobAction, setMockFailAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

export function EcountControls() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={pending}
          onClick={() => startTransition(async () => {
            const r = await testEcountConnectionAction();
            setMsg(`[${r.mode}] ${r.message}`);
          })}>
          연결 테스트
        </Button>
        <Button size="sm" disabled={pending}
          onClick={() => startTransition(async () => {
            const r = await runSyncQueueAction();
            setMsg(`큐 처리: ${r.processed}건 (성공 ${r.success} / 실패 ${r.failed})`);
            router.refresh();
          })}>
          전송 큐 지금 실행
        </Button>
        <Button variant="outline" size="sm" disabled={pending}
          onClick={() => startTransition(async () => {
            await setMockFailAction(true);
            setMsg("다음 Mock 전송 1회가 강제 실패하도록 설정했습니다. (재시도 흐름 테스트용)");
          })}>
          Mock 실패 시뮬레이션
        </Button>
      </div>
      {msg && <p className="mt-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">{msg}</p>}
    </div>
  );
}

export function RetryJobButton({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Button size="sm" variant="outline" disabled={pending}
      onClick={() => startTransition(async () => { await retrySyncJobAction(jobId); router.refresh(); })}>
      {pending ? "..." : "재전송"}
    </Button>
  );
}
