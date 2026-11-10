import questionIndex from "@/data/question-index.json";
import type { ProgressData, PublicQuestion } from "./types";

export const publicQuestions = questionIndex as PublicQuestion[];

export const chapters = [
  { id: 1, order: "الأول", title: "المتغيرات والذاكرة", shortTitle: "المتغيرات والذاكرة", description: "كل قيمة لها مكان. اكتشف كيف يتذكّر الحاسوب.", icon: "box", color: "green", difficulty: "سهل", topics: ["المتغيرات", "تعيين القيم", "أنواع البيانات", "حالة الذاكرة"], stages: ["صناديق الذاكرة", "القيم تتغيّر", "أنواع البيانات", "تحدّي الذاكرة"] },
  { id: 2, order: "الثاني", title: "الشروط والبوابات المنطقية", shortTitle: "الشروط والمنطق", description: "علّم الحاسوب كيف يتخذ القرار الصحيح.", icon: "branch", color: "purple", difficulty: "سهل", topics: ["المقارنات", "بوابات المنطق", "إذا وإلّا", "القرارات"], stages: ["صواب أم خطأ", "بوابات المنطق", "إذا وإلّا", "قرارات أذكى"] },
  { id: 3, order: "الثالث", title: "الحلقات والتكرار", shortTitle: "الحلقات والتكرار", description: "خطوة تتكرر، وإمكانيات لا تنتهي.", icon: "loop", color: "blue", difficulty: "متوسط", topics: ["الحلقات", "العدّادات", "شروط التوقف", "التراكم"], stages: ["أول تكرار", "عدّاد التكرار", "متى نتوقف؟", "قوة التكرار"] },
  { id: 4, order: "الرابع", title: "المصفوفات والترتيب", shortTitle: "المصفوفات والترتيب", description: "نظّم بياناتك، واكتشف قوة الخوارزميات.", icon: "array", color: "gold", difficulty: "متقدم", topics: ["المصفوفات", "الفهارس", "الترتيب", "الترتيب بالفقاعات"], stages: ["تعرّف على المصفوفات", "الوصول إلى العناصر", "ترتيب القيم", "خوارزمية الترتيب"] },
];

export const stages = chapters.flatMap((chapter) => chapter.stages.map((title, index) => ({
  id: `${chapter.id}-${index + 1}`, chapterId: chapter.id, number: index + 1,
  title, color: chapter.color, questionIds: publicQuestions.filter((q) => q.chapterId === chapter.id && q.stage === index + 1).map((q) => String(q.id)),
})));

export function arabicNumber(value: number) {
  return new Intl.NumberFormat("ar-EG").format(value);
}

export function utcDate(date = new Date()) { return date.toISOString().slice(0, 10); }

export function getDailyQuestions(date = utcDate()) {
  const day = Math.floor(Date.parse(`${date}T00:00:00Z`) / 86400000);
  const offset = ((day % 2) + 2) % 2 * 3;
  return publicQuestions.filter((q) => q.chapterId === 0).slice(offset, offset + 3);
}

export function getStreak(dates: string[], today = utcDate()) {
  const unique = new Set(dates);
  const cursor = new Date(`${today}T00:00:00Z`);
  if (!unique.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let count = 0;
  while (unique.has(utcDate(cursor))) { count++; cursor.setUTCDate(cursor.getUTCDate() - 1); }
  return count;
}

export const ranks = [
  { name: "مبتدئ", min: 0, description: "بداية كل رحلة عظيمة" },
  { name: "مفكّر", min: 100, description: "فضولك يقودك إلى المزيد" },
  { name: "محلّل", min: 300, description: "ترى ما وراء الأرقام" },
  { name: "خوارزمي", min: 600, description: "تحوّل الأفكار إلى حلول" },
  { name: "عقل خارق", min: 1000, description: "التفكير أصبح لغتك الثانية" },
];

export function getRank(xp: number) {
  const index = ranks.reduce((last, rank, i) => xp >= rank.min ? i : last, 0);
  return { ...ranks[index], index, next: ranks[index + 1] ?? null };
}

export function getStageProgress(stageId: string, progress: ProgressData) {
  const stage = stages.find((item) => item.id === stageId);
  if (!stage) return 0;
  return stage.questionIds.filter((id) => progress.completedQuestionIds.includes(id)).length;
}

export function getNextStage(progress: ProgressData) {
  return stages.find((stage) => progress.unlockedStages.includes(stage.id) && !progress.completedStages.includes(stage.id)) ?? stages[0];
}

export function normalizeAnswer(answer: string) {
  return answer.trim().replace(/[٠-٩۰-۹]/g, (digit) => {
    const code = digit.charCodeAt(0);
    return String(code - (code >= 1776 ? 1776 : 1632));
  }).replace(/\s+/g, " ").toLowerCase();
}
