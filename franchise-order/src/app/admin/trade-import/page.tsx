import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TradeImportForm } from "@/components/admin/trade-import-form";

export const dynamic = "force-dynamic";

export default async function TradeImportPage() {
  await requireRole(ADMIN_ROLES);
  return (
    <div className="max-w-4xl">
      <h1 className="text-xl font-bold">거래품목 가져오기 (이카운트 거래내역)</h1>
      <p className="mt-1.5 text-sm text-muted">
        이카운트 <b>판매현황(거래처·품목별)</b>을 조회한 뒤 표를 복사해 아래에 붙여넣으면,
        거래처코드·품목코드를 인식해 해당 가맹점의 <b>취급상품으로 자동 부여</b>합니다.
        가맹점은 부여된 품목만 볼 수 있습니다.
      </p>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle>붙여넣기</CardTitle>
          <p className="mt-1 text-xs text-muted">
            거래처코드와 품목코드 열이 포함되어 있으면 됩니다 (열 이름에 &lsquo;거래처코드&rsquo;/&lsquo;품목코드&rsquo;가 있으면 자동 인식,
            없으면 1열=거래처코드, 2열=품목코드로 처리).
          </p>
        </CardHeader>
        <CardContent>
          <TradeImportForm />
        </CardContent>
      </Card>
    </div>
  );
}
