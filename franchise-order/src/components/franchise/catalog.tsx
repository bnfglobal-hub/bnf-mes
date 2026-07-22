"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Search, Star, Minus, Plus, ShoppingCart, PackageOpen } from "lucide-react";
import { cn, formatNumber, matchesSearch } from "@/lib/utils";
import { STORAGE_LABEL, STORAGE_COLOR } from "@/lib/constants";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { setCartItemAction } from "@/app/app/actions";
import type { CatalogItem } from "@/lib/franchise-data";

const FAV_KEY = "bnf-favorites";

function loadFavs(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(FAV_KEY) ?? "[]")); } catch { return new Set(); }
}

type Filter = "ALL" | "ROOM" | "CHILLED" | "FROZEN" | "FAV" | "NEW" | "RECOMMENDED" | "FREQUENT";

export function Catalog({
  items,
  cartLines,
  frequentIds,
  initialFilter = "ALL",
}: {
  items: CatalogItem[];
  cartLines: { productId: string; qty: number }[];
  frequentIds: string[];
  initialFilter?: Filter;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [category, setCategory] = useState<string | null>(null);
  const [favs, setFavs] = useState<Set<string>>(loadFavs);
  const [cart, setCart] = useState<Map<string, number>>(new Map(cartLines.map((l) => [l.productId, l.qty])));
  const [, startTransition] = useTransition();
  const frequentSet = useMemo(() => new Set(frequentIds), [frequentIds]);

  const categories = useMemo(() => {
    const map = new Map<string, string>();
    for (const it of items) if (it.categoryId && it.categoryName) map.set(it.categoryId, it.categoryName);
    return [...map.entries()];
  }, [items]);

  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (query && !matchesSearch(it.name + " " + (it.ecountItemCode ?? ""), query)) return false;
      if (category && it.categoryId !== category) return false;
      switch (filter) {
        case "ROOM": case "CHILLED": case "FROZEN": return it.storageType === filter;
        case "FAV": return favs.has(it.productId);
        case "NEW": return it.isNew;
        case "RECOMMENDED": return it.isRecommended;
        case "FREQUENT": return frequentSet.has(it.productId);
        default: return true;
      }
    });
  }, [items, query, filter, category, favs, frequentSet]);

  const toggleFav = (id: string) => {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      localStorage.setItem(FAV_KEY, JSON.stringify([...next]));
      return next;
    });
  };

  const setQty = (item: CatalogItem, qty: number) => {
    const clamped = Math.max(0, Math.min(qty, item.maxQty ?? 9999));
    setCart((prev) => {
      const next = new Map(prev);
      if (clamped === 0) next.delete(item.productId); else next.set(item.productId, clamped);
      return next;
    });
    startTransition(async () => {
      await setCartItemAction(item.productId, clamped);
    });
  };

  const cartTotal = useMemo(() => {
    let sum = 0;
    for (const [pid, qty] of cart) {
      const it = items.find((i) => i.productId === pid);
      if (it) sum += it.unitPrice * qty;
    }
    return sum;
  }, [cart, items]);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: "ALL", label: "전체" },
    { key: "FAV", label: "즐겨찾기" },
    { key: "FREQUENT", label: "자주 주문" },
    { key: "NEW", label: "신상품" },
    { key: "RECOMMENDED", label: "추천" },
    { key: "ROOM", label: "상온" },
    { key: "CHILLED", label: "냉장" },
    { key: "FROZEN", label: "냉동" },
  ];

  return (
    <div>
      {/* 검색 */}
      <div className="sticky top-0 z-30 border-b border-border bg-white px-4 pb-2 pt-3">
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="상품명·품목코드·초성 검색 (예: ㄴㅁ)"
            className="h-11 w-full rounded-xl border border-border bg-gray-50 pl-10 pr-3 text-[15px] outline-none focus:border-primary focus:bg-white"
          />
        </div>
        <div className="scrollbar-none -mx-1 mt-2 flex gap-1.5 overflow-x-auto px-1 pb-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-[13px] font-semibold transition-colors",
                filter === f.key ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        {categories.length > 0 && (
          <div className="scrollbar-none -mx-1 mt-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            <button
              onClick={() => setCategory(null)}
              className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-medium", !category ? "bg-orange-100 text-primary" : "bg-gray-50 text-gray-500")}
            >
              전체 분류
            </button>
            {categories.map(([id, name]) => (
              <button
                key={id}
                onClick={() => setCategory(category === id ? null : id)}
                className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-medium", category === id ? "bg-orange-100 text-primary" : "bg-gray-50 text-gray-500")}
              >
                {name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 목록 */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <PackageOpen size={44} strokeWidth={1.2} />
          <p className="mt-3 text-sm">조건에 맞는 상품이 없습니다.</p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-50 px-4">
          {filtered.map((item) => {
            const qty = cart.get(item.productId) ?? 0;
            return (
              <li key={item.productId} className="py-3.5">
                <div className="flex gap-3">
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gray-50">
                    {item.thumbnailUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <PackageOpen size={24} className="text-gray-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1">
                          <Badge className={STORAGE_COLOR[item.storageType]}>{STORAGE_LABEL[item.storageType]}</Badge>
                          {item.isNew && <Badge className="bg-orange-50 text-primary">NEW</Badge>}
                          {item.stockLabel && (
                            <Badge className={item.stockLabel === "품절" ? "bg-red-50 text-danger" : item.stockLabel === "재고 부족" ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-600"}>
                              {item.stockLabel}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 truncate text-[15px] font-semibold leading-snug">{item.name}</p>
                        <p className="text-xs text-muted">
                          {item.spec}{item.boxQty ? ` · ${item.boxQty}입/박스` : ""} · {item.orderUnit}
                        </p>
                      </div>
                      <button onClick={() => toggleFav(item.productId)} className="p-1" aria-label="즐겨찾기">
                        <Star size={20} className={favs.has(item.productId) ? "fill-amber-400 text-amber-400" : "text-gray-300"} />
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <p className="text-[15px] font-bold">
                        {formatNumber(item.unitPrice)}원
                        <span className="ml-1 text-[11px] font-normal text-muted">{item.taxType === "TAXABLE" ? "VAT 별도" : "면세"}</span>
                      </p>
                      {item.isSoldout ? (
                        <span className="text-sm font-semibold text-gray-400">품절</span>
                      ) : qty === 0 ? (
                        <Button size="sm" variant="secondary" onClick={() => setQty(item, item.minQty)}>
                          <ShoppingCart size={15} /> 담기
                        </Button>
                      ) : (
                        <div className="flex items-center gap-0.5 rounded-xl border border-border">
                          <button
                            className="flex h-10 w-10 items-center justify-center text-gray-600 active:bg-gray-50"
                            onClick={() => setQty(item, qty - item.qtyStep < item.minQty ? 0 : qty - item.qtyStep)}
                            aria-label="수량 감소"
                          >
                            <Minus size={16} />
                          </button>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={qty}
                            onChange={(e) => {
                              const v = parseInt(e.target.value || "0", 10);
                              if (!Number.isNaN(v)) setQty(item, v);
                            }}
                            className="w-11 border-0 text-center text-[15px] font-bold outline-none"
                          />
                          <button
                            className="flex h-10 w-10 items-center justify-center text-primary active:bg-orange-50"
                            onClick={() => setQty(item, qty + item.qtyStep)}
                            aria-label="수량 증가"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* 하단 고정 장바구니 바 */}
      {cart.size > 0 && (
        <div className="fixed inset-x-0 bottom-[56px] z-30 mx-auto max-w-lg px-4 pb-2">
          <Link
            href="/app/cart"
            className="flex h-13 items-center justify-between rounded-2xl bg-primary px-5 py-3.5 text-white shadow-lg shadow-orange-200 active:bg-primary-hover"
          >
            <span className="text-sm font-medium">{cart.size}개 상품</span>
            <span className="text-base font-bold">{formatNumber(cartTotal)}원 · 장바구니 보기</span>
          </Link>
        </div>
      )}
    </div>
  );
}
