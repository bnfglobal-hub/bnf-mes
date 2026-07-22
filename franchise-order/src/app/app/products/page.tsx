import Link from "next/link";
import { requireFranchise } from "@/lib/auth";
import { getStoreCatalog, getGeneralCatalog, getCartLines, getFrequentProductIds } from "@/lib/franchise-data";
import { Catalog } from "@/components/franchise/catalog";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<{ filter?: string; tab?: string }> }) {
  const profile = await requireFranchise();
  const { filter, tab } = await searchParams;
  const isGeneral = tab === "general";

  const [storeItems, generalItems, cartLines, frequentIds] = await Promise.all([
    getStoreCatalog(profile.store_id),
    getGeneralCatalog(profile.store_id).catch(() => []), // 00003 마이그레이션 전에는 빈 목록
    getCartLines(profile.store_id, profile.id),
    getFrequentProductIds(profile.store_id),
  ]);

  return (
    <main>
      <header className="px-4 pt-4">
        <h1 className="text-lg font-bold">상품</h1>
        <div className="mt-2.5 flex rounded-xl bg-gray-100 p-1">
          <Link
            href="/app/products"
            className={cn("flex-1 rounded-lg py-2 text-center text-sm font-semibold", !isGeneral ? "bg-white text-primary shadow-sm" : "text-gray-500")}
          >
            거래 품목 ({storeItems.length})
          </Link>
          <Link
            href="/app/products?tab=general"
            className={cn("flex-1 rounded-lg py-2 text-center text-sm font-semibold", isGeneral ? "bg-white text-primary shadow-sm" : "text-gray-500")}
          >
            공산품 ({generalItems.length})
          </Link>
        </div>
        {isGeneral && (
          <p className="mt-2 text-xs text-muted">공산품은 모든 거래처가 구매할 수 있는 공용 상품입니다.</p>
        )}
      </header>
      <Catalog
        key={isGeneral ? "general" : "store"}
        items={isGeneral ? generalItems : storeItems}
        allItems={[...storeItems, ...generalItems]}
        cartLines={cartLines}
        frequentIds={frequentIds}
        initialFilter={!isGeneral && filter === "FREQUENT" ? "FREQUENT" : "ALL"}
      />
    </main>
  );
}
