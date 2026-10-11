import { BadgeCheck, FileText, Download, ShieldCheck, Wrench, ClipboardCheck, Headphones, Sun, Cpu, BatteryCharging, Home } from "lucide-react";
import actesLogo from "@/assets/actes-logo-full.webp";
import { PRODUCTS } from "@/lib/products-data";

type BrandKey = "suntech" | "pylontech" | "hithium" | "lipower";

const CFG: Record<BrandKey, {
  name: string; match: (b: string) => boolean; logo: string;
  metrics: { v: string; l: string }[];
  chart: { title: string; note: string; y: string; pts: [number, number][]; xLabel: string; yMin: number; yMax: number; xMax: number; ref?: [number, number][] };
}> = {
  suntech: {
    name: "Suntech", match: (b) => b === "Suntech", logo: "/brand/makers/suntech.png",
    metrics: [{ v: "2001", l: "سنة التأسيس" }, { v: "N-Type", l: "تقنية TOPCon" }, { v: "30", l: "سنة ضمان أداء" }, { v: "1500V", l: "جهد النظام" }],
    chart: { title: "منحنى ضمان الأداء الخطي", note: "قدرة اللوح المضمونة عبر 30 سنة مقارنة بلوح P-Type تقليدي (حسب نشرة المواصفات).", y: "% من القدرة", xLabel: "السنة", xMax: 30, yMin: 75, yMax: 100,
      pts: Array.from({ length: 31 }, (_, i) => [i, i === 0 ? 100 : 99 - 0.4 * (i - 1)] as [number, number]),
      ref: Array.from({ length: 26 }, (_, i) => [i, i === 0 ? 100 : 98 - 0.55 * (i - 1)] as [number, number]) },
  },
  pylontech: {
    name: "Pylontech", match: (b) => b === "Pylontech", logo: "/brand/makers/pylontech.png",
    metrics: [{ v: "2009", l: "سنة التأسيس" }, { v: "LiFePO4", l: "كيمياء آمنة" }, { v: "BMS", l: "إدارة ذكية" }, { v: "معياري", l: "توسعة مرنة" }],
    chart: { title: "عمر الدورات مقابل عمق التفريغ", note: "منحنى توضيحي لاحتفاظ بطارية LiFePO4 بسعتها مع زيادة عدد الدورات.", y: "% من السعة", xLabel: "الدورات (×1000)", xMax: 8, yMin: 60, yMax: 100,
      pts: Array.from({ length: 9 }, (_, i) => [i, 100 - i * 3.6] as [number, number]) },
  },
  hithium: {
    name: "HiTHIUM", match: (b) => b.startsWith("HiTHIUM"), logo: "/brand/makers/hithium.png",
    metrics: [{ v: "LFP", l: "خلايا تخزين" }, { v: "C&I", l: "تجاري وصناعي" }, { v: "IP55", l: "حماية خارجية" }, { v: "حماية", l: "إطفاء حراري" }],
    chart: { title: "احتفاظ الخلايا بالسعة", note: "منحنى توضيحي لأداء خلايا LFP المخصصة للتخزين طويل العمر.", y: "% من السعة", xLabel: "الدورات (×1000)", xMax: 10, yMin: 60, yMax: 100,
      pts: Array.from({ length: 11 }, (_, i) => [i, 100 - i * 2.8] as [number, number]) },
  },
  lipower: {
    name: "Li-Power", match: (b) => b === "Li-Power", logo: "/brand/makers/lipower.png",
    metrics: [{ v: "MPPT", l: "شحن شمسي" }, { v: "نقية", l: "موجة جيبية" }, { v: "Wi-Fi", l: "مراقبة" }, { v: "BMS", l: "دعم الليثيوم" }],
    chart: { title: "كفاءة التحويل مقابل الحمل", note: "منحنى توضيحي لكفاءة الإنفرتر عند نسب تحميل مختلفة.", y: "% كفاءة", xLabel: "نسبة الحمل %", xMax: 100, yMin: 80, yMax: 100,
      pts: [[5, 85], [10, 90], [20, 93.5], [30, 94.5], [50, 95], [75, 94.6], [100, 93.8]] },
  },
};

const BENEFITS = [
  { icon: ShieldCheck, t: "ضمان مصنعي معتمد", d: "ضمان رسمي يُفعَّل محلياً عبر الوكيل." },
  { icon: Wrench, t: "صيانة وقطع أصلية", d: "مركز خدمة وقطع غيار من المصنع مباشرة." },
  { icon: ClipboardCheck, t: "فحص هندسي", d: "اختبار المنتج قبل التسليم والتركيب." },
  { icon: Headphones, t: "دعم فني مباشر", d: "فريق مهندسين للمتابعة والتشغيل." },
];

function Chart({ c }: { c: (typeof CFG)[BrandKey]["chart"] }) {
  const W = 560, H = 240, P = 36;
  const x = (v: number) => P + (v / c.xMax) * (W - P * 2);
  const y = (v: number) => H - P - ((v - c.yMin) / (c.yMax - c.yMin)) * (H - P * 2);
  const path = (pts: [number, number][]) => pts.map(([a, b], i) => `${i ? "L" : "M"}${x(a)},${y(b)}`).join(" ");
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => c.yMin + f * (c.yMax - c.yMin));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" direction="ltr">
      {ticks.map((t) => (
        <g key={t}><line x1={P} x2={W - P} y1={y(t)} y2={y(t)} className="stroke-border" strokeDasharray="3 4" />
          <text x={P - 6} y={y(t) + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">{Math.round(t)}</text></g>
      ))}
      {c.ref && <path d={path(c.ref)} fill="none" className="stroke-muted-foreground" strokeWidth={2} strokeDasharray="6 5" />}
      <path d={`${path(c.pts)} L${x(c.pts[c.pts.length - 1]![0])},${H - P} L${x(c.pts[0]![0])},${H - P} Z`} className="fill-primary/10" />
      <path d={path(c.pts)} fill="none" className="stroke-primary" strokeWidth={3} />
      <text x={W / 2} y={H - 6} textAnchor="middle" className="fill-muted-foreground text-[11px]">{c.xLabel}</text>
    </svg>
  );
}

