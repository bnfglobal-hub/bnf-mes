import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireFranchise } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { AnnouncementReadMarker } from "@/components/franchise/announcement-read-marker";

export const dynamic = "force-dynamic";

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await requireFranchise();
  const supabase = await createClient();
  const { data: notice } = await supabase.from("announcements").select("*").eq("id", id).single();
  if (!notice) notFound();

  return (
    <main className="px-4 pt-4 pb-8">
      <div className="flex items-center gap-2">
        <Link href="/app/my/notices" className="rounded-full p-1.5" aria-label="뒤로"><ChevronLeft size={22} /></Link>
        <h1 className="min-w-0 flex-1 truncate text-lg font-bold">공지사항</h1>
      </div>
      <AnnouncementReadMarker id={notice.id} />
      <article className="mt-4">
        <div className="flex items-center gap-1.5">
          {notice.is_important && <Badge className="bg-red-50 text-danger">중요</Badge>}
          <h2 className="text-lg font-bold">{notice.title}</h2>
        </div>
        <p className="mt-1 text-xs text-gray-400">{formatDateTime(notice.created_at)}</p>
        <div className="mt-4 whitespace-pre-wrap rounded-2xl border border-border bg-white p-4 text-[15px] leading-relaxed">
          {notice.body}
        </div>
        {(notice.attachment_urls ?? []).length > 0 && (
          <ul className="mt-3 space-y-1">
            {notice.attachment_urls.map((url: string, i: number) => (
              <li key={i}>
                <a href={url} target="_blank" rel="noreferrer" className="text-sm text-primary underline">첨부파일 {i + 1}</a>
              </li>
            ))}
          </ul>
        )}
      </article>
    </main>
  );
}
