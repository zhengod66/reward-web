import { prisma } from "./prisma";
import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_COOKIE = "reward_session";
const SESSION_DAYS = 7;
const OTP_MINUTES = 10;
const DEV_OTP_CODE = process.env.OTP_DEV_CODE;

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function randomCode() {
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  return code;
}

async function sendOtp(phone: string, code: string) {
  if (process.env.OTP_SMS_WEBHOOK) {
    try {
      await fetch(process.env.OTP_SMS_WEBHOOK, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: process.env.OTP_SMS_TOKEN
            ? `Bearer ${process.env.OTP_SMS_TOKEN}`
            : undefined,
        },
        body: JSON.stringify({ phone, code }),
      });
      return;
    } catch (err) {
      console.error("Failed to call OTP webhook", err);
    }
  }

  // Dev fallback: log to server console
  console.log(`OTP for ${phone}: ${code}`);
}

export async function requestOtp(phone: string) {
  const trimmed = phone.trim();
  if (!trimmed) {
    throw new Error("请输入手机号");
  }

  const code = randomCode();
  const expiresAt = new Date(Date.now() + OTP_MINUTES * 60 * 1000);
  const parent = await prisma.parent.findUnique({
    where: { phone: trimmed },
    select: { id: true },
  });

  await prisma.otpRequest.create({
    data: {
      phone: trimmed,
      codeHash: hashCode(code),
      expiresAt,
      parentId: parent?.id,
    },
  });

  await sendOtp(trimmed, code);
  return { ok: true, expiresAt };
}

export async function createSession(parentId: string) {
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await prisma.session.create({
    data: {
      token,
      parentId,
      expiresAt,
    },
  });

  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function getCurrentParent() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { parent: true },
  });

  if (!session || session.expiresAt < new Date()) {
    // Clean up expired session
    if (session) {
      await prisma.session.delete({ where: { token } });
    }
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return session.parent;
}

export async function verifyOtp(phone: string, code: string) {
  const trimmedPhone = phone.trim();
  const trimmedCode = code.trim();
  if (!trimmedPhone || !trimmedCode) {
    throw new Error("请输入手机号和验证码");
  }

  if (DEV_OTP_CODE && process.env.NODE_ENV !== "production") {
    if (trimmedCode === DEV_OTP_CODE) {
      const parent =
        (await prisma.parent.findUnique({ where: { phone: trimmedPhone } })) ??
        (await prisma.parent.create({ data: { phone: trimmedPhone } }));
      await createSession(parent.id);
      return parent;
    }
  }

  const otp = await prisma.otpRequest.findFirst({
    where: {
      phone: trimmedPhone,
      used: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otp) {
    throw new Error("验证码无效或已过期");
  }

  if (otp.codeHash !== hashCode(trimmedCode)) {
    await prisma.otpRequest.update({
      where: { id: otp.id },
      data: { attempts: { increment: 1 } },
    });
    throw new Error("验证码错误");
  }

  const parent =
    (await prisma.parent.findUnique({ where: { phone: trimmedPhone } })) ??
    (await prisma.parent.create({ data: { phone: trimmedPhone } }));

  await prisma.otpRequest.update({
    where: { id: otp.id },
    data: { used: true, parentId: parent.id },
  });

  await createSession(parent.id);
  return parent;
}

export async function logout() {
  const cookieStore = cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({
      where: { token },
    });
  }
  cookieStore.delete(SESSION_COOKIE);
}
