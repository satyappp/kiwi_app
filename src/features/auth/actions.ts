"use server";

import { createHash, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { loginSchema, signupSchema, type AuthActionState } from "@/features/auth/schema";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

function codesMatch(candidate: string, expected: string) {
  const candidateHash = createHash("sha256").update(candidate).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(candidateHash, expectedHash);
}

export async function login(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { formError: "メールアドレスまたはパスワードが正しくありません" };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signup(
  _previousState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const expectedCode = process.env.KIWI_SIGNUP_CODE;
  if (!expectedCode || expectedCode.length < 16) {
    return { formError: "登録設定が完了していません。管理者に連絡してください" };
  }
  if (!codesMatch(parsed.data.signupCode, expectedCode)) {
    return { fieldErrors: { signupCode: ["農園コードが正しくありません"] } };
  }

  let admin;
  try {
    admin = createAdminClient();
  } catch {
    return { formError: "登録設定が完了していません。管理者に連絡してください" };
  }

  const { error } = await admin.auth.admin.createUser({
    email: parsed.data.email,
    password: parsed.data.password,
    email_confirm: true,
    user_metadata: { display_name: parsed.data.displayName },
  });

  if (error) {
    if (error.message.toLowerCase().includes("already")) {
      return { formError: "このメールアドレスは既に登録されています" };
    }
    return { formError: "アカウントを作成できませんでした。時間をおいて再度お試しください" };
  }

  redirect("/login?created=1");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
