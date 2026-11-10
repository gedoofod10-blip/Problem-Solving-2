import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";

// Optional browser test dependency: npm install --no-save playwright
// PLAYWRIGHT_MODULE can point to an isolated Playwright installation.
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || "playwright");
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3000";
await mkdir(".screenshots", { recursive: true });
const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] });
const errors = [];
function observe(page, label) {
  page.on("pageerror", (error) => errors.push(`${label}: ${error.message}`));
  page.on("console", (message) => { if (message.type() === "error") errors.push(`${label}: ${message.text()}`); });
}
async function open(page, route = "/") {
  await page.goto(base + route, { waitUntil: "networkidle" });
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.waitForTimeout(450);
}
async function answerCorrectly(page, answer, isText = false) {
  if (isText) await page.locator("#quiz-answer").fill(answer);
  else await page.locator(".answer-option").filter({ hasText: answer }).click();
  await page.getByRole("button", { name: "تحقّق من الإجابة" }).click();
  await page.locator(".answer-feedback.success").waitFor();
}
try {
  const desktop = await browser.newContext({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 });
  const page = await desktop.newPage(); observe(page, "desktop");
  await open(page);
  assert.equal(await page.locator("html").getAttribute("dir"), "rtl");
  assert.equal(await page.locator("html").getAttribute("lang"), "ar");
  await page.screenshot({ path: ".screenshots/desktop.png", fullPage: true });
  console.log("Desktop:", await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth, height: document.documentElement.scrollHeight })));
  await page.getByRole("button", { name: "ابدأ رحلتك", exact: true }).click();
  await page.getByRole("dialog").waitFor(); await page.waitForTimeout(250);
  await page.screenshot({ path: ".screenshots/quiz.png" });
  await page.locator(".answer-option").filter({ hasText: "٤" }).click();
  await page.getByRole("button", { name: "تحقّق من الإجابة" }).click();
  await page.locator(".answer-feedback.error").waitFor();
  await page.getByRole("button", { name: "حاول مرة أخرى" }).click();
  await answerCorrectly(page, "٦");
  await page.getByRole("button", { name: "السؤال التالي" }).click();
  await answerCorrectly(page, "صواب");
  await page.getByRole("button", { name: "السؤال التالي" }).click();
  await answerCorrectly(page, "٧", true);
  await page.getByRole("button", { name: "إنهاء المرحلة" }).click();
  await page.locator(".quiz-summary").waitFor();
  assert.match(await page.locator(".summary-numbers").innerText(), /٦٠/);
  await page.getByRole("button", { name: "العودة إلى رحلتي", exact: true }).click();
  await page.waitForTimeout(400);
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("algorithmic-mind:progress:v1")).xp), 60);
  await open(page);
  assert.equal(await page.locator(".xp-stat strong").innerText(), "٦٠");
  await page.getByRole("button", { name: "الإعدادات", exact: true }).click();
  await page.locator("#display-name").fill("مختبر الواجهة");
  await page.getByRole("switch", { name: "تقليل الحركة" }).click();
  await page.getByRole("button", { name: "حفظ الإعدادات" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  await open(page);
  await page.getByRole("button", { name: "الإعدادات", exact: true }).click();
  assert.equal(await page.getByRole("switch", { name: "تقليل الحركة" }).getAttribute("aria-checked"), "true");
  await page.getByRole("button", { name: "إعادة تعيين التقدّم", exact: true }).click();
  await page.getByRole("button", { name: "نعم، ابدأ من جديد" }).click();
  await page.getByRole("dialog").waitFor({ state: "hidden" });
  assert.equal(await page.locator(".xp-stat strong").innerText(), "٠");
  console.log("PASS: wrong-answer explanation, retry, all quiz types, completion, XP, reload persistence, profile, reduced motion, reset.");

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const mp = await mobile.newPage(); observe(mp, "mobile"); await open(mp);
  await mp.screenshot({ path: ".screenshots/mobile.png", fullPage: true });
  assert.equal(await mp.evaluate(() => document.documentElement.scrollWidth), 390);
  await mp.getByRole("button", { name: "فتح قائمة التنقل" }).click();
  await mp.locator(".sidebar").getByRole("link", { name: "خريطة التعلّم" }).click();
  await mp.waitForURL("**/map"); await mp.waitForTimeout(350);
  await mp.locator(".map-filters button").filter({ hasText: "الشروط والمنطق" }).click();
  await mp.locator(".map-stage").first().click(); await mp.locator(".toast").waitFor();
  assert.match(await mp.locator(".toast").innerText(), /أكمل/);
  await mp.screenshot({ path: ".screenshots/mobile-map.png", fullPage: true });
  await mp.getByRole("button", { name: "فتح قائمة التنقل" }).click();
  await mp.locator(".sidebar").getByRole("link", { name: "التحديات اليومية" }).click();
  await mp.waitForURL("**/challenges");
  await mp.getByRole("button", { name: "اقبل التحدي", exact: true }).first().click();
  await mp.getByRole("dialog").waitFor(); await mp.waitForTimeout(250);
  await mp.screenshot({ path: ".screenshots/mobile-quiz.png" });
  await mp.getByRole("button", { name: "إغلاق النافذة" }).click();
  await mp.getByRole("dialog").waitFor({ state: "hidden" });
  console.log("PASS: mobile navigation, filtering, locked-stage feedback, daily quiz and dialog dismissal.");

  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/", "/map", "/challenges", "/achievements", "/leaderboard"]) {
      await open(page, route);
      const dimensions = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
      assert.equal(dimensions.content, dimensions.viewport, `Horizontal overflow at ${width}px on ${route}`);
    }
  }
  const restricted = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await restricted.addInitScript(() => { Object.defineProperty(window, "localStorage", { get() { throw new DOMException("Storage disabled", "SecurityError"); } }); });
  const rp = await restricted.newPage(); observe(rp, "storage-denied"); await open(rp);
  await rp.getByRole("button", { name: "ابدأ رحلتك", exact: true }).click(); await rp.getByRole("dialog").waitFor();
  console.log("PASS: 25 responsive page/viewport combinations; localStorage-denied browsing remains usable.");
  assert.deepEqual(errors, [], "Browser console and hydration errors");
  console.log("PASS: no browser console errors or hydration errors.");
} finally { await browser.close(); }
