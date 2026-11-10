import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@/db";
import { learners } from "@/db/schema";
import { EMPTY_PROGRESS } from "@/lib/types";

export const SESSION_COOKIE = "algorithmic_mind_session";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function getSessionId() {
  const value = (await cookies()).get(SESSION_COOKIE)?.value;
  return value && uuidPattern.test(value) ? value : null;
}

export async function getOrCreateLearner() {
  const existing = await getSessionId();
  if (existing) {
    const [learner] = await db.select().from(learners).where(eq(learners.id, existing)).limit(1);
    if (learner) return learner;
  }
  const id = randomUUID();
  const [learner] = await db.insert(learners).values({ id, progress: { ...EMPTY_PROGRESS } }).returning();
  (await cookies()).set(SESSION_COOKIE, id, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: 60 * 60 * 24 * 365,
  });
  return learner;
}

export function assertSameOrigin(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return false;
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    const host = request.headers.get("x-forwarded-host")?.split(",")[0].trim() || request.headers.get("host") || new URL(request.url).host;
    return new URL(origin).host === host;
  } catch { return false; }
}
