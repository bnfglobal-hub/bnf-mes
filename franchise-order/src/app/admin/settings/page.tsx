import { requireRole, ADMIN_ROLES } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeliveryRuleForm, HolidayManager, StockDisplayForm } from "@/components/admin/settings-forms";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireRole(ADMIN_ROLES);
  const admin = createAdminClient();

  const [{ data: rule }, { data: holidays }, { data: stockSetting }] = await Promise.all([
    admin.from("delivery_rules").select("*").order("created_at").limit(1).single(),
    // eslint-disable-next-line react-hooks/purity -- 요청 시점 기준 30일 전 날짜
    admin.from("holidays").select("*").gte("holiday_date", new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10)).order("holiday_date"),
    admin.from("system_settings").select("value").eq("key", "public.stock_display").maybeSingle(),
  ]);

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-bold">시스템 설정</h1>

      <Card className="mt-4">
        <CardHeader><CardTitle>주문 마감·출고 규칙</CardTitle></CardHeader>
        <CardContent>
          <DeliveryRuleForm
            initial={{
              weekdayCutoff: String(rule?.weekday_cutoff ?? "15:00").slice(0, 5),
              allowSaturdayOrder: rule?.allow_saturday_order ?? true,
              allowHolidayOrder: rule?.allow_holiday_order ?? false,
              minLeadDays: rule?.min_lead_days ?? 1,
              allowSameDay: rule?.allow_same_day ?? false,
              shipDays: rule?.ship_days ?? [1, 2, 3, 4, 5],
            }}
          />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>휴무일·임시 출고중단일</CardTitle></CardHeader>
        <CardContent>
          <HolidayManager holidays={(holidays ?? []).map((h) => ({ id: h.id, date: h.holiday_date, name: h.name }))} />
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader><CardTitle>재고 노출 방식 (가맹점 앱)</CardTitle></CardHeader>
        <CardContent>
          <StockDisplayForm current={(stockSetting?.value as string) ?? "LEVEL"} />
        </CardContent>
      </Card>
    </div>
  );
}
