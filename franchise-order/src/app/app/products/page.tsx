import { requireFranchise } from "@/lib/auth";
import { getStoreCatalog, getCartLines, getFrequentProductIds } from "@/lib/franchise-data";
import { Catalog } from "@/components/franchise/catalog";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  const profile = await requireFranchise();
  const { filter } = await searchParams;
  const [items, cartLines, frequentIds] = await Promise.all([
    getStoreCatalog(profile.store_id),
    getCartLines(profile.store_id, profile.id),
    getFrequentProductIds(profile.store_id),
  ]);

  return (
    <main>
      <header className="px-4 pt-4">
        <h1 className="text-lg font-bold">상품</h1>
      </header>
      <Catalog
        items={items}
        cartLines={cartLines}
        frequentIds={frequentIds}
        initialFilter={filter === "FREQUENT" ? "FREQUENT" : "ALL"}
      />
    </main>
  );
}
