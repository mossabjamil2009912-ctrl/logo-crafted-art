import { AgencyBadge, AgencyShowcase } from "@/components/agency-showcase";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, BatteryCharging, FileText, Flame, Gauge, Layers, ShieldCheck, Thermometer } from "lucide-react";
import actesLogo from "@/assets/actes-logo-full.webp";
import { PRODUCTS, type Product } from "@/lib/products-data";
import { BrandProductDetail } from "@/components/brand-product-detail";
import { useResolvedVideoSrc } from "@/lib/video-source";

export const Route = createFileRoute("/hithium")({
  head: () => ({
    meta: [
      { title: "HiTHIUM — أنظمة تخزين الطاقة بالبطاريات | ACTES" },
      { name: "description", content: "HiTHIUM HeroEE: بطاريات منزلية وخزانات تخزين تجارية وصناعية بخلايا 314Ah وعمر 11000 دورة — المواصفات والكتالوجات لدى ACTES." },
      { property: "og:title", content: "HiTHIUM — تخزين طاقة آمن وطويل العمر" },
      { property: "og:description", content: "حلول HiTHIUM لتخزين الطاقة للمنازل والقطاع التجاري والصناعي، بالعربية عبر ACTES." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HithiumPage,
});

const TECH = [
  { icon: BatteryCharging, t: "خلايا 314Ah", d: "خلايا LiFePO4 من تصنيع HiTHIUM نفسها." },
  { icon: Gauge, t: "11,000 دورة", d: "أكثر من 15 عاماً من التشغيل اليومي." },
  { icon: Thermometer, t: "إدارة حرارية ذكية", d: "تحكم بالتبريد يحافظ على استقرار الخلايا." },
  { icon: Flame, t: "إطفاء مدمج", d: "مراقبة الحرارة والدخان ونظام إطفاء إيروسول." },
  { icon: ShieldCheck, t: "Smart BMS", d: "حمايات شاملة ومراقبة مستمرة لحالة النظام." },
  { icon: Layers, t: "توسعة معيارية", d: "تكديس وتوازي الوحدات حسب حاجة المشروع." },
];

const NAV = [
  { label: "الابتكارات", items: [["الخلايا Cell", "#tech"], ["السلامة والتقنيات", "#tech"]] },
  { label: "المنتجات", items: [["الخلايا Cell", "#tech"], ["الوحدات Module", "#products"], ["أنظمة المرافق Utility System", "#products"], ["الأنظمة التجارية C&I System", "#products"], ["الأنظمة السكنية Residential System", "#products"]] },
  { label: "الدعم", items: [["التنزيلات Download", "#downloads"], ["الموقع الرسمي", "https://www.hithium.com"]] },
] as const;

function HiNav() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <nav className="hidden h-full items-stretch gap-1 text-sm md:flex" onMouseLeave={() => setOpen(null)}>
      {NAV.map((n, i) => (
        <div key={n.label} className="relative" onMouseEnter={() => setOpen(i)}>
          <button onClick={() => setOpen(open === i ? null : i)} className={`border-r-2 px-3 py-1 ${open === i ? "border-primary text-primary" : "border-transparent hover:text-primary"}`}>{n.label}</button>
          {open === i && (
            <div className="absolute right-0 top-full z-20 mt-3 min-w-[230px] rounded-lg bg-background py-2 shadow-xl ring-1 ring-border">
              {n.items.map(([t, h]) => (
                <a key={t} href={h} {...(h.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})} onClick={() => setOpen(null)} className="block px-5 py-3 text-sm hover:text-primary">{t}</a>
              ))}
            </div>
          )}
        </div>
      ))}
    </nav>
  );
}

function HithiumPage() {
  const items = PRODUCTS.filter((p) => /hithium/i.test(p.brand));
  const [sel, setSel] = useState<Product | null>(null);
  const video = useResolvedVideoSrc("/videos/hithium-heroee-maxpower-16.mp4");
  const files = items.flatMap((p) => p.files.map((f) => ({ ...f, name: p.model || p.name, ar: f.url.replace("/catalogs/", "/catalogs/official-ar/") })));
  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground">
      <AgencyBadge brand="hithium" />
      <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3"><img src={actesLogo} alt="ACTES" className="h-9 w-auto" /><span className="h-7 w-px bg-border" /><img src="/brand/makers/hithium.png" alt="HiTHIUM" className="h-6 w-auto" /></div>
          <HiNav />
          <Link to="/" className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-1.5 text-sm hover:bg-muted"><ArrowRight className="h-4 w-4" /> الرئيسية</Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-muted">
        {video && <video src={video} poster="/media/hithium-legend-112s.jpg" autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover opacity-40" />}
        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <img src="/brand/makers/hithium.png" alt="HiTHIUM" className="mx-auto h-14 w-auto sm:h-20" />
          <h1 className="mt-6 text-3xl font-bold sm:text-5xl">تخزين طاقة آمن وطويل العمر</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground sm:text-lg">من البطارية المنزلية إلى خزانات المصانع — حلول HiTHIUM HeroEE بخلايا 314Ah وعمر 11,000 دورة.</p>
          <div className="mx-auto mt-8 grid max-w-xl grid-cols-3 gap-3">
            {[["314Ah", "سعة الخلية"], ["11,000", "دورة"], ["IP55", "حماية الخزائن"]].map(([v, l]) => (
              <div key={l} className="rounded-xl border border-border bg-card/80 p-3"><div className="text-xl font-bold text-primary">{v}</div><div className="text-xs text-muted-foreground">{l}</div></div>
            ))}
          </div>
        </div>
      </section>

      <section id="products" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">المنتجات</h2>
        <div className="space-y-6">{items.map((p) => <ProductBlock key={p.id} p={p} onOpen={() => setSel(p)} />)}</div>
      </section>

      <section id="tech" className="scroll-mt-20 bg-muted/50 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">التقنيات الأساسية</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            {TECH.map(({ icon: Icon, t, d }) => (
              <div key={t} className="rounded-2xl border border-border bg-card p-4"><Icon className="h-6 w-6 text-primary" /><h3 className="mt-2 font-bold">{t}</h3><p className="mt-1 text-sm text-muted-foreground">{d}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section id="downloads" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <h2 className="mb-6 text-center text-2xl font-bold sm:text-3xl">مركز التنزيلات</h2>
        <div className="divide-y divide-border rounded-2xl border border-border bg-card">
          {files.map((f) => (
            <div key={f.url} className="flex flex-wrap items-center justify-between gap-2 p-4">
              <span className="flex items-center gap-2 text-sm font-medium"><FileText className="h-4 w-4 text-primary" /><span dir="ltr">{f.name}</span></span>
              <span className="flex gap-2 text-sm">
                <a href={f.url} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border px-3 py-1 hover:bg-muted">English</a>
                <a href={f.ar} target="_blank" rel="noopener noreferrer" className="rounded-full border border-border px-3 py-1 hover:bg-muted">عربي</a>
              </span>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">للمزيد: <a href="https://www.hithium.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">الموقع الرسمي hithium.com</a></p>
      </section>

      <AgencyShowcase brand="hithium" />
      <footer className="border-t border-border bg-card py-8 text-center text-sm text-muted-foreground">HiTHIUM — متوفر لدى ACTES لحلول أنظمة الطاقة</footer>
      {sel && <BrandProductDetail product={sel} accent="#00a0e9" gallery={["/media/hithium-legend-112s.jpg","/media/hithium-legend-112c.jpg","/media/items/battery-hithium-legnd-16kwh.jpg","/media/items/battery-hithium-12v-314ah.jpg"]} onClose={() => setSel(null)} />}
    </main>
  );
}

function ProductBlock({ p, onOpen }: { p: Product; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="grid gap-5 p-5 md:grid-cols-[240px_1fr]">
        <div className="flex items-center justify-center rounded-xl bg-muted p-3"><img src={p.image} alt={p.name} loading="lazy" className="max-h-56 w-auto object-contain" /></div>
        <div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{p.power}</span>
          <h3 className="mt-3 text-lg font-bold sm:text-xl">{p.name}</h3>
          <p className="text-sm text-muted-foreground" dir="ltr" style={{ textAlign: "right" }}>{p.model}</p>
          <p className="mt-3 text-sm leading-7">{p.about}</p>
          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">{p.features.slice(0, 6).map((f) => <li key={f} className="flex gap-2 text-sm"><span className="text-primary">●</span>{f}</li>)}</ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button onClick={onOpen} className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background hover:opacity-90">تفاصيل المنتج</button>
            {p.specs.length > 0 && <button onClick={() => setOpen((v) => !v)} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">{open ? "إخفاء المواصفات" : "المواصفات الفنية"}</button>}
            {p.files.map((f) => <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-border px-5 py-2 text-sm hover:bg-muted"><FileText className="h-4 w-4" /> الكتالوج</a>)}
          </div>
        </div>
      </div>
      {open && (
        <div className="grid gap-4 border-t border-border bg-muted/40 p-5 md:grid-cols-2">
          {p.specs.map((g) => (
            <div key={g.title} className="rounded-xl bg-card p-4">
              <h4 className="mb-2 font-bold text-primary">{g.title}</h4>
              <table className="w-full text-sm"><tbody>{g.rows.map(([k, v]) => <tr key={k} className="border-b border-border last:border-0"><td className="py-1.5 text-muted-foreground">{k}</td><td className="py-1.5 font-medium">{v}</td></tr>)}</tbody></table>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
