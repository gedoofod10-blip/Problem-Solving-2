"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Bell, BrainCircuit, ChevronLeft, CloudCheck, CloudOff, Flame, House, Medal, Menu, RefreshCw, Route, Settings2, ShieldCheck, Sparkles, Star, Trophy, X, Zap } from "lucide-react";
import { arabicNumber, chapters, getDailyQuestions, getNextStage, getRank, publicQuestions, stages, utcDate } from "@/lib/curriculum";
import { Dashboard } from "./dashboard";
import { Challenges, JourneyMap } from "./journey";
import { Achievements, Leaderboard } from "./achievements";
import { GuideDialog, PrivacyDialog, SettingsDialog } from "./dialogs";
import { Quiz, type QuizSession } from "./quiz";
import { useProgress } from "./progress-provider";
import { useToast } from "./ui";

export type View = "home" | "map" | "challenges" | "achievements" | "leaderboard";
const navigation = [
  { href: "/", view: "home", label: "الرئيسية", icon: House },
  { href: "/map", view: "map", label: "خريطة التعلّم", icon: Route },
  { href: "/challenges", view: "challenges", label: "التحديات اليومية", icon: Zap },
  { href: "/achievements", view: "achievements", label: "إنجازاتي", icon: Medal },
  { href: "/leaderboard", view: "leaderboard", label: "لوحة الشرف", icon: Trophy },
] as const;
const titles: Record<View, string> = { home: "الرئيسية", map: "خريطة التعلّم", challenges: "التحديات اليومية", achievements: "إنجازاتي", leaderboard: "لوحة الشرف" };

