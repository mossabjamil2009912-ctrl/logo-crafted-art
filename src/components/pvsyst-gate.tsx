import { useState } from "react";
import { Check, Clock, Copy, Gift, Hourglass, Wallet } from "lucide-react";
import { JEEB_NUMBER, STUDY_PRICE_USD, submitStudyPayment, type AccessStatus } from "@/lib/pvsyst-access";

function mmss(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

const box = "rounded-xl border border-border bg-muted/35 p-5 text-center";
const btn = "inline-flex w-full items-center justify-center gap-2 rounded-md bg-skyline px-6 py-3 text-sm font-bold text-skyline-foreground transition hover:opacity-90 disabled:opacity-50 sm:w-auto";

/** شاشة الانتظار: الدراسة قيد الإعداد وتصل كإشعار. */
export function StudyWaiting({ readyAt, previous, onBack }: { readyAt: number; previous?: boolean; onBack: () => void }) {
  return (
    <div className={box}>
      <Hourglass className="mx-auto size-10 text-brand" />
      <p className="mt-3 text-base font-black">{previous ? "لديك دراسة سابقة لم تصل بعد" : "جاري إعداد دراسة PVsyst لمنظومتك"}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        {previous ? "انتظر وصول دراستك الحالية، ثم يمكنك طلب دراسة جديدة." : "ستصلك الدراسة بعد 3 دقائق في الإشعارات بالشاشة الرئيسية."}
      </p>
      <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-lg font-black text-brand" dir="ltr">
        <Clock className="size-5" /> {mmss(readyAt - Date.now())}
      </p>
      <div className="mt-5"><button type="button" onClick={onBack} className={btn}>الرجوع لشاشة الدراسات</button></div>
    </div>
  );
}

/** تنبيه الدراسة الأولى المجانية. */
export function FreeStudyNote() {
  return (
    <p className="mb-3 flex items-center gap-2 rounded-lg border border-brand/40 bg-brand/10 px-3 py-2 text-xs font-bold text-foreground">
      <Gift className="size-4 shrink-0 text-brand" /> لديك دراسة واحدة مجانية — بعد إدخال البيانات تصلك الدراسة خلال 3 دقائق.
    </p>
  );
}

/** شاشة الدفع والاشتراك للدراسة الثانية فما بعد. */
export function StudyPayment({ status, customer, city }: { status: Extract<AccessStatus, { kind: "pay" } | { kind: "review" }>; customer: string; city: string }) {
  const [ref, setRef] = useState("");
  const [copied, setCopied] = useState(false);
  if (status.kind === "review") {
    return (
      <div className={box}>
        <Hourglass className="mx-auto size-10 text-brand" />
        <p className="mt-3 text-base font-black">طلبك قيد المراجعة</p>
        <p className="mt-2 text-sm text-muted-foreground">رقم المرجع: <span dir="ltr" className="font-black text-foreground">{status.ref}</span></p>
        <p className="mt-1 text-sm text-muted-foreground">بعد تأكيد الدفع تُفتح لك شاشة إدخال الأحمال مباشرة.</p>
      </div>
    );
  }
  const clean = ref.trim();
  const valid = /^[A-Za-z0-9-]{4,40}$/.test(clean);
  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (valid) submitStudyPayment(customer, city, clean); }}
      className="rounded-xl border border-border bg-muted/35 p-5"
    >
      <p className="flex items-center gap-2 text-base font-black"><Wallet className="size-5 text-brand" /> احصل على دراسة PVsyst لمنظومتك</p>
      <p className="mt-2 text-sm text-muted-foreground">استخدمت دراستك المجانية. سعر الدراسة {STUDY_PRICE_USD} دولار فقط لكل دراسة.</p>
      {status.rejected && <p className="mt-2 text-xs font-bold text-destructive">لم يتم تأكيد العملية السابقة، تأكد من رقم المرجع وأعد الإرسال.</p>}
      <div className="mt-4 rounded-lg border border-border bg-card p-4">
        <p className="text-xs font-bold text-muted-foreground">حوّل {STUDY_PRICE_USD}$ عبر محفظة جيب إلى الرقم:</p>
        <div className="mt-2 flex items-center justify-between gap-3">
          <span dir="ltr" className="text-xl font-black tracking-wider text-brand">{JEEB_NUMBER}</span>
          <button type="button" onClick={() => { void navigator.clipboard?.writeText(JEEB_NUMBER); setCopied(true); }} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-bold hover:border-brand">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "تم النسخ" : "نسخ الرقم"}
          </button>
        </div>
      </div>
      <label htmlFor="pv-ref" className="mt-4 block text-sm font-black">رقم مرجع العملية</label>
      <input id="pv-ref" value={ref} maxLength={40} onChange={(e) => setRef(e.target.value)} placeholder="ادخل رقم مرجع العملية هنا" dir="ltr" className="mt-2 w-full rounded-md border border-input bg-card px-3 py-2.5 text-sm outline-none focus:border-brand" />
      <button type="submit" disabled={!valid} className={`${btn} mt-4`}>إرسال</button>
    </form>
  );
}
