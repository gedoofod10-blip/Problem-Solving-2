import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

const source = new URL("../src/data/questions.json", import.meta.url);
const target = new URL("../src/data/question-index.json", import.meta.url);
const questions = JSON.parse(await readFile(source, "utf8"));
assert.ok(Array.isArray(questions) && questions.length > 0);
assert.equal(new Set(questions.map((question) => question.id)).size, questions.length, "Question IDs must be unique.");
for (const question of questions) {
  assert.ok(question.question && question.explanation && question.correctAnswer, `Incomplete question ${question.id}`);
  assert.ok(["mcq", "boolean", "text"].includes(question.type));
  assert.ok(Number.isInteger(question.xp) && question.xp > 0);
  assert.ok(Array.isArray(question.options) && Array.isArray(question.acceptedAnswers));
  if (question.type === "mcq") assert.ok(question.options.includes(question.correctAnswer), `Correct option missing for ${question.id}`);
  if (question.type === "boolean") assert.ok(["true", "false"].includes(question.correctAnswer));
}
for (let chapter = 1; chapter <= 4; chapter++) {
  for (let stage = 1; stage <= 4; stage++) {
    const group = questions.filter((question) => question.chapterId === chapter && question.stage === stage);
    assert.equal(group.length, 3, `Stage ${chapter}-${stage} needs three questions.`);
    assert.equal(new Set(group.map((question) => question.type)).size, 3, `Stage ${chapter}-${stage} needs all quiz types.`);
  }
}
assert.equal(questions.filter((question) => question.chapterId === 0).length, 6);
const index = questions.map(({ id, chapterId, chapter, stage, difficulty, type, question, options, code, xp }) => ({ id, chapterId, chapter, stage, difficulty, type, question, options, ...(code ? { code } : {}), xp }));
await writeFile(target, JSON.stringify(index, null, 2) + "\n");
console.log(`Validated ${questions.length} questions and generated an answer-free index for ${index.length} public questions.`);
