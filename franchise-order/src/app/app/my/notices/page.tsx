import Link from "next/link";
import { ChevronLeft, Megaphone } from "lucide-react";
import { requireFranchise } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function NoticesPage() {
  await requireFranchise();
  const supabase = await createClient(); // RLS 로 대상 공지만 조회
  const { data: notices } = await supabase
    .from("announcements")
    .select("id, title, is_important, is_pinned, created_at")
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="px-4 pt-4">
      <div className="flex items-center gap-2">
        <Link href="/app/my" className="rounded-full p-1.5" aria-label="뒤로"><ChevronLeft size={22} /></Link>
        <h1 className="text-lg font-bold">공지사항</h1>
      </div>
      {(notices ?? []).length === 0 ? (
        <div className="flex flex-col items-center py-24 text-gray-400">
          <Megaphone size={44} strokeWidth={1.2} />
          <p className="mt-3 text-sm">공지사항이 없습니다.</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-1.5 pb-6">
          {(notices ?? []).map((n) => (
            <li key={n.id}>
              <Link href={`/app/my/notices/${n.id}`} className="flex items-center gap-2 rounded-xl border border-border bg-white px-4 py-3.5 active:bg-gray-50">
                {n.is_pinned && <Badge className="bg-gray-100 text-gray-600">고정</Badge>}
                {n.is_important && <Badge className="bg-red-50 text-danger">중요</Badge>}
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{n.title}</span>
                <span className="shrink-0 text-xs text-gray-400">{formatDate(n.created_at)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
