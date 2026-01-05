'use server';

import { prisma } from "@/lib/prisma";
import { getCurrentParent } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { addStarsForChild } from "@/lib/reward";

async function requireParent() {
  const parent = await getCurrentParent();
  if (!parent) {
    throw new Error("未登录");
  }
  return parent;
}

export async function addChildAction(formData: FormData) {
  const parent = await requireParent();
  const name = String(formData.get("name") || "").trim();
  const ageValue = formData.get("age");
  const age = ageValue ? Number(ageValue) : undefined;
  const palette = ["#8ae0c1", "#7cc7ff", "#f7b1ff", "#ffd07c", "#b3c7ff"];
  const color =
    String(formData.get("color") || "").trim() ||
    palette[Math.floor(Math.random() * palette.length)];

  if (!name) {
    throw new Error("请填写孩子名字");
  }

  await prisma.child.create({
    data: {
      name,
      age: Number.isNaN(age) ? undefined : age,
      colorTag: color,
      parentId: parent.id,
    },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function addTaskAction(formData: FormData) {
  const parent = await requireParent();
  const childId = String(formData.get("childId") || "");
  const title = String(formData.get("title") || "").trim();
  const description = String(formData.get("description") || "").trim() || undefined;
  const starsValue = formData.get("stars");
  const stars = starsValue ? Number(starsValue) : 1;
  const schedule = String(formData.get("schedule") || "").trim() || undefined;

  if (!title) throw new Error("请填写任务名称");
  if (!childId) throw new Error("请选择孩子");

  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { parentId: true },
  });
  if (!child || child.parentId !== parent.id) {
    throw new Error("无权添加任务");
  }

  await prisma.task.create({
    data: {
      title,
      description,
      stars: Number.isNaN(stars) ? 1 : stars,
      schedule,
      childId,
      parentId: parent.id,
    },
  });

  revalidatePath("/dashboard");
  return { ok: true };
}

export async function logStarAction(formData: FormData) {
  const parent = await requireParent();
  const childId = String(formData.get("childId") || "");
  const taskId = formData.get("taskId")
    ? String(formData.get("taskId"))
    : undefined;
  const starsValue = formData.get("stars");
  const note = String(formData.get("note") || "").trim() || undefined;
  const stars = starsValue ? Number(starsValue) : 1;

  if (!childId) throw new Error("请选择孩子");

  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { parentId: true },
  });
  if (!child || child.parentId !== parent.id) {
    throw new Error("无权打星星");
  }

  if (taskId) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      select: { parentId: true },
    });
    if (!task || task.parentId !== parent.id) {
      throw new Error("无效的任务");
    }
  }

  await addStarsForChild({
    childId,
    taskId,
    stars: Number.isNaN(stars) ? 1 : stars,
    note,
  });

  revalidatePath("/dashboard");
  return { ok: true };
}
