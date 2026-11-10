"use client";

import { useState, type FormEvent } from "react";
import { ArrowLeft, BrainCircuit, Check, CloudCheck, Database, LoaderCircle, LockKeyhole, Map, RotateCcw, ShieldCheck, Sparkles, Trophy, Volume2, Waves } from "lucide-react";
import { getNextStage } from "@/lib/curriculum";
import { useProgress } from "./progress-provider";
import { Modal, useToast } from "./ui";

export function GuideDialog({ onClose, onStart }: { onClose: () => void; onStart: (id: string) => void }) {
  const { progress } = useProgress();
  const steps = [
    { icon: Map, title: "استكشف، ثم ابدأ", text: "ابدأ بفصل المتغيرات والذاكرة. أربع مراحل قصيرة في كل فصل، وكل مرحلة تفتح التي تليها.", color: "green" },
    { icon: BrainCircuit, title: "جرّب، وافهم المنطق", text: "اختر إجابة، قيّم صوابًا أو خطأً، أو اكتب حلّك. نشرح لك الفكرة بعد كل محاولة، لتتعلّم فعلًا لا تحفظ.", color: "purple" },
    { icon: Trophy, title: "اجمع النقاط، وافتح آفاقًا", text: "تكسب نقاط خبرة مرة واحدة عن كل سؤال. حافظ على سلسلة أيامك، واكتسب الأوسمة مع تقدّمك.", color: "gold" },
  ];
  return <Modal open onClose={onClose} title="دليل البداية" className="guide-modal"><div className="guide-intro"><span className="guide-brain"><BrainCircuit size={35} /></span><h3>لا تحتاج أن تكون مبرمجًا.<br />يكفي أن تكون فضوليًا.</h3><p>العقل الخوارزمي مساحة عربية لتعلّم التفكير المنطقي، خطوة بخطوة.</p></div><div className="guide-steps">{steps.map((step, index) => <div className={`guide-step accent-${step.color}`} key={step.title}><span className="stat-icon"><step.icon size={22} /></span><div><h4><span>٠{index + 1}</span>{step.title}</h4><p>{step.text}</p></div></div>)}</div><div className="privacy-inline"><ShieldCheck size={19} /><p>تعلّم كضيف. يُحفظ تقدّمك في هذا المتصفح وعلى الخادم، دون إنشاء حساب. مسح بيانات المتصفح قد يفقد جلسة الضيف.</p></div><button className="button button-primary w-full" onClick={() => { onClose(); onStart(getNextStage(progress).id); }}>فهمت، لنبدأ الرحلة<ArrowLeft size={18} /></button></Modal>;
}