export function AgencyBadge({ brand }: { brand: BrandKey }) {
  return (
    <div className="border-b border-border bg-card">
      <div dir="rtl" className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm">
        <BadgeCheck className="h-4 w-4 text-primary" />
        <span className="font-semibold">الوكيل المعتمد لـ {CFG[brand].name} في الجمهورية اليمنية</span>
        <span className="text-muted-foreground">— ACTES لحلول أنظمة الطاقة</span>
      </div>
    </div>
  );
}

export function AgencyShowcase({ brand }: { brand: BrandKey }) {
  const c = CFG[brand];
  const files = PRODUCTS.filter((p) => c.match(p.brand)).flatMap((p) => p.files.map((f) => ({ ...f, product: p.name })));
  const seen = new Set<string>();
  const docs = files.filter((f) => (seen.has(f.url) ? false : (seen.add(f.url), true)));
  const flow = [
    { icon: Sun, t: "ألواح Suntech", on: brand === "suntech" },
    { icon: Cpu, t: brand === "lipower" ? "إنفرتر Li-Power" : "إنفرتر هجين", on: brand === "lipower" },
    { icon: BatteryCharging, t: brand === "hithium" ? "تخزين HiTHIUM" : "بطاريات Pylontech", on: brand === "pylontech" || brand === "hithium" },
    { icon: Home, t: "الأحمال", on: false },
  ];
  return (
    <div dir="rtl" className="bg-background text-foreground">
      {/* الإحصائيات */}
      <section className="mx-auto max-w-6xl px-4 pt-12">
        <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-border bg-card shadow-sm sm:grid-cols-4">
          {c.metrics.map((m) => (
            <div key={m.l} className="border-border p-5 text-center even:border-r sm:border-r sm:first:border-r-0">
              <div className="text-2xl font-bold text-primary sm:text-3xl" dir="ltr">{m.v}</div>
              <div className="mt-1 text-xs text-muted-foreground sm:text-sm">{m.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* الوكالة المعتمدة */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-card to-muted p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-4">
            <img src={actesLogo} alt="ACTES" className="h-10 w-auto" />
            <span className="h-8 w-px bg-border" />
            <img src={c.logo} alt={c.name} className="h-8 w-auto" />
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><BadgeCheck className="h-3.5 w-3.5" /> وكيل معتمد</span>
          </div>
          <h2 className="mt-6 text-2xl font-bold sm:text-3xl">لماذا تشتري من الوكيل المعتمد؟</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {BENEFITS.map(({ icon: I, t, d }) => (
              <div key={t} className="rounded-2xl border border-border bg-card p-5">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><I className="h-5 w-5" /></span>
                <h3 className="mt-4 font-semibold">{t}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* المخططات */}
      <section className="mx-auto grid max-w-6xl gap-6 px-4 pb-12 lg:grid-cols-5">
        <div className="rounded-3xl border border-border bg-card p-6 lg:col-span-3">
          <h2 className="text-xl font-bold">{c.chart.title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{c.chart.note}</p>
          <div className="mt-4"><Chart c={c.chart} /></div>
          {c.chart.ref && <div className="mt-2 flex gap-4 text-xs text-muted-foreground"><span className="flex items-center gap-1"><i className="h-0.5 w-5 bg-primary" /> {c.name}</span><span className="flex items-center gap-1"><i className="h-0.5 w-5 border-t-2 border-dashed border-muted-foreground" /> لوح تقليدي</span></div>}
        </div>
        <div className="rounded-3xl border border-border bg-card p-6 lg:col-span-2">
          <h2 className="text-xl font-bold">تكامل المنظومة</h2>
          <p className="mt-1 text-sm text-muted-foreground">موقع منتجات {c.name} داخل منظومة ACTES المتكاملة.</p>
          <ol className="mt-5 space-y-2">
            {flow.map(({ icon: I, t, on }, i) => (
              <li key={t}>
                <div className={`flex items-center gap-3 rounded-xl border p-3 ${on ? "border-primary bg-primary/10" : "border-border"}`}>
                  <span className={`grid h-9 w-9 place-items-center rounded-lg ${on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}><I className="h-4 w-4" /></span>
                  <span className={on ? "font-semibold" : ""}>{t}</span>
                </div>
                {i < flow.length - 1 && <div className="mr-7 h-3 w-px bg-border" />}
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* مركز الوثائق */}
      {docs.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-14">
          <h2 className="text-2xl font-bold">مركز الوثائق والاعتمادات</h2>
          <p className="mt-1 text-sm text-muted-foreground">الكتالوجات ونشرات المواصفات والشهادات الرسمية.</p>
          <div className="mt-5 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
            {docs.map((f) => (
              <a key={f.url} href={f.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4 hover:bg-muted">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span>
                <span className="min-w-0 flex-1"><span className="block font-medium">{f.label}</span><span className="block text-xs text-muted-foreground">{f.product} · {f.kind}</span></span>
                <Download className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
