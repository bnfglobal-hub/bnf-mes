"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, Store } from "lucide-react";
import { setGeneralProductsAction, importEcountItemsAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";

/** 상품 목록을 감싸 체크박스 일괄 선택 → 공산품 지정/해제를 처리한다. */
export function GeneralProductBulkBar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const selectedIds = () =>
    [...(ref.current?.querySelectorAll<HTMLInputElement>("input[data-product-id]:checked") ?? [])].map((el) => el.dataset.productId!);

  const apply = (isGeneral: boolean) => {
    const ids = selectedIds();
    if (ids.length === 0) { setMsg("상품을 먼저 선택하세요."); return; }
    startTransition(async () => {
      const r = await setGeneralProductsAction(ids, isGeneral);
      setMsg(r.ok ? `${r.count}개 상품을 공산품으로 ${isGeneral ? "지정" : "해제"}했습니다.` : r.error ?? "실패");
      router.refresh();
    });
  };

  const toggleAll = (checked: boolean) => {
    ref.current?.querySelectorAll<HTMLInputElement>("input[data-product-id]").forEach((el) => { el.checked = checked; });
  };

  return (
    <div ref={ref}>
      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-white px-3 py-2.5">
        <label className="flex items-center gap-1.5 text-sm text-gray-600">
          <input type="checkbox" className="h-4 w-4 accent-orange-500" onChange={(e) => toggleAll(e.target.checked)} />
          전체 선택
        </label>
        <span className="mx-1 h-4 w-px bg-border" />
        <Button size="sm" disabled={pending} onClick={() => apply(true)}>
          <Store size={15} /> 선택 상품을 공산품으로 지정
        </Button>
        <Button size="sm" variant="outline" disabled={pending} onClick={() => apply(false)}>
          공산품 해제
        </Button>
        <span className="text-xs text-muted">공산품으로 지정하면 전 거래처에 노출됩니다.</span>
        {msg && <span className="text-sm font-medium text-primary">{msg}</span>}
      </div>
      {children}
    </div>
  );
}

/** 이카운트 품목 마스터를 내부 상품으로 가져오기 */
export function ImportEcountItemsButton() {
  const router = useRouter();
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  return (
    <div className="flex items-center gap-2">
      {msg && <span className="text-sm text-muted">{msg}</span>}
      <Button variant="outline" size="sm" className="h-10" disabled={pending}
        onClick={() => startTransition(async () => {
          setMsg("가져오는 중...");
          const r = await importEcountItemsAction();
          setMsg(r.ok ? `이카운트 ${r.total}개 품목 중 신규 ${r.added}개 등록, ${r.updated}개 품명 갱신` : ("error" in r ? r.error : null) ?? "실패");
          router.refresh();
        })}>
        <Download size={15} /> 이카운트 품목 가져오기
      </Button>
    </div>
  );
}
