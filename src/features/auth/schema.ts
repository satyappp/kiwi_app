import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("正しいメールアドレスを入力してください"),
  password: z.string().min(1, "パスワードを入力してください"),
});

export const signupSchema = z.object({
  displayName: z.string().trim().min(1, "名前を入力してください").max(100, "名前は100文字以内で入力してください"),
  email: z.string().trim().email("正しいメールアドレスを入力してください"),
  password: z.string().min(8, "パスワードは8文字以上で入力してください").max(72, "パスワードは72文字以内で入力してください"),
  signupCode: z.string().trim().min(1, "農園コードを入力してください"),
});

export type AuthActionState = {
  formError?: string;
  fieldErrors?: Record<string, string[]>;
};
