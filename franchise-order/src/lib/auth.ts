import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type UserRole = "super_admin" | "hq_admin" | "warehouse" | "franchise_owner" | "franchise_staff";

export interface SessionProfile {
  id: string;
  username: string;
  full_name: string;
  role: UserRole;
  store_id: string | null;
  is_active: boolean;
}

export const getSessionProfile = cache(async (): Promise<SessionProfile | null> => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, username, full_name, role, store_id, is_active")
    .eq("id", user.id)
    .single();
  if (!data || !data.is_active) return null;
  return data as SessionProfile;
});

export const STAFF_ROLES: UserRole[] = ["super_admin", "hq_admin", "warehouse"];
export const ADMIN_ROLES: UserRole[] = ["super_admin", "hq_admin"];
export const FRANCHISE_ROLES: UserRole[] = ["franchise_owner", "franchise_staff"];

export async function requireRole(roles: UserRole[]): Promise<SessionProfile> {
  const profile = await getSessionProfile();
  if (!profile) redirect("/login");
  if (!roles.includes(profile.role)) redirect(profile.role === "warehouse" ? "/admin/picking" : STAFF_ROLES.includes(profile.role) ? "/admin" : "/app");
  return profile;
}

export async function requireFranchise(): Promise<SessionProfile & { store_id: string }> {
  const profile = await requireRole(FRANCHISE_ROLES);
  if (!profile.store_id) redirect("/login?error=no-store");
  return profile as SessionProfile & { store_id: string };
}
