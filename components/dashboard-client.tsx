'use client';

import { useMemo, useState, useTransition } from "react";
import {
  addChildAction,
  addTaskAction,
  logStarAction,
} from "@/app/actions/data";
import { logoutAction } from "@/app/actions/auth";
import { TaskTemplateItem } from "@/lib/templates";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Star,
  Calendar as CalendarIcon,
  Flame,
  Plus,
  LogOut,
} from "lucide-react";
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { motion } from "framer-motion";

type Task = {
  id: string;
  title: string;
  description: string | null;
  stars: number;
};

type Achievement = {
  id: string;
  title: string;
  description: string | null;
  threshold: number;
  kind: string;
  unlockedAt: string | Date;
};

type CalendarDay = { date: string; stars: number };

type ChildData = {
  id: string;
  name: string;
  age?: number | null;
  colorTag?: string | null;
  avatarUrl?: string | null;
  tasks: Task[];
  achievements: Achievement[];
  totalStars: number;
  streak: number;
  todayStars: number;
  calendar: CalendarDay[];
};

type Props = {
  parentPhone: string;
  kids: ChildData[];
  templates: TaskTemplateItem[];
};

const pastelPalette = [
  "#8ae0c1",
  "#7cc7ff",
  "#f7b1ff",
  "#ffd07c",
  "#b3c7ff",
];

