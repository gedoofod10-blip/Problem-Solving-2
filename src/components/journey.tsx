"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Check, CircleCheck, Clock3, Flame, LockKeyhole, Route, Sparkles, Trophy, Zap } from "lucide-react";
import { arabicNumber, chapters, getDailyQuestions, getNextStage, getStageProgress, stages, utcDate } from "@/lib/curriculum";
import { chapterIcons, type LearningActions } from "./dashboard";
import { useProgress } from "./progress-provider";
import { ProgressBar } from "./ui";

export function JourneyMap({ onStage }: Pick<LearningActions, "onStage">) {
  const { progress } = useProgress();
  const [filter, setFilter] = useState(0);
  const next = getNextStage(progress);
  return <div className="page-enter"><div className="page-heading"><span className="eyebrow"><Route size={15} />خطوة بخطوة</span><h1>خريطة التعلّم</h1><p>من أول قيمة في الذاكرة إلى أول خوارزمية ترتيب. رحلتك تبدأ من هنا.</p></div>
    <div className="map-overview"><span className="overview-icon"><Route size={30} /></span><div><h2>كل مرحلة تفتح لك بابًا جديدًا.</h2><p>أكملت {arabicNumber(progress.completedStages.length)} من ١٦ مرحلة. التالي: {next.title}.</p></div><div className="map-overview-progress"><strong>{arabicNumber(Math.round(progress.completedStages.length / 16 * 100))}٪</strong><ProgressBar value={progress.completedStages.length / 16 * 100} label="تقدّم الرحلة الكامل" /></div><button className="button button-primary" onClick={() => onStage(next.id)}>أكمل رحلتك<ArrowLeft size={17} /></button></div>
    <div className="map-filters filter-tabs" aria-label="فصول الخريطة"><button className={filter === 0 ? "active" : ""} onClick={() => setFilter(0)} aria-pressed={filter === 0}>كل الفصول</button>{chapters.map((chapter) => <button key={chapter.id} className={filter === chapter.id ? "active" : ""} onClick={() => setFilter(chapter.id)} aria-pressed={filter === chapter.id}>{chapter.shortTitle}</button>)}</div>
    <div className="map-chapters">{chapters.filter((chapter) => !filter || chapter.id === filter).map((chapter) => {
      const Icon = chapterIcons[chapter.icon as keyof typeof chapterIcons];
      const chapterStages = stages.filter((stage) => stage.chapterId === chapter.id);
      const completed = chapterStages.filter((stage) => progress.completedStages.includes(stage.id)).length;
      return <section key={chapter.id} className={`map-chapter accent-${chapter.color}`}><div className="map-chapter-heading"><span className="chapter-icon"><Icon size={24} /></span><div><span className="chapter-kicker">الفصل {chapter.order}</span><h2>{chapter.title}</h2></div><span className="map-chapter-count">{arabicNumber(completed)} / ٤ مراحل مكتملة</span></div><div className="map-stage-grid">{chapterStages.map((stage) => {
        const unlocked = progress.unlockedStages.includes(stage.id);
        const done = progress.completedStages.includes(stage.id);
        const solved = getStageProgress(stage.id, progress);
        return <motion.button key={stage.id} className={`map-stage ${unlocked ? "available" : "unavailable"} ${done ? "done" : ""}`} onClick={() => onStage(stage.id)} whileHover={unlocked ? { y: -3 } : undefined} aria-label={`${stage.title}، ${done ? "مكتملة" : unlocked ? "متاحة" : "مقفلة"}`}><div className="map-stage-top"><span className="map-stage-number">{arabicNumber(stage.number).padStart(2, "٠")}</span>{done ? <CircleCheck size={20} /> : unlocked ? <span className="status-dot" /> : <LockKeyhole size={18} />}</div><h3>{stage.title}</h3><span className="map-stage-meta">٣ أسئلة · {chapter.topics[stage.number - 1]}</span><ProgressBar value={solved / 3 * 100} label={`تقدّم ${stage.title}`} /><span className="map-stage-action">{done ? "راجع المرحلة" : unlocked ? "ابدأ المرحلة" : "أكمل المرحلة السابقة"}{unlocked ? <ArrowLeft size={15} /> : <LockKeyhole size={12} />}</span></motion.button>;
      })}</div></section>;
    })}</div><div className="page-bottom-note"><LightbulbIcon />لا توجد سرعة مثالية للتعلّم. تقدّم بالوتيرة التي تناسبك.</div>
  </div>;
}

function LightbulbIcon() { return <Sparkles size={16} />; }

