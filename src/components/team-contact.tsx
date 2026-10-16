import { useEffect, useState } from "react";
import { Check, Copy, MessageCircle, Phone, X } from "lucide-react";

export const ADMIN_PHONE = "777350287";
const WA_URL = `https://wa.me/967${ADMIN_PHONE}?text=${encodeURIComponent("السلام عليكم، أرغب في الاستفسار عن خدمات عرش الهندسة للحلول التقنية الذكية.")}`;

export function openTeamContact() {
  window.dispatchEvent(new Event("arsh:team"));
}

/** بطاقة تواصل الإدارة: تظهر فور الضغط على «فريق عرش الهندسة». */
export function TeamContact() {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const on = () => { setCopied(false); setOpen(true); };
    window.addEventListener("arsh:team", on);
    return () => window.removeEventListener("arsh:team", on);
  }, []);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-overlay/60 p-4 backdrop-blur-[2px]" onClick={() => setOpen(false)}>
      <div dir="rtl" className="w-full max-w-sm rounded-2xl border border-brand/40 bg-card p-6 text-center shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => setOpen(false)} aria-label="إغلاق" className="float-left grid size-8 place-items-center rounded-full hover:bg-muted"><X className="size-4" /></button>
        <MessageCircle className="mx-auto size-11 text-brand" />
        <p className="mt-3 text-base font-black">إدارة عرش الهندسة للحلول التقنية الذكية</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">يسعدنا تواصلكم المباشر معنا عبر واتساب لطلب أي خدمة أو استشارة هندسية أو معاينة ميدانية.</p>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/40 px-4 py-3">
          <span dir="ltr" className="text-xl font-black tracking-wider text-brand">{ADMIN_PHONE}</span>
          <button type="button" onClick={() => { void navigator.clipboard?.writeText(ADMIN_PHONE); setCopied(true); }} className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs font-bold hover:border-brand">
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "تم النسخ" : "نسخ الرقم"}
          </button>
        </div>
        <a href={WA_URL} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-brand px-6 py-3 text-sm font-black text-brand-foreground transition hover:opacity-90">
          <MessageCircle className="size-4" /> تواصل عبر واتساب
        </a>
        <a href={`tel:+967${ADMIN_PHONE}`} className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-md border border-border px-6 py-2.5 text-sm font-bold hover:border-brand">
          <Phone className="size-4" /> اتصال مباشر
        </a>
      </div>
    </div>
  );
}
