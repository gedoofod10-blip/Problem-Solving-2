import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { attempts, learners } from "@/db/schema";
import { EMPTY_PROGRESS } from "@/lib/types";
import { assertSameOrigin, getOrCreateLearner, getSessionId } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET() {
  try {
    const id = await getSessionId();
    if (!id) return Response.json({ progress: EMPTY_PROGRESS }, { headers });
    const [learner] = await db.select().from(learners).where(eq(learners.id, id)).limit(1);
    return Response.json({ progress: learner?.progress ?? EMPTY_PROGRESS }, { headers });
  } catch {
    return Response.json({ error: "تعذّر الاتصال بالخادم. تقدّمك المحلي آمن؛ حاول مرة أخرى." }, { status: 503, headers });
  }
}

export async function PATCH(request: Request) {
  if (!assertSameOrigin(request)) return Response.json({ error: "طلب غير مسموح." }, { status: 403 });
  const parsed = z.object({ name: z.string().trim().min(2, "اكتب اسمًا من حرفين على الأقل.").max(40) }).strict().safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: parsed.error?.issues[0]?.message ?? "الاسم غير صالح." }, { status: 400 });
  try {
    const learner = await getOrCreateLearner();
    const progress = { ...learner.progress, displayName: parsed.data.name, updatedAt: new Date().toISOString() };
    await db.update(learners).set({ displayName: parsed.data.name, progress, updatedAt: new Date() }).where(eq(learners.id, learner.id));
    return Response.json({ progress }, { headers });
  } catch { return Response.json({ error: "تعذّر حفظ الاسم. حاول مرة أخرى." }, { status: 503 }); }
}

export async function DELETE(request: Request) {
  if (!assertSameOrigin(request)) return Response.json({ error: "طلب غير مسموح." }, { status: 403 });
  try {
    const id = await getSessionId();
    if (!id) return Response.json({ progress: EMPTY_PROGRESS }, { headers });
    const [learner] = await db.select().from(learners).where(eq(learners.id, id)).limit(1);
    const progress = { ...EMPTY_PROGRESS, displayName: learner?.displayName ?? "مستكشف جديد", updatedAt: new Date().toISOString() };
    await db.transaction(async (tx) => {
      await tx.delete(attempts).where(eq(attempts.learnerId, id));
      await tx.update(learners).set({ progress, updatedAt: new Date() }).where(eq(learners.id, id));
    });
    return Response.json({ progress }, { headers });
  } catch { return Response.json({ error: "تعذّرت إعادة تعيين التقدّم. حاول مرة أخرى." }, { status: 503 }); }
}
