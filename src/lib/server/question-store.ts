import { sql } from "drizzle-orm";
import { db } from "@/db";
import { chapters as chapterTable, questions as questionTable } from "@/db/schema";
import { chapters } from "@/lib/curriculum";
import { questions } from "@/lib/server/question-bank";

let seedPromise: Promise<void> | null = null;
export function ensureQuestionBank() {
  if (!seedPromise) {
    seedPromise = db.transaction(async (tx) => {
      await tx.insert(chapterTable).values(chapters.map((chapter) => ({ id: chapter.id, title: chapter.title, position: chapter.id, content: chapter })))
        .onConflictDoUpdate({ target: chapterTable.id, set: { title: sql`excluded.title`, content: sql`excluded.content` } });
      await tx.insert(questionTable).values(questions.map((question) => ({
        id: question.id, chapterId: question.chapterId || null,
        stageId: question.chapterId ? `${question.chapterId}-${question.stage}` : "daily",
        type: question.type, difficulty: question.difficulty, content: question,
      }))).onConflictDoUpdate({ target: questionTable.id, set: { content: sql`excluded.content`, type: sql`excluded.type`, difficulty: sql`excluded.difficulty` } });
    }).catch((error) => { seedPromise = null; throw error; });
  }
  return seedPromise;
}
