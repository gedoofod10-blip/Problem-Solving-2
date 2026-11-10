"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, BrainCircuit, Check, CircleCheck, CircleX, Clock3, Lightbulb, LoaderCircle, RotateCcw, Sparkles, Trophy, X, Zap } from "lucide-react";
import { arabicNumber, publicQuestions } from "@/lib/curriculum";
import type { AnswerResult } from "@/lib/types";
import { useProgress } from "./progress-provider";
import { Modal, ProgressBar, useToast } from "./ui";

export interface QuizSession { questionIds: number[]; title: string; subtitle: string; mode: "stage" | "daily" }

export function Quiz({ session, onClose, onStage }: { session: QuizSession; onClose: () => void; onStage: (id: string) => void }) {
  const { progress, submitAnswer, settings } = useProgress();
  const notify = useToast();
  const quizQuestions = session.questionIds.map((id) => publicQuestions.find((q) => q.id === id)).filter((q) => q !== undefined);
  const firstUnsolved = quizQuestions.findIndex((q) => !progress.completedQuestionIds.includes(String(q.id)) && (session.mode !== "daily" || !progress.dailyCompletions.some((key) => key.endsWith(`:${q.id}`))));
  const [index, setIndex] = useState(firstUnsolved < 0 ? 0 : firstUnsolved);
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<AnswerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [finished, setFinished] = useState(false);
  const [earnedXp, setEarnedXp] = useState(0);
  const [answered, setAnswered] = useState(0);
  const feedbackRef = useRef<HTMLDivElement>(null);
  const question = quizQuestions[index];
  const review = firstUnsolved < 0;

  useEffect(() => { if (result) feedbackRef.current?.focus(); }, [result]);
  if (!question) return null;

  async function checkAnswer(event: FormEvent) {
    event.preventDefault();
    if (!answer.trim() || loading || result) return;
    setLoading(true); setError("");
    try {
      const feedback = await submitAnswer(question.id, answer, session.mode);
      setResult(feedback); setEarnedXp((value) => value + feedback.xpAwarded); setAnswered((value) => value + 1);
      if (feedback.correct && settings.sound && typeof window !== "undefined" && "AudioContext" in window) {
        try {
          const audio = new AudioContext(); const oscillator = audio.createOscillator(); const gain = audio.createGain();
          oscillator.connect(gain); gain.connect(audio.destination); oscillator.frequency.value = 660;
          gain.gain.setValueAtTime(0.055, audio.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.22);
          oscillator.start(); oscillator.stop(audio.currentTime + 0.23); oscillator.onended = () => { void audio.close(); };
        } catch { /* Sound is optional; quiz feedback remains available. */ }
      }
    } catch (cause) { setError(cause instanceof Error ? cause.message : "تعذّر التحقق من إجابتك."); }
    finally { setLoading(false); }
  }

  function next() {
    if (index === quizQuestions.length - 1) { setFinished(true); return; }
    setIndex((value) => value + 1); setAnswer(""); setResult(null); setError("");
  }

  const typeLabel = question.type === "mcq" ? "اختر الإجابة الصحيحة" : question.type === "boolean" ? "صواب أم خطأ؟" : "اكتب إجابتك";
  return <Modal open onClose={onClose} title={session.title} className="quiz-modal" busy={loading}>
    {finished ? <motion.div className="quiz-summary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="celebration-icon"><Trophy size={46} strokeWidth={1.5} /><Sparkles className="celebration-spark" size={23} /></div>
      <span className="eyebrow">خطوة أخرى إلى الأمام</span>
      <h3>{session.mode === "daily" ? "أتممت تحدّي اليوم!" : "أتممت هذه المرحلة!"}</h3>
      <p>كل سؤال حلّلته أضاف طريقة جديدة للتفكير. استمر، فالرحلة تستحق.</p>
      <div className="summary-numbers"><div><Zap size={21} /><strong>+{arabicNumber(earnedXp)}</strong><span>نقطة خبرة مكتسبة</span></div><div><CircleCheck size={21} /><strong>{arabicNumber(answered)}</strong><span>إجابات صحيحة</span></div></div>
      {earnedXp === 0 && <p className="muted text-sm">هذه مراجعة رائعة! تُمنح نقاط كل سؤال مرة واحدة فقط.</p>}
      <button className="button button-primary" onClick={onClose}>العودة إلى رحلتي <ArrowLeft size={18} /></button>
      <button className="text-button" onClick={() => { if (session.mode === "stage" && !(question.chapterId === 4 && question.stage === 4)) onStage(`${question.chapterId}-${question.stage + 1}`); else onClose(); }}>{session.mode === "stage" && !(question.chapterId === 4 && question.stage === 4) ? "اكتشف المرحلة التالية" : "اكتشف رحلتك"} <ArrowLeft size={15} /></button>
    </motion.div> : <>
      <div className="quiz-meta"><span><BrainCircuit size={16} />{session.subtitle}</span><span className="quiz-counter">السؤال {arabicNumber(index + 1)} <span>من {arabicNumber(quizQuestions.length)}</span></span></div>
      <ProgressBar value={((index + (result?.correct ? 1 : 0)) / quizQuestions.length) * 100} label="تقدّم الاختبار" />
      <form onSubmit={checkAnswer} className="quiz-body">
        <div className="question-tags"><span className={`difficulty-tag ${question.difficulty === "سهل" ? "easy" : "medium"}`}>{question.difficulty}</span><span><Clock3 size={13} />حوالي دقيقة</span><span className="question-xp"><Zap size={14} />{arabicNumber(question.xp)} نقطة</span></div>
        {review && <div className="review-note"><RotateCcw size={14} />وضع المراجعة · نقاط هذه الأسئلة مكتسبة بالفعل</div>}
        <AnimatePresence mode="wait"><motion.div key={question.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.16 }}>
          <span className="question-type">{typeLabel}</span><h3 className="question-title">{question.question}</h3>
          {question.code && <pre className="question-code" dir="ltr"><code>{question.code}</code></pre>}
          {question.type === "text" ? <div className="short-answer"><label htmlFor="quiz-answer">إجابتك</label><input id="quiz-answer" value={answer} onChange={(event) => setAnswer(event.target.value)} maxLength={120} disabled={loading || !!result} placeholder="اكتب إجابتك هنا…" autoComplete="off" dir="auto" inputMode={question.question.includes("رقم") ? "numeric" : "text"} /><span>لا تقلق من شكل الأرقام؛ نقبل الأرقام العربية والإنجليزية.</span></div> : <div className={`answer-options ${question.type === "boolean" ? "binary-options" : ""}`} role="radiogroup" aria-label={typeLabel}>
            {question.options.map((option, optionIndex) => {
              const value = question.type === "boolean" ? (optionIndex === 0 ? "true" : "false") : option;
              const selected = answer === value;
              const stateClass = result && selected ? (result.correct ? "correct" : "incorrect") : "";
              return <label key={option} className={`answer-option ${selected ? "selected" : ""} ${stateClass} ${result ? "answered" : ""}`}>
                <input className="sr-only" type="radio" name={`answer-${question.id}`} value={value} checked={selected} onChange={() => setAnswer(value)} disabled={loading || !!result} />
                <span className="option-letter">{question.type === "boolean" ? (optionIndex === 0 ? <Check size={20} /> : <X size={20} />) : ["أ", "ب", "ج", "د"][optionIndex]}</span><span>{option}</span><span className="option-indicator">{selected && (result ? (result.correct ? <CircleCheck size={18} /> : <CircleX size={18} />) : <Check size={16} />)}</span>
              </label>;
            })}
          </div>}
        </motion.div></AnimatePresence>
        {error && <div className="inline-error" role="alert"><CircleX size={19} /><p>{error}</p></div>}
        {result && <motion.div ref={feedbackRef} tabIndex={-1} className={`answer-feedback ${result.correct ? "success" : "error"}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} role="status">
          <div className="feedback-heading">{result.correct ? <CircleCheck size={23} /> : <Lightbulb size={23} />}<h4>{result.correct ? "أحسنت! تفكيرك في المكان الصحيح." : "محاولة جيدة، لنتعلّم منها."}</h4>{result.xpAwarded > 0 && <span>+{arabicNumber(result.xpAwarded)} نقطة</span>}</div>
          {!result.correct && <strong className="correct-answer">الإجابة الصحيحة: {result.correctAnswer}</strong>}
          <p>{result.explanation}</p>
        </motion.div>}
        <div className="quiz-actions"><span><Lightbulb size={15} />خذ وقتك، الفهم أهم من السرعة.</span>
          {result ? result.correct ? <button type="button" className="button button-primary" onClick={next}>{index === quizQuestions.length - 1 ? "إنهاء المرحلة" : "السؤال التالي"}<ArrowLeft size={18} /></button> : <button type="button" className="button button-primary" onClick={() => { setResult(null); setAnswer(""); setError(""); }}><RotateCcw size={17} />حاول مرة أخرى</button> : <button type="submit" className="button button-primary" disabled={!answer.trim() || loading}>{loading ? <><LoaderCircle size={18} className="spin" />جارٍ التحقق…</> : <>تحقّق من الإجابة<ArrowLeft size={18} /></>}</button>}
        </div>
      </form>
    </>}
  </Modal>;
}
