"use client";

import { useActionState } from "react";
import { loginAction, type LoginState } from "./actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginAction, {});

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-primary-light px-5">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-3xl font-black text-white shadow-lg shadow-orange-200">
            B
          </div>
          <h1 className="text-2xl font-bold">BNF 프랜차이즈 물류</h1>
          <p className="mt-1 text-sm text-muted">가맹점 발주 시스템</p>
        </div>

        <form action={formAction} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-4">
            <Label htmlFor="username">아이디</Label>
            <Input
              id="username" name="username" autoComplete="username" autoCapitalize="none"
              placeholder="가맹점 아이디" required minLength={3} maxLength={30}
            />
          </div>
          <div className="mb-5">
            <Label htmlFor="password">비밀번호</Label>
            <Input
              id="password" name="password" type="password" autoComplete="current-password"
              placeholder="비밀번호" required minLength={4} maxLength={100}
            />
          </div>
          {state.error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-danger">{state.error}</p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "로그인 중..." : "로그인"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted">
          계정이 없거나 비밀번호를 잊으셨다면 본사 담당자에게 문의해주세요.
        </p>
      </div>
    </main>
  );
}
