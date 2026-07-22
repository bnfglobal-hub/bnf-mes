import { requireFranchise } from "@/lib/auth";
import { getCartLines } from "@/lib/franchise-data";
import { BottomNav } from "@/components/franchise/bottom-nav";

export default async function FranchiseLayout({ children }: { children: React.ReactNode }) {
  const profile = await requireFranchise();
  const cartLines = await getCartLines(profile.store_id, profile.id);
  return (
    <div className="mx-auto min-h-dvh max-w-lg bg-background pb-[76px]">
      {children}
      <BottomNav cartCount={cartLines.length} />
    </div>
  );
}