export function SettingsDialog({ onClose }: { onClose: () => void }) {
  const { settings, setSettings, updateProfile, resetProgress, syncStatus } = useProgress();
  const notify = useToast();
  const [draft, setDraft] = useState(settings);
  const [busy, setBusy] = useState<"save" | "reset" | null>(null);
  const [error, setError] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  async function save(event: FormEvent) {
    event.preventDefault(); if (busy) return; setBusy("save"); setError("");
    try { await updateProfile(draft.name.trim()); setSettings({ ...draft, name: draft.name.trim() }); notify("حُفظت إعداداتك. رحلتك تشبهك أكثر الآن.", "success"); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "تعذّر حفظ الإعدادات."); }
    finally { setBusy(null); }
  }
  async function reset() {
    setBusy("reset"); setError("");
    try { await resetProgress(); notify("أُعيد تعيين التقدّم. صفحة جديدة ورحلة جديدة!", "success"); onClose(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "تعذّرت إعادة التعيين."); }
    finally { setBusy(null); }
  }
  return <Modal open onClose={onClose} title="مساحتك الشخصية" busy={!!busy} className="settings-modal"><form onSubmit={save}><div className="settings-profile"><span className="large-avatar">{draft.name.slice(0, 1) || "م"}</span><div><h3>مستكشف بطريقتك</h3><p>اسم مستعار يعبّر عنك في لوحة الشرف.</p></div></div><label className="field-label" htmlFor="display-name">الاسم المستعار</label><input className="text-input" id="display-name" value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} minLength={2} maxLength={40} required disabled={!!busy} placeholder="اختر اسمًا لرحلتك" /><span className="field-help">من حرفين إلى ٤٠ حرفًا. لا تستخدم اسمك الكامل حفاظًا على خصوصيتك.</span><div className="settings-options"><div className="setting-row"><span className="setting-icon"><Volume2 size={20} /></span><div><strong>صوت الإجابة الصحيحة</strong><p>نغمة قصيرة تحتفل بفهمك الصحيح.</p></div><button type="button" className={`toggle ${draft.sound ? "on" : ""}`} role="switch" aria-checked={draft.sound} aria-label="صوت الإجابة الصحيحة" onClick={() => setDraft({ ...draft, sound: !draft.sound })}><span /></button></div><div className="setting-row"><span className="setting-icon"><Waves size={20} /></span><div><strong>تقليل الحركة</strong><p>تجربة أكثر هدوءًا دون انتقالات متحركة.</p></div><button type="button" className={`toggle ${draft.reducedMotion ? "on" : ""}`} role="switch" aria-checked={draft.reducedMotion} aria-label="تقليل الحركة" onClick={() => setDraft({ ...draft, reducedMotion: !draft.reducedMotion })}><span /></button></div></div><div className="settings-sync"><CloudCheck size={17} /><span>{syncStatus === "synced" ? "تقدّمك محفوظ ومتزامن مع الخادم." : syncStatus === "syncing" ? "جارٍ مزامنة تقدّمك…" : "تقدّمك محفوظ محليًا. سنزامن عند عودة الاتصال."}</span></div>{error && <p className="inline-error" role="alert">{error}</p>}<button type="submit" className="button button-primary w-full" disabled={!!busy || draft.name.trim().length < 2}>{busy === "save" ? <LoaderCircle size={18} className="spin" /> : <Check size={18} />}حفظ الإعدادات</button></form><div className="reset-section">{confirmReset ? <div className="reset-confirm"><strong>هل تريد البداية من جديد؟</strong><p>ستُحذف نقاطك ومراحلك وإنجازاتك وسجل محاولاتك نهائيًا. لا يمكن التراجع عن هذه الخطوة.</p><div><button className="button button-danger" onClick={reset} disabled={!!busy}>{busy === "reset" ? <LoaderCircle size={16} className="spin" /> : <RotateCcw size={16} />}نعم، ابدأ من جديد</button><button className="button button-secondary" onClick={() => setConfirmReset(false)} disabled={!!busy}>احتفظ برحلتي</button></div></div> : <button className="reset-link" onClick={() => setConfirmReset(true)} disabled={!!busy}><RotateCcw size={15} />إعادة تعيين التقدّم</button>}</div></Modal>;
}

export function PrivacyDialog({ onClose }: { onClose: () => void }) {
  return <Modal open onClose={onClose} title="تعلّم آمن وخاص"><div className="privacy-content"><span className="guide-brain"><ShieldCheck size={35} /></span><h3>فضولك لك. وبياناتك أيضًا.</h3><p>لا نطلب حسابًا أو بريدًا إلكترونيًا أو اسمًا حقيقيًا. يمكنك استخدام اسم مستعار بالكامل.</p><div><Database size={21} /><section><h4>ما الذي نحفظه؟</h4><p>إجاباتك ونقاطك والمراحل المفتوحة واسمك المستعار. نستخدم ملف ارتباط ضروريًا لربط تقدّمك بجلسة الضيف، ونحتفظ بنسخة محلية آمنة في متصفحك.</p></section></div><div><LockKeyhole size={21} /><section><h4>من يستطيع رؤية تقدّمك؟</h4><p>أنت فقط. لوحة الشرف تعرض الاسم المستعار والنقاط وعدد المراحل للمستكشفين الذين جمعوا نقاطًا، ولا تعرض سجل إجاباتهم.</p></section></div><div><RotateCcw size={21} /><section><h4>لك البداية من جديد</h4><p>من الإعدادات، يمكنك حذف تقدّمك وسجل محاولاتك. مسح بيانات المتصفح يزيل الجلسة المحلية؛ احتفظ ببيانات هذا المتصفح للوصول إلى تقدّمك.</p></section></div><button className="button button-primary w-full" onClick={onClose}>واضح، شكرًا<Check size={17} /></button></div></Modal>;
}