export function DashboardClient({ parentPhone, kids, templates }: Props) {
  const router = useRouter();
  const [selectedChildId, setSelectedChildId] = useState(
    kids[0]?.id ?? null
  );
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [addingChild, startAddChild] = useTransition();
  const [addingTask, startAddTask] = useTransition();
  const [loggingStar, startLogStar] = useTransition();
  const [loggingOut, startLogout] = useTransition();
  const [childForm, setChildForm] = useState({ name: "", age: "" });
  const [taskForm, setTaskForm] = useState({
    title: "",
    stars: "1",
    description: "",
  });
  const [starForm, setStarForm] = useState({ stars: "1", note: "" });

  const selectedChild =
    kids.find((c) => c.id === selectedChildId) ?? kids[0] ?? null;

  const calendarMap = useMemo(() => {
    const map = new Map<number, number>();
    if (!selectedChild) return map;
    selectedChild.calendar.forEach((item) => {
      const key = startOfDay(new Date(item.date)).getTime();
      map.set(key, item.stars);
    });
    return map;
  }, [selectedChild]);

  const monthStart = useMemo(() => startOfMonth(new Date()), []);
  const monthDays = useMemo(
    () =>
      eachDayOfInterval({
        start: monthStart,
        end: endOfMonth(monthStart),
      }),
    [monthStart]
  );

  const setChildMsg = (msg: string, isError = false) => {
    setActionMessage(isError ? "" : msg);
    setActionError(isError ? msg : "");
  };

  const handleAddChild = () => {
    if (!childForm.name.trim()) {
      setChildMsg("请填写孩子名字", true);
      return;
    }
    startAddChild(async () => {
      try {
        const data = new FormData();
        data.append("name", childForm.name);
        if (childForm.age) data.append("age", childForm.age);
        await addChildAction(data);
        setChildForm({ name: "", age: "" });
        setChildMsg("已添加孩子");
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "添加失败，请稍后重试";
        setChildMsg(message, true);
      }
    });
  };

  const handleAddTask = (task?: TaskTemplateItem) => {
    if (!selectedChild) return;
    const title = task ? task.title : taskForm.title;
    const stars = task ? String(task.stars) : taskForm.stars;
    const description = task ? task.description : taskForm.description;

    if (!title.trim()) {
      setChildMsg("请填写任务名称", true);
      return;
    }

    startAddTask(async () => {
      try {
        const data = new FormData();
        data.append("childId", selectedChild.id);
        data.append("title", title);
        data.append("stars", stars);
        if (description) data.append("description", description);
        await addTaskAction(data);
        if (!task) setTaskForm({ title: "", stars: "1", description: "" });
        setChildMsg("任务已添加");
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "添加任务失败，请稍后重试";
        setChildMsg(message, true);
      }
    });
  };

  const handleLogStar = (taskId?: string, overrideStars?: number) => {
    if (!selectedChild) return;
    startLogStar(async () => {
      try {
        const data = new FormData();
        data.append("childId", selectedChild.id);
        if (taskId) data.append("taskId", taskId);
        data.append(
          "stars",
          overrideStars ? String(overrideStars) : starForm.stars || "1"
        );
        if (starForm.note) data.append("note", starForm.note);
        await logStarAction(data);
        setChildMsg("星星已记录，日历会自动刷新");
        setStarForm({ stars: "1", note: "" });
        router.refresh();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "打星失败，请稍后重试";
        setChildMsg(message, true);
      }
    });
  };

  const handleLogout = () => {
    startLogout(async () => {
      await logoutAction();
      window.location.href = "/";
    });
  };

  return (
    <div className="min-h-screen px-4 py-8 pb-16 md:px-8">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-[#6c6c80]">欢迎回来，{parentPhone}</p>
          <h1 className="text-3xl md:text-4xl font-display font-semibold text-[#1f1f2b]">
            星星奖励中心
          </h1>
        </div>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="inline-flex items-center gap-2 rounded-full bg-white/80 border border-white/50 px-4 py-2 shadow-sm hover:scale-[1.01] transition text-sm text-[#1f1f2b]"
        >
          <LogOut className="h-4 w-4" />
          {loggingOut ? "退出中..." : "退出"}
        </button>
      </header>

      <div className="grid gap-6">
        <section className="grid md:grid-cols-[2fr_1fr] gap-4">
          <div className="glass rounded-3xl p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6c6c80]">孩子列表</p>
                <h2 className="text-xl font-semibold text-[#1f1f2b]">
                  点击切换查看
                </h2>
              </div>
              <div className="text-xs text-[#6c6c80]">
                支持多名孩子分别打星星
              </div>
            </div>
            <div className="mt-4 flex gap-3 overflow-x-auto pb-2">
              {kids.map((child) => (
                <motion.button
                  key={child.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`min-w-[180px] rounded-2xl p-4 text-left shadow-sm border ${
                    selectedChild?.id === child.id
                      ? "border-[#7cc7ff] bg-white"
                      : "border-transparent bg-white/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-12 w-12 rounded-2xl flex items-center justify-center text-white font-bold shadow-md"
                      style={{
                        background: child.colorTag || pastelPalette[0],
                      }}
                    >
                      {child.name.slice(0, 2)}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[#1f1f2b]">
                        {child.name}
                      </p>
                      <p className="text-xs text-[#6c6c80]">
                        星星 {child.totalStars} · 连击 {child.streak} 天
                      </p>
                    </div>
                  </div>
                </motion.button>
              ))}
              <motion.div
                whileHover={{ scale: 1.02 }}
                className="min-w-[220px] rounded-2xl bg-white/60 border border-dashed border-[#7cc7ff]/60 p-4"
              >
                <div className="flex items-center gap-2 mb-3 text-[#1f1f2b]">
                  <Plus className="h-4 w-4" />
                  新增孩子
                </div>
                <div className="space-y-2">
                  <input
                    value={childForm.name}
                    onChange={(e) =>
                      setChildForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="名字"
                    className="w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7cc7ff]"
                  />
                  <input
                    value={childForm.age}
                    onChange={(e) =>
                      setChildForm((prev) => ({ ...prev, age: e.target.value }))
                    }
                    placeholder="年龄 (可选)"
                    className="w-full rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7cc7ff]"
                  />
                  <button
                    onClick={handleAddChild}
                    disabled={addingChild}
                    className="w-full h-10 rounded-xl bg-[#7cc7ff] text-white text-sm font-semibold shadow-md hover:scale-[1.01] transition disabled:opacity-60"
                  >
                    {addingChild ? "添加中..." : "添加"}
                  </button>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="glass rounded-3xl p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-[#f7b1ff]/90 flex items-center justify-center text-white shadow-lg">
                <Star className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-[#6c6c80]">今日连击</p>
                <p className="text-xl font-semibold text-[#1f1f2b]">
                  {selectedChild?.streak ?? 0} 天
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-[#7cc7ff] via-[#8ae0c1] to-[#f7b1ff] text-white p-4 shadow-lg">
              <p className="text-sm">今日星星</p>
              <p className="text-3xl font-bold">{selectedChild?.todayStars ?? 0}</p>
              <p className="text-sm opacity-90">保持节奏，触发连击奖励！</p>
            </div>
          </div>
        </section>

        {selectedChild && (
          <>
            <section className="grid md:grid-cols-[1.7fr_1.3fr] gap-4">
              <motion.div
                className="glass rounded-3xl p-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm text-[#6c6c80]">任务清单</p>
                    <h3 className="text-xl font-semibold text-[#1f1f2b]">
                      给 {selectedChild.name} 的目标
                    </h3>
                  </div>
                  <div className="text-xs text-[#6c6c80]">
                    点击快速打星 +1
                  </div>
                </div>
                <div className="grid gap-3">
                  {selectedChild.tasks.map((task) => (
                    <motion.div
                      key={task.id}
                      whileHover={{ scale: 1.01 }}
                      className="rounded-2xl bg-white/80 border border-white/60 p-4 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-base font-semibold text-[#1f1f2b]">
                          {task.title}
                        </p>
                        {task.description && (
                          <p className="text-sm text-[#6c6c80]">
                            {task.description}
                          </p>
                        )}
                        <p className="text-xs text-[#6c6c80] mt-1">
                          基础奖励：{task.stars} 星
                        </p>
                      </div>
                      <button
                        onClick={() => handleLogStar(task.id, task.stars)}
                        className="h-10 px-3 rounded-xl bg-[#ffd07c] text-[#1f1f2b] font-semibold shadow hover:scale-[1.02] transition"
                      >
                        +{task.stars}
                      </button>
                    </motion.div>
                  ))}
                  {selectedChild.tasks.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-[#7cc7ff]/50 p-4 text-sm text-[#6c6c80]">
                      暂无任务，下面添加一个或选择模板。
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                className="glass rounded-3xl p-5 space-y-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div>
                  <p className="text-sm text-[#6c6c80]">自定义任务</p>
                  <h3 className="text-lg font-semibold text-[#1f1f2b]">
                    写一个小目标
                  </h3>
                </div>
                <div className="space-y-3">
                  <input
                    value={taskForm.title}
                    onChange={(e) =>
                      setTaskForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="任务名称"
                    className="w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7cc7ff]"
                  />
                  <input
                    value={taskForm.description}
                    onChange={(e) =>
                      setTaskForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="一句描述（可选）"
                    className="w-full rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7cc7ff]"
                  />
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-[#6c6c80]">基础星星</label>
                    <input
                      type="number"
                      min={1}
                      value={taskForm.stars}
                      onChange={(e) =>
                        setTaskForm((prev) => ({ ...prev, stars: e.target.value }))
                      }
                      className="w-20 rounded-xl border border-white/60 bg-white/80 px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7cc7ff]"
                    />
                  </div>
                  <button
                    onClick={() => handleAddTask()}
                    disabled={addingTask}
                    className="w-full h-11 rounded-xl bg-[#8ae0c1] text-white font-semibold shadow hover:scale-[1.01] transition disabled:opacity-60"
                  >
                    {addingTask ? "添加中..." : "保存任务"}
                  </button>
                </div>
                <div className="pt-2 border-t border-white/60">
                  <p className="text-sm text-[#6c6c80] mb-2">快速模板</p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {templates.map((tpl) => (
                      <button
                        key={tpl.title}
                        onClick={() => handleAddTask(tpl)}
                        className="min-w-[160px] rounded-xl border border-white/60 bg-white/70 px-3 py-2 text-left text-sm shadow-sm hover:scale-[1.01] transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-lg">{tpl.emoji}</span>
                          <span className="text-xs text-[#6c6c80]">
                            +{tpl.stars}
                          </span>
                        </div>
                        <p className="font-semibold text-[#1f1f2b]">{tpl.title}</p>
                        <p className="text-xs text-[#6c6c80]">{tpl.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </section>

            <section className="grid md:grid-cols-[1.4fr_1.6fr] gap-4">
              <motion.div
                className="glass rounded-3xl p-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="h-5 w-5 text-[#f7b1ff]" />
                    <div>
                      <p className="text-sm text-[#6c6c80]">连击打星</p>
                      <h3 className="text-lg font-semibold text-[#1f1f2b]">
                        今日继续加油
                      </h3>
                    </div>
                  </div>
                  <p className="text-xs text-[#6c6c80]">
                    连续 {selectedChild.streak} 天
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {[1, 2, 3].map((n) => (
                      <button
                        key={n}
                        onClick={() => {
                          setStarForm({ stars: String(n), note: "" });
                          handleLogStar(undefined, n);
                        }}
                        className="flex-1 h-10 rounded-xl bg-white/80 border border-white/60 text-sm font-semibold text-[#1f1f2b] shadow-sm hover:scale-[1.02] transition"
                      >
                        +{n} 星
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min={1}
                      value={starForm.stars}
                      onChange={(e) =>
                        setStarForm((prev) => ({ ...prev, stars: e.target.value }))
                      }
                      className="w-20 rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7cc7ff]"
                    />
                    <input
                      value={starForm.note}
                      onChange={(e) =>
                        setStarForm((prev) => ({ ...prev, note: e.target.value }))
                      }
                      placeholder="备注（可选）"
                      className="flex-1 rounded-xl border border-white/60 bg-white/80 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7cc7ff]"
                    />
                    <button
                      onClick={() => handleLogStar()}
                      disabled={loggingStar}
                      className="h-10 px-4 rounded-xl bg-[#7cc7ff] text-white font-semibold shadow hover:scale-[1.01] transition disabled:opacity-60"
                    >
                      {loggingStar ? "记录中..." : "记录"}
                    </button>
                  </div>
                  <p className="text-xs text-[#6c6c80]">
                    达到连续 3 / 7 / 14 天会自动送额外奖励星，并点亮成就动画。
                  </p>
                  {(actionMessage || actionError) && (
                    <div
                      className={`rounded-xl px-3 py-2 text-sm ${
                        actionError
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {actionError || actionMessage}
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div
                className="glass rounded-3xl p-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <CalendarIcon className="h-5 w-5 text-[#7cc7ff]" />
                  <div>
                    <p className="text-sm text-[#6c6c80]">日历星星</p>
                    <h3 className="text-lg font-semibold text-[#1f1f2b]">
                      {format(monthStart, "yyyy 年 M 月")}
                    </h3>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-2 text-xs text-[#6c6c80]">
                  {["日", "一", "二", "三", "四", "五", "六"].map((d) => (
                    <div key={d} className="text-center">
                      {d}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-2 mt-2">
                  {monthDays.map((day) => {
                    const stars = calendarMap.get(startOfDay(day).getTime()) || 0;
                    const isToday =
                      startOfDay(day).getTime() === startOfDay(new Date()).getTime();
                    return (
                      <div
                        key={day.toISOString()}
                        className={`h-14 rounded-xl border border-white/60 bg-white/80 flex flex-col items-center justify-center text-sm ${
                          stars > 0 ? "shadow-md shadow-[#7cc7ff]/25" : ""
                        } ${isToday ? "ring-2 ring-[#7cc7ff]" : ""}`}
                      >
                        <span className="text-[#1f1f2b]">{format(day, "d")}</span>
                        <span className="text-xs text-[#6c6c80]">
                          {stars > 0 ? `★${stars}` : "-"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </section>

            <section className="glass rounded-3xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <Sparkles className="h-5 w-5 text-[#ffd07c]" />
                <div>
                  <p className="text-sm text-[#6c6c80]">成就动画</p>
                  <h3 className="text-lg font-semibold text-[#1f1f2b]">
                    达标时触发奖励
                  </h3>
                </div>
              </div>
              {selectedChild.achievements.length === 0 ? (
                <p className="text-sm text-[#6c6c80]">
                  还没有成就，累积星星或保持连击就能点亮。
                </p>
              ) : (
                <div className="grid md:grid-cols-3 gap-3">
                  {selectedChild.achievements.map((ach) => (
                    <div
                      key={ach.id}
                      className="rounded-2xl bg-white/80 border border-white/60 p-3 shadow-sm"
                    >
                      <p className="text-sm font-semibold text-[#1f1f2b]">
                        {ach.title}
                      </p>
                      {ach.description && (
                        <p className="text-xs text-[#6c6c80]">{ach.description}</p>
                      )}
                      <p className="text-xs text-[#6c6c80] mt-1">
                        已达成 · 阈值 {ach.threshold}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}
