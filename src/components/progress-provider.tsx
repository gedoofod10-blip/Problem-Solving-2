"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type Dispatch, type SetStateAction } from "react";
import { MotionConfig } from "framer-motion";
import { EMPTY_PROGRESS, DEFAULT_SETTINGS, type AnswerResult, type ProgressData, type Settings } from "@/lib/types";
import { progressSchema, readLocal, settingsSchema, writeLocal } from "@/lib/progress";

const PROGRESS_KEY = "algorithmic-mind:progress:v1";
const SETTINGS_KEY = "algorithmic-mind:settings:v1";
type SyncStatus = "syncing" | "synced" | "offline";
interface ProgressContextValue {
  progress: ProgressData; ready: boolean; syncStatus: SyncStatus; settings: Settings;
  setSettings: Dispatch<SetStateAction<Settings>>;
  submitAnswer: (questionId: number, answer: string, mode?: "stage" | "daily") => Promise<AnswerResult>;
  updateProfile: (name: string) => Promise<void>;
  resetProgress: () => Promise<void>;
  refreshProgress: () => Promise<void>;
}
const ProgressContext = createContext<ProgressContextValue | null>(null);

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try { response = await fetch(url, { ...options, signal: AbortSignal.timeout(12000), headers: { "Content-Type": "application/json", ...options?.headers }, cache: "no-store" }); }
  catch { throw new Error("تعذّر الاتصال بالخادم. تحقّق من الإنترنت ثم حاول مرة أخرى."); }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "تعذّر إكمال الطلب. حاول مرة أخرى.");
  return data as T;
}

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressData>(EMPTY_PROGRESS);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [ready, setReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("syncing");
  const submitting = useRef(false);
  const revision = useRef(0);
  const refresh = useCallback(async (signal?: AbortSignal) => {
    const requestedRevision = revision.current;
    try {
      const response = await fetch("/api/progress", { signal: signal ?? AbortSignal.timeout(10000), cache: "no-store" });
      if (!response.ok) throw new Error("sync");
      const data = await response.json();
      const parsed = progressSchema.safeParse(data.progress);
      if (!parsed.success) throw new Error("cache");
      if (!signal?.aborted && requestedRevision === revision.current) { setProgress(parsed.data); setSyncStatus("synced"); }
    } catch { if (!signal?.aborted && requestedRevision === revision.current) setSyncStatus("offline"); }
  }, []);

  useEffect(() => {
    let active = true;
    // Read browser storage only after hydration, then batch the external-store snapshot.
    queueMicrotask(() => {
      if (!active) return;
      setProgress(readLocal(PROGRESS_KEY, progressSchema, EMPTY_PROGRESS));
      setSettings(readLocal(SETTINGS_KEY, settingsSchema, DEFAULT_SETTINGS));
      setReady(true);
      void refresh(controller.signal);
    });
    const controller = new AbortController();
    const online = () => void refresh();
    window.addEventListener("online", online);
    return () => { active = false; controller.abort(); window.removeEventListener("online", online); };
  }, [refresh]);

  useEffect(() => { if (ready) writeLocal(PROGRESS_KEY, progress); }, [progress, ready]);
  useEffect(() => { if (ready) writeLocal(SETTINGS_KEY, settings); }, [settings, ready]);

  const submitAnswer = useCallback(async (questionId: number, answer: string, mode: "stage" | "daily" = "stage") => {
    if (submitting.current) throw new Error("انتظر لحظة للتحقق من إجابتك الحالية.");
    submitting.current = true;
    try {
      const result = await request<AnswerResult>("/api/answer", { method: "POST", body: JSON.stringify({ questionId, answer, mode }) });
      const parsed = progressSchema.safeParse(result.progress);
      if (!parsed.success) throw new Error("تعذّر قراءة التقدّم المحدّث.");
      revision.current += 1;
      setProgress(parsed.data); writeLocal(PROGRESS_KEY, parsed.data); setSyncStatus("synced");
      return result;
    } catch (error) { setSyncStatus("offline"); throw error; }
    finally { submitting.current = false; }
  }, []);

  const updateProfile = useCallback(async (name: string) => {
    const data = await request<{ progress: ProgressData }>("/api/progress", { method: "PATCH", body: JSON.stringify({ name }) });
    revision.current += 1;
    setProgress(data.progress); setSettings((current) => ({ ...current, name })); setSyncStatus("synced");
  }, []);
  const resetProgress = useCallback(async () => {
    const data = await request<{ progress: ProgressData }>("/api/progress", { method: "DELETE" });
    revision.current += 1;
    setProgress(data.progress); writeLocal(PROGRESS_KEY, data.progress); setSyncStatus("synced");
  }, []);
  const refreshProgress = useCallback(() => refresh(), [refresh]);

  return <ProgressContext.Provider value={{ progress, ready, syncStatus, settings, setSettings, submitAnswer, updateProfile, resetProgress, refreshProgress }}>
    <MotionConfig reducedMotion={settings.reducedMotion ? "always" : "user"}>{children}</MotionConfig>
  </ProgressContext.Provider>;
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (!context) throw new Error("ProgressProvider is required");
  return context;
}
