import { eq } from "drizzle-orm";
import { db } from "@/db";
import { attempts, learners, questions } from "@/db/schema";
import { getDailyQuestions, getStreak, normalizeAnswer, stages, utcDate } from "@/lib/curriculum";
import { answerSchema } from "@/lib/progress";
import { assertSameOrigin, getOrCreateLearner } from "@/lib/server/session";
import { ensureQuestionBank } from "@/lib/server/question-store";
import type { AnswerResult } from "@/lib/types";

export const runtime = "nodejs";
export async function POST(request: Request) {
  if (!assertSameOrigin(request)) return Response.json({ error: "طلب غير مسموح." }, { status: 403 });
  const parsed = answerSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error.issues[0]?.message ?? "تحقّق من الإجابة المدخلة." }, { status: 400 });
  const { questionId, answer, mode } = parsed.data;
  try {
    await ensureQuestionBank();
    const [questionRow] = await db.select().from(questions).where(eq(questions.id, questionId)).limit(1);
    if (!questionRow) return Response.json({ error: "هذا السؤال غير متاح." }, { status: 404 });
    const question = questionRow.content;
    const today = utcDate();
    if (mode === "daily" && !getDailyQuestions(today).some((q) => q.id === questionId)) {
      return Response.json({ error: "انتهى هذا التحدي. تحدّيات اليوم بانتظارك!" }, { status: 409 });
    }
    if (mode === "stage" && !question.chapterId) return Response.json({ error: "ابدأ هذا السؤال من التحدي اليومي." }, { status: 400 });
    if (question.type === "mcq" && !question.options.includes(answer)) return Response.json({ error: "اختر إحدى الإجابات المتاحة." }, { status: 400 });
    if (question.type === "boolean" && !["true", "false"].includes(answer)) return Response.json({ error: "اختر صواب أو خطأ." }, { status: 400 });
    const learner = await getOrCreateLearner();
    const normalized = normalizeAnswer(answer);
    const correct = [question.correctAnswer, ...question.acceptedAnswers].some((accepted) => normalizeAnswer(accepted) === normalized);
    const result = await db.transaction(async (tx): Promise<AnswerResult> => {
      const [current] = await tx.select().from(learners).where(eq(learners.id, learner.id)).for("update");
      const progress = structuredClone(current.progress);
      const stageId = `${question.chapterId}-${question.stage}`;
      if (mode === "stage" && !progress.unlockedStages.includes(stageId)) throw new Error("LOCKED");
      const dailyKey = `${today}:${question.id}`;
      const firstCompletion = mode === "daily" ? !progress.dailyCompletions.includes(dailyKey) : !progress.completedQuestionIds.includes(String(question.id));
      const xpAwarded = correct && firstCompletion ? question.xp : 0;
      progress.totalAttempts += 1;
      if (correct) progress.correctAttempts += 1;
      progress.xp += xpAwarded;
      if (!progress.activityDates.includes(today)) progress.activityDates.push(today);
      progress.streak = getStreak(progress.activityDates, today);
      progress.bestStreak = Math.max(progress.bestStreak, progress.streak);
      if (correct && firstCompletion) {
        progress.completedQuestionIds.push(String(question.id));
        if (mode === "daily") progress.dailyCompletions.push(dailyKey);
        if (mode === "stage") {
          const stage = stages.find((item) => item.id === stageId);
          if (stage && stage.questionIds.every((id) => progress.completedQuestionIds.includes(id)) && !progress.completedStages.includes(stageId)) {
            progress.completedStages.push(stageId);
            const next = stages[stages.indexOf(stage) + 1];
            if (next && !progress.unlockedStages.includes(next.id)) progress.unlockedStages.push(next.id);
          }
        }
      }
      progress.updatedAt = new Date().toISOString();
      await tx.update(learners).set({ progress, updatedAt: new Date() }).where(eq(learners.id, learner.id));
      await tx.insert(attempts).values({ learnerId: learner.id, questionId, mode, answer, correct, xpAwarded, activityDate: today });
      return { correct, correctAnswer: question.type === "boolean" ? (question.correctAnswer === "true" ? "صواب" : "خطأ") : question.correctAnswer, explanation: question.explanation, xpAwarded, progress };
    });
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (error instanceof Error && error.message === "LOCKED") return Response.json({ error: "أكمل المرحلة السابقة لفتح هذا السؤال." }, { status: 403 });
    console.error("Answer submission failed", error instanceof Error ? error.message : "unknown error");
    return Response.json({ error: "تعذّر التحقق من الإجابة. لم يُفقد تقدّمك؛ تحقّق من الاتصال وحاول مجددًا." }, { status: 503 });
  }
}
