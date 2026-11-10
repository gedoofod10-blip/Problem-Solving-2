import { z } from "zod";

export const progressSchema = z.object({
  displayName: z.string().min(1).max(60),
  xp: z.number().int().min(0).max(1000000),
  completedQuestionIds: z.array(z.string().max(12)).max(10000),
  completedStages: z.array(z.string().max(12)).max(1000),
  unlockedStages: z.array(z.string().max(12)).max(1000),
  totalAttempts: z.number().int().min(0),
  correctAttempts: z.number().int().min(0),
  streak: z.number().int().min(0),
  bestStreak: z.number().int().min(0),
  activityDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).max(10000),
  dailyCompletions: z.array(z.string().max(30)).max(30000),
  updatedAt: z.string().max(40),
});

export const settingsSchema = z.object({
  name: z.string().min(1).max(60), sound: z.boolean(), reducedMotion: z.boolean(),
});

export const answerSchema = z.object({
  questionId: z.number().int().positive(),
  answer: z.string().trim().min(1, "اختر إجابة أو اكتبها أولًا.").max(120),
  mode: z.enum(["stage", "daily"]).default("stage"),
}).strict();

export function readLocal<T>(key: string, schema: z.ZodType<T>, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const result = schema.safeParse(JSON.parse(raw));
    return result.success ? result.data : fallback;
  } catch { return fallback; }
}

export function writeLocal(key: string, value: unknown): boolean {
  if (typeof window === "undefined") return false;
  try { window.localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { return false; }
}
