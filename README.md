# Kiddo Star | 小孩每日星星奖励系统

基于 Next.js（App Router）+ Prisma + Vercel Postgres。支持手机号验证码登录、孩子管理、任务模板与自定义、打星、连击奖励、日历查看和成就动画，移动端优先、柔和卡通风。

## 功能一览
- 手机号 OTP 登录（开发环境可用万能码）
- 多孩子独立管理，任务模板 + 自定义任务
- 打星星、连击奖励（3/7/14 天自动加星并点亮成就）
- 当月日历查看每天星星数量
- 成就与累计星数展示，柔和渐变+动效

## 快速开始（本地）
1) 安装依赖：`npm install`
2) 复制环境变量：`cp .env.example .env`，补充 `DATABASE_URL`（Vercel Postgres 或其他 Postgres）。
3) 同步数据库：`npm run prisma:push`
4) 设置开发万能验证码（非生产）：在 `.env` 里 `OTP_DEV_CODE=000000`，便于本地登录；无短信服务会在控制台输出验证码。
5) 开发启动：`npm run dev` 打开 http://localhost:3000

## 部署到 Vercel
- 新建 Vercel Postgres，填入 `DATABASE_URL`
- 若有短信服务，可设置：
  - `OTP_SMS_WEBHOOK`：接收 `{ phone, code }` 的 POST 地址
  - `OTP_SMS_TOKEN`：可选 Bearer token
- 生产环境请移除 `OTP_DEV_CODE`
- 部署后运行一次 `npm run prisma:push`（可用 Vercel 的部署命令或本地执行）

## 目录
- `app/page.tsx` 登录页
- `app/dashboard/page.tsx` 主控制台
- `components/*` 交互组件
- `app/actions/*` 服务端动作（OTP、孩子/任务/打星）
- `lib/reward.ts` 连击与成就逻辑
- `prisma/schema.prisma` 数据模型