export function Challenges({ onDaily }: Pick<LearningActions, "onDaily">) {
  const { progress, ready } = useProgress();
  const today = ready ? utcDate() : "2026-01-01";
  const daily = getDailyQuestions(today);
  const completed = daily.filter((q) => progress.dailyCompletions.includes(`${today}:${q.id}`)).length;
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(`${today}T00:00:00Z`); date.setUTCDate(date.getUTCDate() - 6 + index);
    return { date: utcDate(date), day: new Intl.DateTimeFormat("ar", { weekday: "short", timeZone: "UTC" }).format(date), number: new Intl.NumberFormat("ar-EG").format(date.getUTCDate()) };
  });
  return <div className="page-enter"><div className="page-heading"><span className="eyebrow gold-text"><Zap size={15} />جرعة يومية من الفضول</span><h1>تحدّيات اليوم</h1><p>ثلاثة ألغاز صغيرة، وفرصة جديدة لتفاجئ عقلك. تتجدّد كل يوم عند منتصف الليل بتوقيت غرينتش.</p></div>
    <section className="challenge-overview"><div className="challenge-overview-copy"><span className="hero-badge gold-badge"><Flame size={15} />القليل كل يوم يصنع الكثير</span><h2>{completed === 3 ? "أحسنت! أتممت تحديات اليوم." : "حافظ على شعلة فضولك."}</h2><p>أكملت {arabicNumber(completed)} من ٣ تحديات اليوم. كل تحدٍ يمنحك ٥٠ نقطة خبرة.</p><Countdown /></div><div className="streak-week"><span className="streak-week-title"><Flame size={17} />آخر ٧ أيام من رحلتك</span><div className="week-days">{week.map((day) => <div className={`week-day ${progress.activityDates.includes(day.date) ? "active" : ""} ${day.date === today ? "today" : ""}`} key={day.date}><span>{day.day}</span><span className="week-day-circle" title={day.date}>{progress.activityDates.includes(day.date) ? <Check size={18} /> : day.number}</span><i /></div>)}</div><span className="week-note">تعلّم اليوم، لتشكر نفسك غدًا.</span></div></section>
    <div className="section-heading"><div className="section-title"><Zap size={20} /><h2>بانتظار عقلك الفضولي</h2></div><span className="muted text-sm">{arabicNumber(completed)} / ٣ مكتملة</span></div>
    <div className="daily-question-grid">{daily.map((question, index) => {
      const done = progress.dailyCompletions.includes(`${today}:${question.id}`);
      return <motion.article className={`daily-question-card ${done ? "done" : ""}`} key={question.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.08 }}><div className="daily-question-top"><span>التحدي {arabicNumber(index + 1)}</span><span className="xp-tag"><Zap size={13} />٥٠ نقطة</span></div><div className="daily-question-symbol">{done ? <CircleCheck size={34} /> : index === 0 ? <Sparkles size={34} /> : index === 1 ? <Route size={34} /> : <Trophy size={34} />}</div><span className="daily-question-type">{question.type === "text" ? "فكّ الشيفرة" : question.type === "boolean" ? "اختبر منطقك" : "اختر بذكاء"}</span><h3>{question.question}</h3><div className="daily-question-meta"><span className="difficulty-tag easy">{question.difficulty}</span><span><Clock3 size={13} />حوالي دقيقة</span></div><button className={`button ${done ? "button-completed" : "button-primary"}`} disabled={done} onClick={() => onDaily(question.id)}>{done ? <><Check size={17} />تم حلّ التحدي</> : <>اقبل التحدي<ArrowLeft size={17} /></>}</button></motion.article>;
    })}</div><div className="page-bottom-note"><Sparkles size={16} />التحديات اليومية مستقلة عن الفصول؛ يمكنك خوضها منذ اليوم الأول.</div>
  </div>;
}

function Countdown() {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => { const initial = setTimeout(() => setNow(Date.now()), 0); const timer = setInterval(() => setNow(Date.now()), 1000); return () => { clearTimeout(initial); clearInterval(timer); }; }, []);
  const seconds = now === null ? 0 : Math.max(0, Math.floor((Date.parse(`${utcDate(new Date(now + 86400000))}T00:00:00Z`) - now) / 1000));
  const time = [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map((part) => arabicNumber(part).padStart(2, "٠")).join(":");
  return <div className="countdown"><Clock3 size={15} /><span>تحدّيات جديدة بعد</span><strong dir="ltr">{now === null ? "—" : time}</strong></div>;
}
