"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Box, BrainCircuit, Check, CircleCheck, CircleHelp, Flag, Flame, GitBranch, Lightbulb, LockKeyhole, Repeat2, Route, Sparkles, Target, Layers3, Zap } from "lucide-react";
import { arabicNumber, chapters, getDailyQuestions, getNextStage, stages, utcDate } from "@/lib/curriculum";
import { useProgress } from "./progress-provider";
import { ProgressBar } from "./ui";

export const chapterIcons = { box: Box, branch: GitBranch, loop: Repeat2, array: Layers3 };
export interface LearningActions { onStage: (id: string) => void; onDaily: (id?: number) => void; onGuide: () => void }

export function Dashboard({ onStage, onDaily, onGuide }: LearningActions) {
  const { progress, ready } = useProgress();
  const [filter, setFilter] = useState<"all" | "active">("all");
  const next = getNextStage(progress);
  const daily = getDailyQuestions(ready ? utcDate() : "2026-01-01")[0];
  const accuracy = progress.totalAttempts ? Math.round(progress.correctAttempts / progress.totalAttempts * 100) : null;
  const visibleChapters = filter === "all" ? chapters : chapters.filter((chapter) => progress.unlockedStages.some((id) => id.startsWith(`${chapter.id}-`)));
  const stats = [
    { label: "مراحل مكتملة", value: arabicNumber(progress.completedStages.length), suffix: "/ ١٦", icon: Flag, color: "green", note: "خطوة وراء خطوة" },
    { label: "نقاط الخبرة", value: arabicNumber(progress.xp), suffix: "نقطة", icon: Sparkles, color: "gold", note: "كل إجابة تصنع فرقًا" },
    { label: "دقّة الإجابات", value: accuracy === null ? "—" : `${arabicNumber(accuracy)}٪`, suffix: "", icon: Target, color: "blue", note: accuracy === null ? "بانتظار إجابتك الأولى" : "من إجمالي محاولاتك" },
    { label: "أيام الالتزام", value: arabicNumber(progress.streak), suffix: progress.streak === 1 ? "يوم" : "أيام", icon: Flame, color: "coral", note: "استمرارك هو قوّتك" },
  ];
  return <div className="dashboard page-enter">
    <section className="welcome-row"><div><div className="eyebrow"><span className="status-dot" />عقلك يستحق تحدّيًا جديدًا</div><h1>أهلًا بك، أيها المستكشف <span className="wave-hand">✦</span></h1><p>لا تحتاج إلى خبرة برمجية. فقط فضولك، والاستعداد للتفكير.</p></div><button className="button button-quiet guide-button" onClick={onGuide}><CircleHelp size={17} />كيف تعمل المنصة؟</button></section>
    <section className="hero-panel">
      <div className="hero-art" aria-hidden="true"><Image src="/images/algorithm-core.png" alt="" fill priority sizes="(max-width: 700px) 90vw, 520px" /><div className="hero-art-shade" /></div>
      <div className="hero-content"><span className="hero-badge"><Sparkles size={13} />عقل جديد. احتمالات لا حدود لها.</span><h2>فكّر كمبرمج.<br /><span>ابدأ بخطوة واحدة.</span></h2><p>اكتشف عالم الخوارزميات من خلال تحديات ممتعة،<br className="desktop-break" /> وطوّر طريقة تفكير تصنع الفرق.</p><div className="hero-actions"><button className="button button-primary" onClick={() => onStage(next.id)}>{progress.completedQuestionIds.length ? "أكمل رحلتك" : "ابدأ رحلتك"}<ArrowLeft size={18} /></button><button className="button button-hero-secondary" onClick={() => onDaily()}><Zap size={17} />تحدٍ سريع</button></div><span className="hero-note"><CircleCheck size={13} />مجاني بالكامل · تعلّم على وتيرتك</span></div>
      <div className="hero-corner-label" aria-hidden="true"><span />العقل الخوارزمي</div>
    </section>
    <section className="stats-grid" aria-label="إحصاءات رحلتك">{stats.map((stat) => <div className={`stat-card accent-${stat.color}`} key={stat.label}><span className="stat-icon"><stat.icon size={22} strokeWidth={1.6} /></span><div className="stat-info"><span className="stat-label">{stat.label}</span><div className="stat-value">{stat.value} <small>{stat.suffix}</small></div><span className="stat-note">{stat.note}</span></div></div>)}</section>
    <section className="journey-section"><div className="section-heading"><div className="section-title"><Route size={21} /><h2>خريطة رحلتك</h2><span className="count-badge">٤ فصول · ١٦ مرحلة</span></div><Link href="/map" className="text-link">استعرض الخريطة<ArrowLeft size={16} /></Link></div>
      <div className="chapter-toolbar"><div className="filter-tabs" aria-label="تصفية الفصول"><button className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")} aria-pressed={filter === "all"}>كل الفصول</button><button className={filter === "active" ? "active" : ""} onClick={() => setFilter("active")} aria-pressed={filter === "active"}>قيد التعلّم<span>{arabicNumber(chapters.filter((chapter) => progress.unlockedStages.some((id) => id.startsWith(`${chapter.id}-`))).length)}</span></button></div><span className="journey-hint"><LockKeyhole size={13} />كل فصل تفتحه هو إنجاز جديد</span></div>
      <div className="chapter-grid">{visibleChapters.map((chapter, index) => <ChapterCard key={chapter.id} chapter={chapter} index={index} onStage={onStage} />)}</div>
    </section>
    <section className="dashboard-bottom"><div className="daily-banner"><div className="daily-banner-content"><span className="daily-eyebrow"><Zap size={15} />تحدّي اليوم<span className="xp-tag">+٥٠ نقطة خبرة</span></span><h2>قليل من التفكير، كثير من الاكتشاف.</h2><p>اختبر معلوماتك في تحدٍ قصير، وأضف إلى رصيدك.</p><button className="text-link gold-link" onClick={() => onDaily(daily.id)}>اقبل التحدّي<ArrowLeft size={17} /></button></div><div className="daily-code" dir="ltr" aria-hidden="true"><div className="code-dots"><i /><i /><i /></div><code>{daily.code && /^[\x00-\x7F]*$/.test(daily.code) ? daily.code : "if (curious) {\n  explore();\n  learn();\n}"}</code><Sparkles size={16} /></div></div>
      <div className="thought-card"><span className="thought-label"><Lightbulb size={17} />فكرة تستحق التفكير</span><h3>الخوارزمية ليست كودًا،<br />بل طريقة منظّمة لحل مشكلة.</h3><button className="text-link" onClick={onGuide}>غيّر طريقة تفكيرك<ArrowLeft size={16} /></button><BrainCircuit className="thought-art" size={105} strokeWidth={0.7} aria-hidden="true" /></div>
    </section>
    <div className="learning-footnote"><span><BrainCircuit size={15} />صُمّم لعقول المستقبل.</span><span>تعلّم بالتجربة، لا بالحفظ.</span></div>
  </div>;
}

