import { asc } from "drizzle-orm";
import { db } from "@/db";
import { questions } from "@/db/schema";
import { ensureQuestionBank } from "@/lib/server/question-store";
import { publicQuestions } from "@/lib/curriculum";

export const runtime = "nodejs";
export async function GET() {
  try {
    await ensureQuestionBank();
    const rows = await db.select({ content: questions.content }).from(questions).orderBy(asc(questions.id));
    const safeQuestions = rows.map(({ content: q }) => ({ id: q.id, chapterId: q.chapterId, chapter: q.chapter, stage: q.stage, difficulty: q.difficulty, type: q.type, question: q.question, options: q.options, code: q.code, xp: q.xp }));
    return Response.json({ questions: safeQuestions }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  } catch {
    return Response.json({ questions: publicQuestions, source: "local-bank" });
  }
}
