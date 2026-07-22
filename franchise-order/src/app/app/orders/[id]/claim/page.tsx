import { notFound } from "next/navigation";
import { requireFranchise } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ClaimForm } from "@/components/franchise/claim-form";

export const dynamic = "force-dynamic";

export default async function ClaimPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const profile = await requireFranchise();
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, order_no, order_items(id, qty, product_snapshot)")
    .eq("id", id)
    .eq("store_id", profile.store_id)
    .single();
  if (!order) notFound();

  return (
    <main className="px-4 pt-4 pb-8">
      <h1 className="text-lg font-bold">클레임 등록</h1>
      <p className="mt-1 text-sm text-muted">{order.order_no}</p>
      <ClaimForm
        orderId={order.id}
        items={(order.order_items as { id: string; qty: number; product_snapshot: { name: string } }[]).map((i) => ({
          id: i.id, qty: i.qty, name: i.product_snapshot.name,
        }))}
      />
    </main>
  );
}
