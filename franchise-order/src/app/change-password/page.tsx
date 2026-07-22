"use client";

import { useActionState } from "react";
import { changePasswordAction, type ChangePasswordState } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export default function ChangePasswordPage() {
  const [state, formAction, pending] = useActionState<ChangePasswordState, FormData>(changePasswordAction, {});

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-primary-light px-5">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-2xl font-black text-white">B</div>
          <h1 className="text-xl font-bold">비밀번호를 변경해주세요</h1>
          <p className="mt-1.5 text-sm text-muted">
            초기 비밀번호(1234)로 로그인하셨습니다.<br />보안을 위해 새 비밀번호를 설정해야 계속 이용할 수 있습니다.
          </p>
        </div>

        <form action={formAction} className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <div className="mb-4">
            <Label htmlFor="password">새 비밀번호 (8자 이상)</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={100} />
          </div>
          <div className="mb-5">
            <Label htmlFor="confirm">새 비밀번호 확인</Label>
            <Input id="confirm" name="confirm" type="password" autoComplete="new-password" required minLength={8} maxLength={100} />
          </div>
          {state.error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-danger">{state.error}</p>
          )}
          <Button type="submit" size="lg" className="w-full" disabled={pending}>
            {pending ? "변경 중..." : "비밀번호 변경"}
          </Button>
        </form>
      </div>
    </main>
  );
}
