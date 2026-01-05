'use server';

import { requestOtp, verifyOtp, logout } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function requestOtpAction(formData: FormData) {
  const phone = String(formData.get("phone") || "");
  await requestOtp(phone);
  return { ok: true };
}

export async function verifyOtpAction(formData: FormData) {
  const phone = String(formData.get("phone") || "");
  const code = String(formData.get("code") || "");
  const parent = await verifyOtp(phone, code);
  revalidatePath("/dashboard");
  return { ok: true, parent };
}

export async function logoutAction() {
  await logout();
  revalidatePath("/");
}
