"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createUserAction, resetPasswordAction, toggleUserActiveAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";
import { ROLE_LABEL } from "@/lib/constants";

export function UserCreateForm({ stores, isSuperAdmin }: { stores: { id: string; name: string }[]; isSuperAdmin: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({ username: "", password: "", fullName: "", role: "franchise_owner", storeId: "", phone: "" });
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isFranchise = ["franchise_owner", "franchise_staff"].includes(form.role);

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-6">
        <div><Label>아이디 (사업자등록번호)</Label><Input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="예: 123-45-67890" autoComplete="off" /></div>
        <div><Label>초기 비밀번호</Label><Input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="미입력 시 1234" autoComplete="new-password" /></div>
        <div><Label>이름</Label><Input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></div>
        <div><Label>역할</Label>
          <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            {Object.entries(ROLE_LABEL).filter(([k]) => isSuperAdmin || k !== "super_admin").map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
        <div><Label>소속 가맹점{isFranchise ? " *" : ""}</Label>
          <Select value={form.storeId} onChange={(e) => setForm({ ...form, storeId: e.target.value })}>
            <option value="">선택 안함</option>
            {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>
        </div>
        <div><Label>연락처</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
      </div>
      {msg && <p className="mt-2 text-sm text-muted">{msg}</p>}
      <p className="mt-2 text-xs text-muted">생성된 계정은 최초 로그인 시 비밀번호 변경이 강제됩니다.</p>
      <Button className="mt-3" disabled={pending || !form.username || !form.fullName}
        onClick={() => startTransition(async () => {
          const r = await createUserAction({
            username: form.username.trim(), password: form.password || undefined, fullName: form.fullName.trim(),
            role: form.role as "hq_admin", storeId: form.storeId || undefined, phone: form.phone || undefined,
          });
          setMsg(r.ok ? `계정이 생성되었습니다. (초기 비밀번호: ${form.password || "1234"})` : r.error ?? "실패");
          if (r.ok) { setForm({ username: "", password: "", fullName: "", role: form.role, storeId: form.storeId, phone: "" }); router.refresh(); }
        })}>
        {pending ? "생성 중..." : "계정 생성"}
      </Button>
    </div>
  );
}

export function UserRowControls({ userId, isActive }: { userId: string; isActive: boolean }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2 text-xs">
      {!confirming ? (
        <button className="text-primary underline" onClick={() => setConfirming(true)}>비밀번호 초기화</button>
      ) : (
        <span className="flex items-center gap-1.5">
          <span className="text-muted">1234로 초기화?</span>
          <Button size="sm" className="h-7 px-2 text-xs" disabled={pending}
            onClick={() => startTransition(async () => {
              const r = await resetPasswordAction(userId);
              setMsg(r.ok ? "1234로 초기화됨 (다음 로그인 시 변경 강제)" : r.error ?? "실패");
              setConfirming(false);
            })}>
            확인
          </Button>
          <button className="underline" onClick={() => setConfirming(false)}>취소</button>
        </span>
      )}
      <button className={isActive ? "text-danger underline" : "text-emerald-600 underline"} disabled={pending}
        onClick={() => startTransition(async () => { await toggleUserActiveAction(userId, !isActive); router.refresh(); })}>
        {isActive ? "중지" : "활성화"}
      </button>
      {msg && <span className="text-muted">{msg}</span>}
    </div>
  );
}
