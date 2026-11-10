"use client";

import { BrainCircuit, RefreshCw } from "lucide-react";
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="error-page"><BrainCircuit size={52} strokeWidth={1.3} /><h1>لنأخذ نفسًا، ثم نحاول مجددًا.</h1><p>حدث خطأ غير متوقع. تقدّمك المحفوظ آمن؛ يمكنك إعادة تحميل هذه الصفحة.</p><button className="button button-primary" onClick={reset}><RefreshCw size={17} />إعادة المحاولة</button></main>;
}
