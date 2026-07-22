import { redirect } from "next/navigation";
import { getSessionProfile, STAFF_ROLES } from "@/lib/auth";

export default async function RootPage() {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (profile.role === "warehouse") redirect("/admin/picking");
  if (STAFF_ROLES.includes(profile.role)) redirect("/admin");
  redirect("/app");
}