export function LearningApp({ view }: { view: View }) {
  const { progress, ready, syncStatus, refreshProgress } = useProgress();
  const notify = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dialog, setDialog] = useState<"guide" | "settings" | "privacy" | null>(null);
  const [quiz, setQuiz] = useState<QuizSession | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const rank = getRank(progress.xp);
  const next = getNextStage(progress);
  const today = ready ? utcDate() : "2026-01-01";
  const dailyDone = getDailyQuestions(today).filter((q) => progress.dailyCompletions.includes(`${today}:${q.id}`)).length;

  
  useEffect(() => {
    if (!notificationsOpen) return;
    const outside = (event: PointerEvent) => { if (!notificationRef.current?.contains(event.target as Node)) setNotificationsOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") setNotificationsOpen(false); };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [notificationsOpen]);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 901px)");
    const onResize = () => { if (desktop.matches) setMobileOpen(false); };
    desktop.addEventListener("change", onResize);
    return () => desktop.removeEventListener("change", onResize);
  }, []);
  useEffect(() => {
    if (!mobileOpen) return;
    const original = document.body.style.overflow;
    const previous = document.activeElement as HTMLElement | null;
    const sidebar = document.querySelector<HTMLElement>(".sidebar");
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => sidebar?.querySelector<HTMLElement>("a, button")?.focus(), 50);
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
      if (event.key !== "Tab") return;
      const items = Array.from(sidebar?.querySelectorAll<HTMLElement>("a[href], button:not([disabled])") ?? []);
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => { clearTimeout(timer); document.body.style.overflow = original; document.removeEventListener("keydown", onKey); previous?.focus(); };
  }, [mobileOpen]);

  function startStage(id: string) {
    const stage = stages.find((item) => item.id === id);
    if (!stage) return;
    if (!progress.unlockedStages.includes(id)) {
      const previous = stages[stages.indexOf(stage) - 1];
      notify(previous ? `أكمل مرحلة «${previous.title}» أولًا لفتح «${stage.title}». كل خطوة في وقتها.` : "أكمل مراحل الفصل السابق لفتح هذا الفصل.", "info");
      return;
    }
    const chapter = chapters.find((item) => item.id === stage.chapterId)!;
    setDialog(null); setMobileOpen(false); setNotificationsOpen(false);
    setQuiz({ questionIds: stage.questionIds.map(Number), title: stage.title, subtitle: `الفصل ${chapter.order} · ${chapter.shortTitle}`, mode: "stage" });
  }
  function startDaily(id?: number) {
    const available = getDailyQuestions(today).filter((q) => !progress.dailyCompletions.includes(`${today}:${q.id}`));
    const selected = id ? available.filter((q) => q.id === id) : available;
    if (!selected.length) { notify(id ? "أتممت هذا التحدي اليوم! عد غدًا لتحدٍ جديد." : "رائع! أتممت تحديات اليوم. انتظر تجديدها عند منتصف الليل.", "success"); return; }
    setDialog(null); setMobileOpen(false); setNotificationsOpen(false);
    setQuiz({ questionIds: selected.map((q) => q.id), title: "تحدّي اليوم", subtitle: "فضولك يستحق مكافأة", mode: "daily" });
  }
  const guide = () => { setMobileOpen(false); setDialog("guide"); };
  const settings = () => { setMobileOpen(false); setDialog("settings"); };

  return <div className="app-shell"><a className="skip-link" href="#main-content">انتقل إلى المحتوى</a>
    {mobileOpen && <button className="sidebar-scrim" aria-label="إغلاق قائمة التنقل" onClick={() => setMobileOpen(false)} />}
    <aside className={`sidebar ${mobileOpen ? "mobile-open" : ""}`} role={mobileOpen ? "dialog" : undefined} aria-modal={mobileOpen || undefined} aria-label="القائمة الرئيسية"><div className="sidebar-brand-row"><Link href="/" className="brand" onClick={() => setMobileOpen(false)}><span className="brand-mark"><BrainCircuit size={28} strokeWidth={1.6} /></span><span><strong>العقل الخوارزمي</strong><small>فكّر. تعلّم. تطوّر.</small></span></Link><button className="icon-button mobile-close" onClick={() => setMobileOpen(false)} aria-label="إغلاق القائمة"><X size={20} /></button></div>
      <span className="nav-section-label">مساحتك التعليمية</span><nav className="main-nav">{navigation.map((item) => <Link key={item.view} href={item.href} className={`nav-item ${view === item.view ? "active" : ""}`} aria-current={view === item.view ? "page" : undefined} onClick={() => setMobileOpen(false)}><item.icon size={20} strokeWidth={1.65} /><span>{item.label}</span>{item.view === "challenges" && <span className="nav-badge">{arabicNumber(3 - dailyDone)}</span>}{view === item.view && item.view !== "challenges" && <span className="nav-active-dot" />}</Link>)}</nav>
      <div className="sidebar-spacer" /><div className="sidebar-inspiration"><span className="inspiration-icon"><Sparkles size={21} strokeWidth={1.5} /></span><h3>عظيمٌ يبدأ صغيرًا.</h3><p>خوارزمية واحدة اليوم،<br />وطريقة تفكير مختلفة غدًا.</p><button className="text-link" onClick={guide}>اكتشف طريقة التعلّم<ArrowLeft size={14} /></button><span className="inspiration-decoration" aria-hidden="true">✦</span></div>
      <div className="sidebar-profile"><button className="profile-main" onClick={settings}><span className="profile-avatar">{progress.displayName.slice(0, 1)}</span><span><strong>{progress.displayName}</strong><small>المستوى {arabicNumber(rank.index + 1)} · {rank.name}</small></span></button><button className="icon-button" onClick={settings} aria-label="الإعدادات"><Settings2 size={18} /></button></div>
      <button className={`sync-indicator ${syncStatus === "offline" ? "offline" : ""}`} onClick={() => { void refreshProgress(); notify("جارٍ التحقق من حفظ تقدّمك ومزامنته."); }} title="التحقق من المزامنة">{syncStatus === "synced" ? <CloudCheck size={13} /> : syncStatus === "syncing" ? <RefreshCw size={12} className="spin" /> : <CloudOff size={13} />}<span>{syncStatus === "synced" ? "تقدّمك محفوظ بأمان" : syncStatus === "syncing" ? "جارٍ مزامنة تقدّمك" : "نسخة محلية · بانتظار الاتصال"}</span></button><button className="sidebar-privacy" onClick={() => { setMobileOpen(false); setDialog("privacy"); }}><ShieldCheck size={11} />خصوصيتك جزء من رحلتك</button>
    </aside>
    <div className="app-main"><header className="topbar"><div className="breadcrumb"><button className="icon-button mobile-menu" onClick={() => setMobileOpen(true)} aria-label="فتح قائمة التنقل" aria-expanded={mobileOpen}><Menu size={22} /></button><House size={16} className="breadcrumb-home" /><span className="breadcrumb-root">مساحة التعلّم</span><ChevronLeft size={13} className="breadcrumb-chevron" /><strong>{titles[view]}</strong></div><div className="top-stats"><div className="top-stat streak-stat" title="أيام التعلّم المتتالية"><Flame size={18} /><strong>{arabicNumber(progress.streak)}</strong><span>يوم التزام</span></div><div className="top-stat xp-stat" title="نقاط الخبرة"><Star size={17} /><strong>{arabicNumber(progress.xp)}</strong><span>نقطة خبرة</span></div><div className="top-stat rank-stat" title="رتبتك الحالية"><Trophy size={17} /><strong>{rank.name}</strong></div><div className="notification-wrap" ref={notificationRef}><button className={`icon-button notification-button ${notificationsOpen ? "selected" : ""}`} aria-label="الإشعارات" aria-expanded={notificationsOpen} onClick={() => { setNotificationsOpen((value) => !value); setNotificationsRead(true); }}><Bell size={19} />{!notificationsRead && <i />}</button>{notificationsOpen && <motion.div className="notification-panel" initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}><div className="notification-heading"><h3>مساحة فضولك</h3><button className="icon-button" onClick={() => setNotificationsOpen(false)} aria-label="إغلاق الإشعارات"><X size={16} /></button></div><div className="notification-item"><span className="stat-icon accent-green"><Sparkles size={19} /></span><div><h4>أهلًا بعقلك الفضولي!</h4><p>رحلتك تبدأ بسؤال. فصلك الأول جاهز للاستكشاف.</p><button className="text-link" onClick={() => startStage(next.id)}>ابدأ الآن<ArrowLeft size={13} /></button></div></div><div className="notification-item"><span className="stat-icon accent-gold"><Zap size={19} /></span><div><h4>{dailyDone === 3 ? "أتممت تحديات اليوم" : "تحدّيات اليوم بانتظارك"}</h4><p>{dailyDone === 3 ? "عد غدًا لتواصل سلسلة إنجازك." : `${arabicNumber(3 - dailyDone)} تحديات متاحة و٥٠ نقطة لكل تحدٍ.`}</p><Link href="/challenges" className="text-link gold-link" onClick={() => setNotificationsOpen(false)}>اذهب إلى التحديات<ArrowLeft size={13} /></Link></div></div></motion.div>}</div></div></header>
      <main className="content-container" id="main-content"><motion.div key={view} initial={{ opacity: 0, y: 7 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }}>
        {view === "home" && <Dashboard onStage={startStage} onDaily={startDaily} onGuide={guide} />}
        {view === "map" && <JourneyMap onStage={startStage} />}
        {view === "challenges" && <Challenges onDaily={startDaily} />}
        {view === "achievements" && <Achievements onStage={startStage} />}
        {view === "leaderboard" && <Leaderboard onDaily={() => startDaily()} onSettings={settings} />}
      </motion.div></main>
    </div>
    {dialog === "guide" && <GuideDialog onClose={() => setDialog(null)} onStart={startStage} />}
    {dialog === "settings" && <SettingsDialog onClose={() => setDialog(null)} />}
    {dialog === "privacy" && <PrivacyDialog onClose={() => setDialog(null)} />}
    {quiz && <Quiz key={`${quiz.mode}-${quiz.questionIds.join("-")}`} session={quiz} onClose={() => setQuiz(null)} onStage={startStage} />}
  </div>;
}
