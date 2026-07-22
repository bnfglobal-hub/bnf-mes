"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { usernameToEmail, isValidUsername } from "@/lib/login-domain";
import { rateLimit } from "@/lib/rate-limit";

const loginSchema = z.object({
  username: z.string().min(2).max(30),
  password: z.string().min(4).max(100),
});

const changePasswordSchema = z.object({
  password: z.string().min(8, "8자 이상").max(100),
  confirm: z.string(),
});

export interface LoginState {
  error?: string;
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "아이디와 비밀번호를 확인해주세요." };
  if (!isValidUsername(parsed.data.username)) return { error: "아이디 형식이 올바르지 않습니다." };

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const rl = rateLimit(`login:${ip}`, 10, 60_000);
  if (!rl.ok) return { error: `로그인 시도가 너무 많습니다. ${rl.retryAfterSec}초 후 다시 시도해주세요.` };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: usernameToEmail(parsed.data.username),
    password: parsed.data.password,
  });
  if (error) return { error: "아이디 또는 비밀번호가 올바르지 않습니다." };

  // 비활성 계정 차단 + 초기 비밀번호 변경 강제
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("is_active, role").eq("id", user.id).single();
    if (!profile?.is_active) {
      await supabase.auth.signOut();
      return { error: "사용이 중지된 계정입니다. 본사에 문의하세요." };
    }
    if (user.user_metadata?.must_change_password === true) redirect("/change-password");
  }
  redirect("/");
}

export interface ChangePasswordState {
  error?: string;
}

export async function changePasswordAction(_prev: ChangePasswordState, formData: FormData): Promise<ChangePasswordState> {
  const parsed = changePasswordSchema.safeParse({
    password: formData.get("password"),
    confirm: formData.get("confirm"),
  });
  if (!parsed.success) return { error: "새 비밀번호는 8자 이상이어야 합니다." };
  if (parsed.data.password !== parsed.data.confirm) return { error: "비밀번호가 서로 일치하지 않습니다." };
  if (parsed.data.password === "1234" || /^(.)\1+$/.test(parsed.data.password)) {
    return { error: "너무 단순한 비밀번호입니다. 다른 비밀번호를 사용해주세요." };
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
    data: { must_change_password: false },
  });
  if (error) return { error: `비밀번호 변경 실패: ${error.message}` };
  redirect("/");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
