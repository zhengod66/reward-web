export type TaskTemplateItem = {
  title: string;
  description: string;
  stars: number;
  category: string;
  emoji: string;
};

export const defaultTemplates: TaskTemplateItem[] = [
  {
    title: "按时睡觉",
    description: "21:30 前上床，关灯不玩手机",
    stars: 2,
    category: "作息",
    emoji: "🌙",
  },
  {
    title: "收拾玩具",
    description: "玩完主动整理好玩具角",
    stars: 1,
    category: "整理",
    emoji: "🧸",
  },
  {
    title: "作业完成",
    description: "按时完成当天作业并检查",
    stars: 3,
    category: "学习",
    emoji: "📚",
  },
  {
    title: "善良小帮手",
    description: "帮助家人做一件小事",
    stars: 1,
    category: "责任",
    emoji: "🤝",
  },
  {
    title: "自己刷牙",
    description: "早晚认真刷牙 2 分钟",
    stars: 1,
    category: "健康",
    emoji: "🪥",
  },
  {
    title: "心情分享",
    description: "睡前说一件开心/烦恼的事",
    stars: 1,
    category: "情绪",
    emoji: "💬",
  },
];
