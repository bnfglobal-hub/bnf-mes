import Link from "next/link";
import { ChevronLeft, BellOff } from "lucide-react";
import { requireFranchise } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDateTime } from "@/lib/utils";
import { MarkReadOnView } from "@/components/franchise/mark-read";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const profile = await requireFranchise();
  const admin = createAdminClient();
  const { data: notifications } = await admin
    .from("notifications")
    .select("*")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <main className="px-4 pt-4">
      <div className="flex items-center gap-2">
        <Link href="/app/my" className="rounded-full p-1.5" aria-label="뒤로"><ChevronLeft size={22} /></Link>
        <h1 className="text-lg font-bold">알림</h1>
      </div>
      <MarkReadOnView ids={(notifications ?? []).filter((n) => !n.is_read).map((n) => n.id)} />
      {(notifications ?? []).length === 0 ? (
        <div className="flex flex-col items-center py-24 text-gray-400">
          <BellOff size={44} strokeWidth={1.2} />
          <p className="mt-3 text-sm">알림이 없습니다.</p>
        </div>
      ) : (
        <ul className="mt-3 space-y-1.5 pb-6">
          {(notifications ?? []).map((n) => (
            <li key={n.id}>
              <Link
                href={n.link ?? "#"}
                className={`block rounded-xl border px-4 py-3 ${n.is_read ? "border-border bg-white" : "border-orange-200 bg-primary-light"}`}
              >
                <p className="text-sm font-semibold">{n.title}</p>
                {n.body && <p className="mt-0.5 text-xs text-gray-600">{n.body}</p>}
                <p className="mt-1 text-[11px] text-gray-400">{formatDateTime(n.created_at)}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
