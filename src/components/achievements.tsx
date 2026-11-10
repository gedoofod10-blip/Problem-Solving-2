"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Award, BrainCircuit, Box, CircleAlert, Flame, Footprints, LoaderCircle, LockKeyhole, Medal, RefreshCw, Route, Sparkles, Star, Target, Trophy, Users, Zap } from "lucide-react";
import { arabicNumber, chapters, getNextStage, getRank, ranks, utcDate } from "@/lib/curriculum";
import { useProgress } from "./progress-provider";
import { ProgressBar } from "./ui";
import type { LearningActions } from "./dashboard";

export function Achievements({ onStage }: Pick<LearningActions, "onStage">) {
  const { progress, ready } = useProgress();
  const [filter, setFilter] = useState<"all" | "earned">("all");
  const accuracy = progress.totalAttempts ? progress.correctAttempts / progress.totalAttempts * 100 : 0;
  const achievements = [
    { id: "first", title: "الخطوة الأولى", description: "أجب عن أول سؤال بشكل صحيح.", icon: Footprints, color: "green", current: progress.completedQuestionIds.length, target: 1 },
    { id: "memory", title: "صديق الذاكرة", description: "أكمل مراحل فصل المتغيرات والذاكرة.", icon: Box, color: "purple", current: chapters[0].stages.filter((_, index) => progress.completedStages.includes(`1-${index + 1}`)).length, target: 4 },
    { id: "streak", title: "شعلة لا تنطفئ", description: "تعلّم ثلاثة أيام متتالية.", icon: Flame, color: "coral", current: progress.bestStreak, target: 3 },
    { id: "xp", title: "رصيد من المعرفة", description: "اجمع أول ١٠٠ نقطة خبرة.", icon: Star, color: "gold", current: progress.xp, target: 100 },
    { id: "accuracy", title: "عين على التفاصيل", description: "حقّق دقة ٩٠٪ بعد ١٠ محاولات على الأقل.", icon: Target, color: "blue", current: progress.totalAttempts >= 10 && accuracy >= 90 ? 1 : 0, target: 1 },
    { id: "half", title: "في منتصف الطريق", description: "أكمل ثماني مراحل من رحلتك.", icon: Route, color: "green", current: progress.completedStages.length, target: 8 },
    { id: "daily", title: "بطل اليوم", description: "أكمل تحديات اليوم الثلاثة.", icon: Zap, color: "gold", current: progress.dailyCompletions.filter((key) => key.startsWith(`${ready ? utcDate() : "2026-01-01"}:`)).length, target: 3 },
    { id: "master", title: "العقل الخوارزمي", description: "أكمل جميع مراحل الرحلة الستّ عشرة.", icon: BrainCircuit, color: "purple", current: progress.completedStages.length, target: 16 },
  ];
  const earned = achievements.filter((achievement) => achievement.current >= achievement.target).length;
  const visible = filter === "all" ? achievements : achievements.filter((achievement) => achievement.current >= achievement.target);
  return <div className="page-enter"><div className="page-heading"><span className="eyebrow"><Award size={15} />كل إنجاز له قصة</span><h1>إنجازاتك</h1><p>ليست مجرد أوسمة. إنها علامة على أنك تفكّر بطريقة مختلفة.</p></div><div className="achievement-overview"><div className="achievement-trophy"><Medal size={42} strokeWidth={1.4} /></div><div><h2>إنجازات تحكي رحلتك.</h2><p>حصلت على {arabicNumber(earned)} من ٨ أوسمة. الإنجاز القادم أقرب مما تتخيّل.</p></div><div className="achievement-count"><strong>{arabicNumber(earned)}</strong><span>/ ٨ أوسمة</span></div></div><div className="filter-tabs achievements-filter"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")} aria-pressed={filter === "all"}>كل الإنجازات <span>٨</span></button><button className={filter === "earned" ? "active" : ""} onClick={() => setFilter("earned")} aria-pressed={filter === "earned"}>المكتسبة <span>{arabicNumber(earned)}</span></button></div>
    {visible.length ? <div className="achievements-grid">{visible.map((achievement, index) => {
      const unlocked = achievement.current >= achievement.target;
      return <motion.article key={achievement.id} className={`achievement-card accent-${achievement.color} ${unlocked ? "earned" : ""}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}><span className="achievement-lock">{unlocked ? <Sparkles size={16} /> : <LockKeyhole size={15} />}</span><div className="achievement-icon"><achievement.icon size={34} strokeWidth={1.4} /></div><h3>{achievement.title}</h3><p>{achievement.description}</p><ProgressBar value={achievement.current / achievement.target * 100} label={`تقدّم إنجاز ${achievement.title}`} /><span className="achievement-progress-label">{unlocked ? "تم الحصول على الوسام" : `${arabicNumber(Math.min(achievement.current, achievement.target))} / ${arabicNumber(achievement.target)}`}</span></motion.article>;
    })}</div> : <div className="empty-state"><Award size={48} strokeWidth={1.2} /><h2>أول وسام ينتظرك.</h2><p>كل ما عليك هو الإجابة عن سؤالك الأول بشكل صحيح.</p><button className="button button-primary" onClick={() => onStage(getNextStage(progress).id)}>اصنع إنجازك الأول<ArrowLeft size={17} /></button></div>}
  </div>;
}

interface LeaderboardEntry { name: string; xp: number; stages: number; position: number | null; isMe: boolean }
interface LeaderboardData { entries: LeaderboardEntry[]; current: LeaderboardEntry | null }

export function Leaderboard({ onDaily, onSettings }: { onDaily: () => void; onSettings: () => void }) {
  const { progress, ready } = useProgress();
  const [data, setData] = useState<LeaderboardData>({ entries: [], current: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (!ready) return;
    const controller = new AbortController();
    fetch("/api/leaderboard", { signal: controller.signal, cache: "no-store" }).then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error || "تعذّر تحميل لوحة الشرف."); return body as LeaderboardData; }).then((body) => { if (!controller.signal.aborted) { setData(body); setError(""); } }).catch((cause: unknown) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "تعذّر الاتصال بالخادم."); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [ready, progress.xp, reload]);
  const rank = getRank(progress.xp);
  return <div className="page-enter"><div className="page-heading"><span className="eyebrow gold-text"><Trophy size={15} />نتعلّم معًا، ونتقدّم معًا</span><h1>لوحة الشرف</h1><p>مساحة تحتفي بفضول المستكشفين وجهدهم. منافستك الحقيقية هي مع نفسك بالأمس.</p></div><div className="rank-ladder">{ranks.map((item, index) => <div className={`rank-step ${index === rank.index ? "current" : ""} ${index < rank.index ? "passed" : ""}`} key={item.name}><span>{index === 4 ? <BrainCircuit size={23} /> : index > 1 ? <Trophy size={23} /> : <Medal size={23} />}</span><h3>{item.name}</h3><p>{arabicNumber(item.min)} نقطة</p>{index === rank.index && <small>رتبتك الحالية</small>}</div>)}</div>
    <section className="leaderboard-panel"><div className="section-heading"><div className="section-title"><Users size={20} /><h2>المستكشفون</h2><span className="live-badge"><span className="status-dot" />تقدّم حقيقي</span></div><button className="icon-button" onClick={() => { setLoading(true); setError(""); setReload((value) => value + 1); }} disabled={loading} aria-label="تحديث لوحة الشرف"><RefreshCw size={17} className={loading ? "spin" : ""} /></button></div>
      {loading ? <div className="loading-state"><LoaderCircle size={28} className="spin" /><p>نجمع إنجازات المستكشفين…</p></div> : error ? <div className="empty-state"><CircleAlert size={38} /><h2>الاتصال يحتاج محاولة أخرى.</h2><p>{error}</p><button className="button button-secondary" onClick={() => { setLoading(true); setError(""); setReload((value) => value + 1); }}><RefreshCw size={16} />إعادة المحاولة</button></div> : !data.entries.length ? <div className="empty-state"><div className="empty-trophy"><Trophy size={45} strokeWidth={1.3} /></div><h2>المكان الأول ينتظرك.</h2><p>كن أول من يترك أثره. أجب عن تحدٍ واحد لتظهر في لوحة الشرف.</p><button className="button button-primary" onClick={onDaily}>ابدأ بتحدٍ سريع<ArrowLeft size={17} /></button></div> : <div className="table-scroll"><table className="leaderboard-table"><thead><tr><th scope="col">الترتيب</th><th scope="col">المستكشف</th><th scope="col">المراحل المكتملة</th><th scope="col">نقاط الخبرة</th></tr></thead><tbody>{data.entries.map((entry) => <tr key={`${entry.name}-${entry.position}`} className={entry.isMe ? "my-row" : ""}><td><span className={`table-position position-${entry.position}`}>{entry.position && entry.position <= 3 ? <Trophy size={19} /> : arabicNumber(entry.position ?? 0)}</span></td><td><div className="table-learner"><span className="small-avatar">{entry.name.slice(0, 1)}</span><strong>{entry.name}</strong>{entry.isMe && <span className="me-badge">أنت</span>}</div></td><td>{arabicNumber(entry.stages)} / ١٦</td><td><span className="table-xp"><Star size={15} />{arabicNumber(entry.xp)}</span></td></tr>)}</tbody></table></div>}
      {data.current && <div className="my-standing"><div><Trophy size={21} /><span>ترتيبك بين المستكشفين <strong>#{arabicNumber(data.current.position ?? 1)}</strong></span></div><button className="text-link" onClick={onSettings}>خصّص اسمك<ArrowLeft size={15} /></button></div>}
    </section><div className="page-bottom-note"><LockKeyhole size={15} />تظهر الأسماء المستعارة فقط. لا نعرض أي بيانات شخصية.</div>
  </div>;
}
