import { redirect } from "next/navigation";
import { getCurrentParent } from "@/lib/auth";
import { LoginCard } from "@/components/login-card";

export default async function Home() {
  const parent = await getCurrentParent();
  if (parent) {
    redirect("/dashboard");
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-14">
      <div className="absolute inset-0">
        <div className="mx-auto max-w-5xl">
          <div className="grid gap-10 md:grid-cols-[1.1fr_0.9fr] items-center">
            <div className="space-y-6">
              <p className="text-sm text-[#6c6c80]">柔和卡通 · Vercel 部署</p>
              <h1 className="text-4xl md:text-5xl font-bold leading-tight font-display text-[#1f1f2b]">
                给孩子每日一颗星 <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#7cc7ff] via-[#8ae0c1] to-[#f7b1ff]">
                  星星奖励
                </span>{" "}
                让仪式感更好玩
              </h1>
              <p className="text-lg text-[#55556b] max-w-2xl leading-relaxed">
                自定义任务、连击奖励、日历视图和炫酷动画，一眼看到孩子每天的闪光点。手机号验证码登录，移动端优先体验。
              </p>
              <div className="flex gap-4 text-sm text-[#55556b] flex-wrap">
                <Badge>日历星星</Badge>
                <Badge>连击奖励</Badge>
                <Badge>柔和渐变动画</Badge>
                <Badge>模板+自定义</Badge>
              </div>
            </div>
            <div className="flex justify-end">
              <LoginCard />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-white/70 border border-white/60 px-3 py-1 shadow-sm">
      <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#7cc7ff] to-[#f7b1ff]" />
      {children}
    </span>
  );
}
