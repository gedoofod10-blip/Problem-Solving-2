import { and, asc, count, desc, eq, gt, ne, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { learners } from "@/db/schema";
import { getSessionId } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const sessionId = await getSessionId();
    const rows = await db.select({ id: learners.id, name: learners.displayName, xp: sql<number>`(${learners.progress}->>'xp')::integer`, stages: sql<number>`jsonb_array_length(${learners.progress}->'completedStages')`, position: sql<number>`(rank() over (order by (${learners.progress}->>'xp')::integer desc))::integer` })
      .from(learners).where(sessionId ? or(gt(sql`(${learners.progress}->>'xp')::integer`, 0), eq(learners.id, sessionId)) : gt(sql`(${learners.progress}->>'xp')::integer`, 0))
      .orderBy(desc(sql`(${learners.progress}->>'xp')::integer`), asc(learners.createdAt)).limit(20);
    const [current] = sessionId ? await db.select({ id: learners.id, name: learners.displayName, xp: sql<number>`(${learners.progress}->>'xp')::integer`, stages: sql<number>`jsonb_array_length(${learners.progress}->'completedStages')` }).from(learners).where(eq(learners.id, sessionId)).limit(1) : [];
    let currentRank: number | null = null;
    if (current) {
      const [ahead] = await db.select({ value: count() }).from(learners).where(and(gt(sql`(${learners.progress}->>'xp')::integer`, current.xp), ne(learners.id, current.id)));
      currentRank = ahead.value + 1;
    }
    return Response.json({ entries: rows.map((row) => ({ position: row.position, name: row.name, xp: row.xp, stages: row.stages, isMe: row.id === sessionId })), current: current ? { ...current, isMe: true, position: currentRank } : null }, { headers: { "Cache-Control": "private, no-store" } });
  } catch { return Response.json({ error: "لوحة الشرف غير متاحة الآن. حاول مرة أخرى بعد قليل." }, { status: 503 }); }
}
