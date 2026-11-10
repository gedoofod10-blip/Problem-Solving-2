import Link from "next/link";
import { ArrowLeft, BrainCircuit, Route } from "lucide-react";
export default function NotFoundPage() {
  return <main className="error-page"><BrainCircuit size={54} strokeWidth={1.3} /><span className="eyebrow">الصفحة غير موجودة · ٤٠٤</span><h1>يبدو أن هذه الخطوة خارج الخريطة.</h1><p>لا بأس، كل المستكشفين يغيّرون مسارهم أحيانًا. عد إلى رحلتك وأكمل من حيث توقفت.</p><div><Link href="/" className="button button-primary">العودة للرئيسية<ArrowLeft size={17} /></Link><Link href="/map" className="button button-secondary"><Route size={17} />خريطة التعلّم</Link></div></main>;
}
