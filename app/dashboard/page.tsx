import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentParent } from "@/lib/auth";
import { defaultTemplates } from "@/lib/templates";
import { DashboardClient } from "@/components/dashboard-client";
import { addMonths, startOfDay, startOfMonth, subDays } from "date-fns";

function toDayKey(date: Date) {
  return startOfDay(date).getTime();
}

function computeStreak(daySet: Set<number>, startDay: Date) {
  let streak = 0;
  let cursor = startDay;
  while (daySet.has(toDayKey(cursor))) {
    streak += 1;
    cursor = subDays(cursor, 1);
  }
  return streak;
}

export default async function DashboardPage() {
  const parent = await getCurrentParent();
  if (!parent) redirect("/");

  const children = await prisma.child.findMany({
    where: { parentId: parent.id },
    include: {
      tasks: {
        where: { active: true },
        orderBy: { createdAt: "asc" },
      },
      achievements: {
        orderBy: { unlockedAt: "desc" },
        take: 6,
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = addMonths(monthStart, 1);
  const todayStart = startOfDay(now);

  const childrenWithStats = await Promise.all(
    children.map(async (child) => {
      const monthLogs = await prisma.starLog.findMany({
        where: {
          childId: child.id,
          date: {
            gte: monthStart,
            lt: monthEnd,
          },
        },
        select: { date: true, stars: true, isBonus: true },
        orderBy: { date: "asc" },
      });

      const todayStars = monthLogs
        .filter((log) => toDayKey(log.date) === toDayKey(todayStart))
        .reduce((sum, l) => sum + l.stars, 0);

      const calendarMap = new Map<number, number>();
      monthLogs.forEach((log) => {
        const key = toDayKey(log.date);
        const prev = calendarMap.get(key) || 0;
        calendarMap.set(key, prev + log.stars);
      });

      const totalAgg = await prisma.starLog.aggregate({
        where: { childId: child.id },
        _sum: { stars: true },
      });

      const recent = await prisma.starLog.findMany({
        where: { childId: child.id, date: { gte: subDays(now, 40) } },
        select: { date: true },
      });
      const daySet = new Set(recent.map((log) => toDayKey(log.date)));
      const streak = computeStreak(daySet, todayStart);

      return {
        ...child,
        totalStars: totalAgg._sum.stars || 0,
        streak,
        todayStars,
        calendar: Array.from(calendarMap.entries()).map(([time, stars]) => ({
          date: new Date(time).toISOString(),
          stars,
        })),
      };
    })
  );

  return (
    <DashboardClient
      parentPhone={parent.phone}
      kids={childrenWithStats}
      templates={defaultTemplates}
    />
  );
}
