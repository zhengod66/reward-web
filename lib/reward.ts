import { prisma } from "./prisma";
import { startOfDay, subDays } from "date-fns";

export function startOfTodayUTC() {
  return startOfDay(new Date());
}

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

export async function addStarsForChild(opts: {
  childId: string;
  taskId?: string;
  stars: number;
  note?: string;
}) {
  const date = startOfTodayUTC();
  await prisma.starLog.create({
    data: {
      childId: opts.childId,
      taskId: opts.taskId,
      stars: opts.stars,
      note: opts.note,
      date,
    },
  });

  const recentLogs = await prisma.starLog.findMany({
    where: { childId: opts.childId },
    orderBy: { date: "desc" },
    select: { date: true },
  });
  const daySet = new Set(recentLogs.map((log) => toDayKey(log.date)));
  const streak = computeStreak(daySet, date);

  const bonusByThreshold: Record<number, number> = {
    3: 1,
    7: 2,
    14: 3,
  };

  let bonusAwarded = 0;
  const thresholds = Object.keys(bonusByThreshold)
    .map(Number)
    .sort((a, b) => a - b);

  for (const threshold of thresholds) {
    if (streak >= threshold) {
      const achieved = await prisma.achievement.findFirst({
        where: {
          childId: opts.childId,
          kind: "streak",
          threshold,
        },
      });
      if (!achieved) {
        const bonusStars = bonusByThreshold[threshold];
        bonusAwarded = bonusStars;
        await prisma.starLog.create({
          data: {
            childId: opts.childId,
            stars: bonusStars,
            isBonus: true,
            note: `连击奖励 ${threshold} 天`,
            date,
          },
        });
        await prisma.achievement.create({
          data: {
            childId: opts.childId,
            title: `连续 ${threshold} 天奖励`,
            description: `保持连击，奖励 ${bonusStars} 颗星星`,
            threshold,
            kind: "streak",
          },
        });
      }
    }
  }

  const total = await prisma.starLog.aggregate({
    where: { childId: opts.childId },
    _sum: { stars: true },
  });

  const milestones = [20, 50, 100, 200];
  for (const limit of milestones) {
    if ((total._sum.stars || 0) >= limit) {
      const has = await prisma.achievement.findFirst({
        where: { childId: opts.childId, kind: "total", threshold: limit },
      });
      if (!has) {
        await prisma.achievement.create({
          data: {
            childId: opts.childId,
            title: `累计 ${limit} 星`,
            description: "坚持最棒！",
            threshold: limit,
            kind: "total",
          },
        });
      }
    }
  }

  return { streak, bonusAwarded };
}

export async function getMonthStars(childId: string, month: number, year: number) {
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 1));

  const logs = await prisma.starLog.groupBy({
    by: ["date"],
    where: {
      childId,
      date: { gte: start, lt: end },
    },
    _sum: { stars: true },
  });

  return logs.map((log) => ({
    date: startOfDay(log.date),
    stars: log._sum.stars || 0,
  }));
}
