"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { previewTradeImportAction, applyTradeImportAction, type TradePreview } from "@/app/admin/trade-import/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export function TradeImportForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [preview, setPreview] = useState<TradePreview | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div>
      <Textarea
        rows={8}
        value={text}
        onChange={(e) => { setText(e.target.value); setPreview(null); setResult(null); }}
        placeholder={"이카운트 판매현황 표를 복사해 붙여넣으세요.\n예)\n거래처코드\t품목코드\nC-GN001\tI-NM500\nC-GN001\tI-GB1K"}
        className="font-mono text-xs"
      />
      <div className="mt-3 flex gap-2">
        <Button variant="outline" disabled={pending || !text.trim()}
          onClick={() => startTransition(async () => {
            const r = await previewTradeImportAction(text);
            setPreview(r); setResult(null);
          })}>
          {pending ? "분석 중..." : "1. 미리보기 (검증)"}
        </Button>
        <Button disabled={pending || !preview || preview.matched.length === 0}
          onClick={() => startTransition(async () => {
            const r = await applyTradeImportAction(text);
            setResult(r.ok ? `적용 완료 — 신규 부여 ${r.added}건, 이미 부여됨 ${r.skipped}건` : r.error ?? "실패");
            setPreview(null);
            router.refresh();
          })}>
          2. 취급상품으로 부여
        </Button>
      </div>

      {result && <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700">{result}</p>}

      {preview && (
        <div className="mt-4 space-y-3 text-sm">
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-emerald-50 text-emerald-600">매칭 {preview.matched.length}건</Badge>
            <Badge className="bg-amber-50 text-amber-700">미등록 거래처 {preview.unknownCustomers.length}</Badge>
            <Badge className="bg-red-50 text-danger">미등록 품목 {preview.unknownItems.length}</Badge>
            <Badge className="bg-gray-100 text-gray-500">이미 부여됨 {preview.alreadyMapped}건</Badge>
            {preview.errors.length > 0 && <Badge className="bg-red-50 text-danger">오류 행 {preview.errors.length}</Badge>}
          </div>

          {preview.matched.length > 0 && (
            <div className="max-h-64 overflow-y-auto rounded-xl border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="text-left text-muted"><th className="px-3 py-2">가맹점</th><th className="px-3 py-2">품목</th><th className="px-3 py-2">상태</th></tr>
                </thead>
                <tbody>
                  {preview.matched.map((m, i) => (
                    <tr key={i} className="border-t border-gray-50">
                      <td className="px-3 py-1.5">{m.storeName} <span className="text-gray-400">({m.customerCode})</span></td>
                      <td className="px-3 py-1.5">{m.productName} <span className="text-gray-400">({m.itemCode})</span></td>
                      <td className="px-3 py-1.5">{m.already ? <span className="text-gray-400">이미 부여됨</span> : <span className="font-semibold text-emerald-600">신규 부여 예정</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {preview.unknownCustomers.length > 0 && (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
              미등록 거래처코드 (가맹점관리에서 이카운트 거래처코드를 먼저 등록하세요): {preview.unknownCustomers.join(", ")}
            </p>
          )}
          {preview.unknownItems.length > 0 && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-danger">
              미등록 품목코드 (상품관리에서 이카운트 품목코드를 먼저 등록하세요): {preview.unknownItems.join(", ")}
            </p>
          )}
          {preview.errors.length > 0 && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-danger">
              {preview.errors.map((e) => `${e.line}행: ${e.message}`).join(" · ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
