import { useRef, useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { averageDays, parseLoadPdf, type LoadPdf } from "@/lib/load-pdf";

const r2 = (v: number) => String(Math.round(v * 100) / 100);
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);

/** رفع تقرير قياس الأحمال (PDF) وتعبئة خانات الـ 24 ساعة تلقائياً — يعمل داخل الجهاز بلا إنترنت. */
export function LoadPdfImport({ onApply }: { onApply: (values: string[], client: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [res, setRes] = useState<LoadPdf | null>(null);
  const [sel, setSel] = useState<boolean[]>([]);
  const [how, setHow] = useState<"avg" | "max">("avg");
  const [skipZero, setSkipZero] = useState(true);
  const [done, setDone] = useState(false);

  const read = async (f: File) => {
    setBusy(true); setErr(""); setRes(null); setDone(false);
    try {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
      const r = await parseLoadPdf(await f.arrayBuffer(), pdfjs);
      if (!r.days.length) throw new Error();
      setRes(r); setSel(r.days.map(() => true));
    } catch {
      setErr("تعذّرت قراءة الملف — تأكد أنه تقرير قياس أحمال يحتوي جدول 24 ساعة (وليس صورة ممسوحة).");
    } finally { setBusy(false); }
  };

  const chosen = res ? res.days.filter((_, i) => sel[i]) : [];
  const profile = !chosen.length ? [] : how === "avg"
    ? averageDays(chosen, skipZero)
    : chosen.reduce((a, b) => (sum(b.hours) > sum(a.hours) ? b : a)).hours;
  const total = sum(profile);
  const peak = profile.length ? Math.max(...profile) : 0;
  const dayKwh = sum(profile.slice(7, 17));

  return (
    <div className="mt-3 rounded-md border border-dashed border-brand/50 bg-background p-3">
      <input ref={ref} type="file" accept="application/pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) void read(f); e.target.value = ""; }} />
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => ref.current?.click()} disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-brand px-3 py-2 text-xs font-bold text-brand-foreground disabled:opacity-60">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <FileUp className="size-4" />}
          رفع تقرير قياس الأحمال (PDF)
        </button>
        <span className="text-[11px] text-muted-foreground">يقرأ الجدول ويحسب متوسط الأيام ويعبّئ الخانات تلقائياً</span>
      </div>
      {err && <p className="mt-2 text-xs font-bold text-destructive">{err}</p>}
      {res && (
        <div className="mt-3 space-y-3 text-xs">
          <p className="font-bold">{res.client && <>العميل: {res.client} — </>}تم العثور على {res.days.length} {res.days.length === 1 ? "يوم" : "أيام"} قياس</p>
          <div className="grid gap-1.5 sm:grid-cols-2">
            {res.days.map((d, i) => (
              <label key={i} className="flex cursor-pointer items-center justify-between gap-2 rounded border border-border px-2 py-1.5">
                <span className="flex items-center gap-2"><input type="checkbox" checked={!!sel[i]} onChange={(e) => setSel(sel.map((s, j) => (j === i ? e.target.checked : s)))} className="size-4 accent-primary" />{d.date}</span>
                <span className="tabular-nums text-muted-foreground">{Math.round(sum(d.hours)).toLocaleString("en-US")} kWh{d.hours.some((v) => v === 0) ? " • به توقف" : ""}</span>
              </label>
            ))}
          </div>
          {res.days.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {([["avg", "متوسط الأيام المختارة"], ["max", "اليوم الأعلى استهلاكاً"]] as const).map(([k, l]) => (
                <button key={k} type="button" onClick={() => setHow(k)} className={`rounded-md border px-3 py-1.5 font-bold ${how === k ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>{l}</button>
              ))}
              {how === "avg" && (
                <label className="flex items-center gap-1.5"><input type="checkbox" checked={skipZero} onChange={(e) => setSkipZero(e.target.checked)} className="size-4 accent-primary" />تجاهل ساعات التوقف (القيم الصفرية)</label>
              )}
            </div>
          )}
          {chosen.length > 0 && (
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded bg-muted p-2"><p className="text-muted-foreground">الإجمالي اليومي</p><p className="font-black tabular-nums">{Math.round(total).toLocaleString("en-US")} kWh</p></div>
              <div className="rounded bg-muted p-2"><p className="text-muted-foreground">أعلى حمل</p><p className="font-black tabular-nums">{Math.round(peak)} kW</p></div>
              <div className="rounded bg-muted p-2"><p className="text-muted-foreground">نهار / ليل</p><p className="font-black tabular-nums">{total ? Math.round((dayKwh / total) * 100) : 0}% / {total ? 100 - Math.round((dayKwh / total) * 100) : 0}%</p></div>
            </div>
          )}
          <button type="button" disabled={!chosen.length} onClick={() => { onApply(profile.map(r2), res.client); setDone(true); }} className="rounded-md bg-skyline px-4 py-2 font-bold text-skyline-foreground disabled:opacity-50">تعبئة الخانات بهذه القيم</button>
          {done && <span className="ms-2 font-bold text-primary">✓ تمت تعبئة الـ 24 خانة</span>}
        </div>
      )}
    </div>
  );
}
