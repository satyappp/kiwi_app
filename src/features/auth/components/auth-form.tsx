"use client";

import Link from "next/link";
import { useActionState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, signup } from "@/features/auth/actions";
import type { AuthActionState } from "@/features/auth/schema";

type AuthFormProps = { mode: "login" | "signup"; accountCreated?: boolean };
const initialState: AuthActionState = {};
const inputClass = "h-12 rounded-xl border-input bg-white/90 px-3.5 text-[15px] shadow-sm";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-sm text-destructive">{errors[0]}</p>;
}

export function AuthForm({ mode, accountCreated = false }: AuthFormProps) {
  const action = mode === "login" ? login : signup;
  const [state, formAction, isPending] = useActionState(action, initialState);
  const isLogin = mode === "login";

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {accountCreated && (
        <p className="rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-kiwi-ink">
          アカウントを作成しました。ログインしてください。
        </p>
      )}
      {state.formError && (
        <p role="alert" className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.formError}
        </p>
      )}

      {!isLogin && (
        <div className="space-y-1.5">
          <Label htmlFor="display-name" className="font-bold text-kiwi-ink">名前</Label>
          <Input id="display-name" name="displayName" autoComplete="name" className={inputClass} required />
          <FieldError errors={state.fieldErrors?.displayName} />
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email" className="font-bold text-kiwi-ink">メールアドレス</Label>
        <Input id="email" name="email" type="email" inputMode="email" autoComplete="email" className={inputClass} required />
        <FieldError errors={state.fieldErrors?.email} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password" className="font-bold text-kiwi-ink">パスワード</Label>
        <Input id="password" name="password" type="password" autoComplete={isLogin ? "current-password" : "new-password"} minLength={isLogin ? undefined : 8} className={inputClass} required />
        {!isLogin && <p className="text-xs text-muted-foreground">8文字以上</p>}
        <FieldError errors={state.fieldErrors?.password} />
      </div>

      {!isLogin && (
        <div className="space-y-1.5">
          <Label htmlFor="signup-code" className="font-bold text-kiwi-ink">農園コード</Label>
          <Input id="signup-code" name="signupCode" type="password" autoComplete="off" className={inputClass} required />
          <p className="text-xs text-muted-foreground">農園のスタッフから共有されたコード</p>
          <FieldError errors={state.fieldErrors?.signupCode} />
        </div>
      )}

      <Button type="submit" disabled={isPending} className="mt-2 h-12 w-full rounded-full text-[15px] font-bold shadow-[0_8px_20px_-6px_rgba(66,160,71,0.5)]">
        {isPending ? "処理中…" : isLogin ? "ログイン" : "アカウントを作成"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {isLogin ? "初めて利用する方は" : "既にアカウントをお持ちの方は"}{" "}
        <Link href={isLogin ? "/signup" : "/login"} className="font-bold text-primary underline-offset-4 hover:underline">
          {isLogin ? "アカウント作成" : "ログイン"}
        </Link>
      </p>
    </form>
  );
}
