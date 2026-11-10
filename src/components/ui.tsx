"use client";

import { createContext, useCallback, useContext, useEffect, useId, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, CircleAlert, Info, X } from "lucide-react";

function subscribeToClient() { return () => {}; }
function clientSnapshot() { return true; }
function serverSnapshot() { return false; }
function useClientMounted() { return useSyncExternalStore(subscribeToClient, clientSnapshot, serverSnapshot); }

type ToastKind = "success" | "error" | "info";
interface ToastItem { id: number; message: string; kind: ToastKind }
const ToastContext = createContext<(message: string, kind?: ToastKind) => void>(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const mounted = useClientMounted();
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nextId = useRef(0);
  const notify = useCallback((message: string, kind: ToastKind = "info") => {
    const id = ++nextId.current;
    setToasts((items) => [...items.slice(-2), { id, message, kind }]);
    timers.current.push(setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 5200));
  }, []);
  useEffect(() => { const activeTimers = timers.current; return () => activeTimers.forEach(clearTimeout); }, []);
  return <ToastContext.Provider value={notify}>
    {children}
    {mounted && createPortal(<div className="toast-stack" aria-live="polite" aria-atomic="false">
      <AnimatePresence>{toasts.map((toast) => <motion.div key={toast.id} className={`toast toast-${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }}>
        <span className="toast-symbol">{toast.kind === "success" ? <Check size={19} /> : toast.kind === "error" ? <CircleAlert size={19} /> : <Info size={19} />}</span>
        <p>{toast.message}</p><button className="icon-button" onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))} aria-label="إغلاق التنبيه"><X size={16} /></button>
      </motion.div>)}</AnimatePresence>
    </div>, document.body)}
  </ToastContext.Provider>;
}

export function Modal({ open, onClose, title, children, className = "", busy = false }: { open: boolean; onClose: () => void; title: string; children: ReactNode; className?: string; busy?: boolean }) {
  const mounted = useClientMounted();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  const titleId = useId();
  useEffect(() => { closeRef.current = onClose; busyRef.current = busy; }, [onClose, busy]);
  useEffect(() => {
    if (!open || !mounted) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = setTimeout(() => dialogRef.current?.focus(), 30);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !busyRef.current) closeRef.current();
      if (event.key !== "Tab") return;
      const items = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select, textarea, [tabindex="0"]') ?? []).filter((item) => item.offsetParent !== null);
      if (!items.length) { event.preventDefault(); return; }
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialogRef.current)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => { clearTimeout(timer); document.body.style.overflow = overflow; document.removeEventListener("keydown", onKeyDown); previous?.focus(); };
  }, [open, mounted]);
  if (!mounted) return null;
  return createPortal(<AnimatePresence>{open && <motion.div className="modal-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose(); }}>
    <motion.div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} dir="rtl" className={`modal ${className}`} initial={{ opacity: 0, y: 20, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }} transition={{ duration: 0.22 }}>
      <div className="modal-header"><h2 id={titleId}>{title}</h2><button className="icon-button" onClick={onClose} disabled={busy} aria-label="إغلاق النافذة"><X size={21} /></button></div>
      {children}
    </motion.div>
  </motion.div>}</AnimatePresence>, document.body);
}

export function ProgressBar({ value, className = "", label }: { value: number; className?: string; label: string }) {
  return <div className={`progress-track ${className}`} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={100} aria-label={label}><motion.span initial={false} animate={{ width: `${Math.min(100, Math.max(0, value))}%` }} transition={{ duration: 0.6 }} /></div>;
}