export function ChapterCard({ chapter, index, onStage }: { chapter: typeof chapters[number]; index: number; onStage: (id: string) => void }) {
  const { progress } = useProgress();
  const Icon = chapterIcons[chapter.icon as keyof typeof chapterIcons];
  const chapterStages = stages.filter((stage) => stage.chapterId === chapter.id);
  const unlocked = chapterStages.some((stage) => progress.unlockedStages.includes(stage.id));
  const complete = chapterStages.filter((stage) => progress.completedStages.includes(stage.id)).length;
  const current = chapterStages.find((stage) => progress.unlockedStages.includes(stage.id) && !progress.completedStages.includes(stage.id)) ?? chapterStages[0];
  return <motion.article className={`chapter-card accent-${chapter.color} ${unlocked ? "unlocked" : "locked"} ${complete === 4 ? "completed" : ""}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, delay: index * 0.06 }}>
    <div className="chapter-card-heading"><span className="chapter-icon"><Icon size={25} strokeWidth={1.6} /></span><div><span className="chapter-kicker">الفصل {chapter.order}</span><h3>{chapter.title}</h3></div><span className={`chapter-status ${unlocked ? "available" : ""}`}>{complete === 4 ? <><Check size={12} />مكتمل</> : unlocked ? "متاح الآن" : <LockKeyhole size={14} />}</span></div>
    <p className="chapter-description">{chapter.description}</p>
    <div className="chapter-meta"><span><Flag size={13} />٤ مراحل</span><i /><span>١٢ سؤالًا</span><span className={`difficulty-tag ${chapter.id < 3 ? "easy" : "medium"}`}>{chapter.difficulty}</span></div>
    <div className="stage-nodes"><div className="stage-connector" />{chapterStages.map((stage) => {
      const done = progress.completedStages.includes(stage.id);
      const available = progress.unlockedStages.includes(stage.id);
      return <button key={stage.id} className={`stage-node ${done ? "done" : available ? "current" : "unavailable"}`} title={stage.title} aria-label={`${stage.title}${done ? "، مكتملة" : available ? "، متاحة" : "، مقفلة"}`} onClick={() => onStage(stage.id)}>{done ? <Check size={17} /> : available ? arabicNumber(stage.number) : <LockKeyhole size={13} />}</button>;
    })}</div>
    <div className="chapter-card-footer">{unlocked ? <><div className="chapter-progress"><span>{arabicNumber(complete)} من ٤ مراحل</span><ProgressBar value={complete / 4 * 100} label={`تقدّم الفصل ${chapter.order}`} /></div><button className="text-link" onClick={() => onStage(current.id)}>{complete === 4 ? "راجع الفصل" : complete > 0 ? "أكمل التعلّم" : "ابدأ الفصل"}<ArrowLeft size={16} /></button></> : <><span><LockKeyhole size={13} />أكمل الفصل {chapters[chapter.id - 2]?.order} لفتح هذا الفصل</span><button className="chapter-preview-button" onClick={() => onStage(chapterStages[0].id)} aria-label={`معرفة متطلبات فصل ${chapter.title}`}><ArrowLeft size={16} /></button></>}</div>
  </motion.article>;
}
