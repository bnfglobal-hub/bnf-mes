import Link from "next/link";
import { revalidatePath } from "next/cache";
import { ChevronLeft } from "lucide-react";
import { requireFranchise } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export const dynamic = "force-dynamic";

async function addAddress(formData: FormData) {
  "use server";
  const profile = await requireFranchise();
  const admin = createAdminClient();
  const label = String(formData.get("label") ?? "").trim() || "배송지";
  const address1 = String(formData.get("address1") ?? "").trim();
  if (!address1) return;
  await admin.from("addresses").insert({
    store_id: profile.store_id,
    label,
    postal_code: String(formData.get("postal_code") ?? "").trim() || null,
    address1,
    address2: String(formData.get("address2") ?? "").trim() || null,
    receiver: String(formData.get("receiver") ?? "").trim() || null,
    phone: String(formData.get("phone") ?? "").trim() || null,
    delivery_note: String(formData.get("delivery_note") ?? "").trim() || null,
  });
  revalidatePath("/app/my/addresses");
}

async function removeAddress(formData: FormData) {
  "use server";
  const profile = await requireFranchise();
  const id = String(formData.get("id"));
  const admin = createAdminClient();
  await admin.from("addresses").update({ is_active: false }).eq("id", id).eq("store_id", profile.store_id);
  revalidatePath("/app/my/addresses");
}

async function setDefault(formData: FormData) {
  "use server";
  const profile = await requireFranchise();
  const id = String(formData.get("id"));
  const admin = createAdminClient();
  await admin.from("addresses").update({ is_default: false }).eq("store_id", profile.store_id);
  await admin.from("addresses").update({ is_default: true }).eq("id", id).eq("store_id", profile.store_id);
  revalidatePath("/app/my/addresses");
}

export default async function AddressesPage() {
  const profile = await requireFranchise();
  const admin = createAdminClient();
  const { data: addresses } = await admin
    .from("addresses").select("*").eq("store_id", profile.store_id).eq("is_active", true)
    .order("is_default", { ascending: false }).order("created_at");

  return (
    <main className="px-4 pt-4 pb-8">
      <div className="flex items-center gap-2">
        <Link href="/app/my" className="rounded-full p-1.5" aria-label="뒤로"><ChevronLeft size={22} /></Link>
        <h1 className="text-lg font-bold">배송지 관리</h1>
      </div>

      <ul className="mt-3 space-y-2">
        {(addresses ?? []).map((a) => (
          <li key={a.id} className={`rounded-2xl border p-4 ${a.is_default ? "border-primary bg-primary-light" : "border-border bg-white"}`}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold">{a.label} {a.is_default && <span className="ml-1 text-xs font-semibold text-primary">기본</span>}</p>
              <div className="flex gap-2">
                {!a.is_default && (
                  <form action={setDefault}><input type="hidden" name="id" value={a.id} />
                    <button className="text-xs text-primary underline">기본으로</button>
                  </form>
                )}
                <form action={removeAddress}><input type="hidden" name="id" value={a.id} />
                  <button className="text-xs text-gray-400 underline">삭제</button>
                </form>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-700">[{a.postal_code ?? "-"}] {a.address1} {a.address2 ?? ""}</p>
            {(a.receiver || a.phone) && <p className="mt-0.5 text-xs text-muted">{a.receiver ?? ""} {a.phone ?? ""}</p>}
            {a.delivery_note && <p className="mt-0.5 text-xs text-muted">요청: {a.delivery_note}</p>}
          </li>
        ))}
      </ul>

      <form action={addAddress} className="mt-5 rounded-2xl border border-border bg-white p-4">
        <h2 className="mb-3 text-[15px] font-bold">새 배송지 추가</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>이름</Label><Input name="label" placeholder="예: 매장" maxLength={30} /></div>
          <div><Label>우편번호</Label><Input name="postal_code" inputMode="numeric" maxLength={10} /></div>
        </div>
        <div className="mt-3"><Label>주소</Label><Input name="address1" required maxLength={200} placeholder="기본 주소" /></div>
        <div className="mt-3"><Label>상세 주소</Label><Input name="address2" maxLength={200} /></div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div><Label>수령인</Label><Input name="receiver" maxLength={30} /></div>
          <div><Label>연락처</Label><Input name="phone" inputMode="tel" maxLength={20} /></div>
        </div>
        <div className="mt-3"><Label>배송 요청사항</Label><Input name="delivery_note" maxLength={200} placeholder="예: 후문에 놓아주세요" /></div>
        <Button type="submit" className="mt-4 w-full">추가</Button>
      </form>
    </main>
  );
}
