'use client';

import { useState, useTransition, useEffect } from "react";
import { requestOtpAction, verifyOtpAction } from "@/app/actions/auth";
import { motion } from "framer-motion";
import { Sparkles, ArrowRight } from "lucide-react";

export function LoginCard() {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [pending, startTransition] = useTransition();
  const [verifying, startVerify] = useTransition();

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleRequest = () => {
    setError("");
    setMessage("");
    startTransition(async () => {
      try {
        const data = new FormData();
        data.append("phone", phone);
        await requestOtpAction(data);
        setMessage("验证码已发送（开发环境会在后台日志打印）");
        setCooldown(55);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "发送失败，请稍后再试";
        setError(message);
      }
    });
  };

  const handleVerify = () => {
    setError("");
    setMessage("");
    startVerify(async () => {
      try {
        const data = new FormData();
        data.append("phone", phone);
        data.append("code", code);
        await verifyOtpAction(data);
        setMessage("登录成功，正在跳转...");
        // small delay so message appears
        setTimeout(() => {
          window.location.href = "/dashboard";
        }, 300);
      } catch (err) {
        const message = err instanceof Error ? err.message : "登录失败";
        setError(message);
      }
    });
  };

  return (
    <div className="max-w-xl w-full glass rounded-3xl p-8 md:p-10 relative overflow-hidden border border-white/40 shadow-2xl">
      <div className="absolute -top-14 -right-10 h-40 w-40 rounded-full bg-[#7cc7ff]/50 blur-3xl" />
      <div className="absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-[#f7b1ff]/60 blur-3xl" />
      <div className="relative space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-[#f7b1ff] text-white flex items-center justify-center shadow-lg shadow-[#f7b1ff]/40">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm text-[#6c6c80]">Kiddo Star</p>
            <h1 className="text-2xl md:text-3xl font-semibold leading-tight font-display">
              每日星星奖励，亲子更有仪式感
            </h1>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-3 text-sm text-[#55556b]">
          <div className="rounded-2xl bg-white/70 border border-white/60 p-4 shadow-sm">
            <p className="font-semibold text-[#1f1f2b]">快速上手</p>
            <p className="text-[#6c6c80] mt-1">
              输入手机号获取验证码，登录后即可添加孩子、任务和每日星星。
            </p>
          </div>
          <div className="rounded-2xl bg-white/70 border border-white/60 p-4 shadow-sm">
            <p className="font-semibold text-[#1f1f2b]">柔和卡通动画</p>
            <p className="text-[#6c6c80] mt-1">
              仪表盘有连击奖励、日历星星、可爱的渐变卡片和小动效。
            </p>
          </div>
        </div>

        <div className="space-y-5">
          <label className="block">
            <div className="flex items-center justify-between mb-2 text-sm text-[#1f1f2b]">
              <span>手机号</span>
              {cooldown > 0 && (
                <span className="text-xs text-[#6c6c80]">可重发：{cooldown}s</span>
              )}
            </div>
            <input
              className="w-full rounded-2xl bg-white/80 border border-white/60 px-4 py-3 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#7cc7ff] text-base"
              placeholder="输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={pending || verifying}
            />
          </label>

          <div className="flex gap-3 items-center">
            <div className="flex-1">
              <label className="block text-sm text-[#1f1f2b] mb-2">验证码</label>
              <input
                className="w-full rounded-2xl bg-white/80 border border-white/60 px-4 py-3 shadow-inner focus:outline-none focus:ring-2 focus:ring-[#f7b1ff] text-base"
                placeholder="6 位数字"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                disabled={verifying}
              />
            </div>
            <button
              type="button"
              onClick={handleRequest}
              disabled={pending || cooldown > 0}
              className="h-12 mt-6 whitespace-nowrap rounded-2xl bg-[#7cc7ff] px-4 text-white font-medium shadow-lg shadow-[#7cc7ff]/40 hover:scale-[1.02] transition disabled:opacity-60"
            >
              {pending ? "发送中..." : cooldown > 0 ? `${cooldown}s` : "获取验证码"}
            </button>
          </div>

          <button
            type="button"
            onClick={handleVerify}
            disabled={verifying}
            className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#7cc7ff] via-[#8ae0c1] to-[#f7b1ff] text-white font-semibold shadow-lg shadow-[#7cc7ff]/40 flex items-center justify-center gap-2 hover:scale-[1.01] transition"
          >
            {verifying ? "登录中..." : "登录"} <ArrowRight className="h-5 w-5" />
          </button>
        </div>

        {(message || error) && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl px-4 py-3 text-sm ${
              error ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"
            }`}
          >
            {error || message}
          </motion.div>
        )}
      </div>
    </div>
  );
}
