import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
const bank = JSON.parse(await readFile(new URL("../src/data/questions.json", import.meta.url), "utf8"));
let cookie = "";
async function call(path, method = "GET", body, extraHeaders = {}) {
  const response = await fetch(`${base}${path}`, { method, headers: { "Content-Type": "application/json", Origin: base, ...(cookie ? { Cookie: cookie } : {}), ...extraHeaders }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const setCookie = response.headers.getSetCookie().find((value) => value.startsWith("algorithmic_mind_session="));
  if (setCookie) cookie = setCookie.split(";")[0];
  return { status: response.status, data: await response.json() };
}
function solved(answer, id, expectedXp) {
  assert.equal(answer.status, 200, JSON.stringify(answer.data));
  assert.equal(answer.data.correct, true, `Question ${id} should be correct`);
  assert.equal(answer.data.xpAwarded, expectedXp, `Question ${id} reward`);
  assert.ok(answer.data.explanation.length > 20);
}

try {
  assert.equal((await call("/api/health")).data.ok, true);
  const initial = await call("/api/progress");
  assert.equal(initial.data.progress.xp, 0);
  const questionResponse = await call("/api/questions");
  assert.equal(questionResponse.status, 200);
  assert.equal(questionResponse.data.questions.length, 54);
  for (const question of questionResponse.data.questions) {
    assert.equal(question.correctAnswer, undefined);
    assert.equal(question.acceptedAnswers, undefined);
    assert.equal(question.explanation, undefined);
  }
  assert.equal((await call("/api/answer", "POST", { questionId: 1, answer: "٦" }, { Origin: "https://untrusted.example" })).status, 403);
  assert.equal((await call("/api/answer", "POST", { questionId: 13, answer: "خطأ" })).status, 403);
  assert.equal((await call("/api/answer", "POST", { questionId: 1, answer: "" })).status, 400);
  assert.equal((await call("/api/answer", "POST", { questionId: 99999, answer: "1" })).status, 404);

  solved(await call("/api/answer", "POST", { questionId: 1, answer: "٦" }), 1, 20);
  solved(await call("/api/answer", "POST", { questionId: 1, answer: "٦" }), 1, 0);
  const wrong = await call("/api/answer", "POST", { questionId: 2, answer: "false" });
  assert.equal(wrong.status, 200); assert.equal(wrong.data.correct, false); assert.equal(wrong.data.xpAwarded, 0);
  solved(await call("/api/answer", "POST", { questionId: 2, answer: "true" }), 2, 20);
  const stage = await call("/api/answer", "POST", { questionId: 3, answer: "٧" });
  solved(stage, 3, 20);
  assert.equal(stage.data.progress.xp, 60);
  assert.ok(stage.data.progress.completedStages.includes("1-1"));
  assert.ok(stage.data.progress.unlockedStages.includes("1-2"));
  assert.equal(stage.data.progress.streak, 1);
  // The repeated correct answer counts toward accuracy, but never awards XP twice.
  assert.equal(stage.data.progress.correctAttempts, 4);
  assert.equal(stage.data.progress.totalAttempts, 5);

  const today = new Date().toISOString().slice(0, 10);
  const day = Math.floor(Date.parse(`${today}T00:00:00Z`) / 86400000);
  const dailyId = 101 + (day % 2) * 3;
  const dailyQuestion = bank.find((question) => question.id === dailyId);
  solved(await call("/api/answer", "POST", { questionId: dailyId, answer: dailyQuestion.correctAnswer, mode: "daily" }), dailyId, 50);
  solved(await call("/api/answer", "POST", { questionId: dailyId, answer: dailyQuestion.correctAnswer, mode: "daily" }), dailyId, 0);
  assert.equal((await call("/api/answer", "POST", { questionId: dailyId, answer: dailyQuestion.correctAnswer })).status, 400);

  const profile = await call("/api/progress", "PATCH", { name: "مختبر المنصة" });
  assert.equal(profile.status, 200); assert.equal(profile.data.progress.displayName, "مختبر المنصة");
  const leaderboard = await call("/api/leaderboard");
  assert.equal(leaderboard.status, 200); assert.ok(leaderboard.data.entries.some((entry) => entry.isMe && entry.xp === 110));
  assert.equal((await call("/api/progress")).data.progress.xp, 110);
  const reset = await call("/api/progress", "DELETE");
  assert.equal(reset.status, 200); assert.equal(reset.data.progress.xp, 0); assert.deepEqual(reset.data.progress.completedStages, []); assert.deepEqual(reset.data.progress.unlockedStages, ["1-1"]);
  assert.equal((await call("/api/leaderboard")).data.current.xp, 0);
  console.log("PASS: health, 54 public questions, private answer keys, origin protection, locked stages, MCQ, boolean, Arabic text, retries, single-award XP, stage unlocking, streak, daily challenges, profile, real leaderboard, persistence, and reset.");
} finally {
  if (cookie) await call("/api/progress", "DELETE");
}
