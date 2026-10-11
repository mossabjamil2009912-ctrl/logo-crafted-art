import { AgencyBadge, AgencyShowcase } from "@/components/agency-showcase";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ChevronDown, Download, FileText, Mail, Menu, X } from "lucide-react";
import actesLogo from "@/assets/actes-logo-full.webp";
import { PRODUCTS } from "@/lib/products-data";
import { officialCatalogUrl } from "@/lib/official-catalogs";
import { BrandProductDetail } from "@/components/brand-product-detail";

export const Route = createFileRoute("/suntech")({
  head: () => ({
    meta: [
      { title: "Suntech — ألواح شمسية | ACTES الوكيل المعتمد" },
      { name: "description", content: "موقع Suntech بالعربية: ألواح Ultra Series وN-Type ثنائية الوجه، المشاريع، التنزيلات والكتالوجات العربية لدى ACTES." },
      { property: "og:title", content: "Suntech — ألواح شمسية | ACTES" },
      { property: "og:description", content: "25 عاماً من تصنيع الألواح الكهروضوئية، أكثر من 55 GW شحنات عالمية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SuntechPage,
});

const M = "/media/suntech";
const ACCENT = "text-[#e60012]";

const NAV = [
  { label: "من نحن", items: [["من نحن", "#about"], ["اتصل بنا", "#contact"]] },
  { label: "الأخبار", items: [["الأخبار 2026", "#news"]] },
  { label: "المنتجات", items: [["الألواح Module", "#products"]] },
  { label: "المشاريع", items: [["محطات المرافق Utility", "#projects"], ["المشاريع التجارية والصناعية C&I", "#projects"], ["المنظومات السكنية Residential", "#projects"]] },
  { label: "التنزيلات", items: [["الملف التعريفي للشركة", "#downloads"], ["نشرات المنتجات Datasheet", "#downloads"], ["دليل التركيب", "#downloads"], ["ضمان المنتج", "#downloads"], ["شهادات الاعتماد", "#downloads"], ["الفيديو", "#about"]] },
] as const;

const SLIDES = [
  { img: `${M}/banner-20260408.webp`, title: "ULTRA SERIES", sub: "ألواح Suntech الجديدة بتقنية N-Type عالية الكفاءة" },
  { img: `${M}/solar-module-banner-bg.jpg`, title: "Ultra T 3.0", sub: "ألواح Quarter-cut جديدة — قدرة 670W وثنائية وجه 85±5%" },
];

const STATS = [
  ["25", "عاماً", "من الخبرة في تصنيع الألواح الكهروضوئية"],
  ["55 GW+", "", "إجمالي الشحنات العالمية التراكمية للألواح"],
  ["600+", "", "براءة اختراع معتمدة"],
  ["100+", "دولة", "انتشار أعمالنا حول العالم"],
];

const MODULES = ["STPXXXS-H48-N(kh,th,fb)+", "STPXXXS-H54-N(kh, th, fb)+", "STPXXXS-H66-Nsh+", "STPXXXS-D66-Nsh+", "STP-NT11/48QGD(S)F", "STP-NT11/66QGDF"];

const PROJECTS = [
  { k: "utility", t: "محطات المرافق", e: "Utility", img: `${M}/solar-module-banner-bg.jpg`, list: [] as string[][] },
  { k: "ci", t: "التجاري والصناعي", e: "Commercial & Industrial", img: `${M}/home-bg2-m.jpg`, list: [["مزرعة Mooshof المستقلة طاقياً", "Schwarzenberg · النمسا", "جائزة الطاقة الشمسية النمساوية 2025"]] },
  { k: "res", t: "السكني", e: "Residential", img: `${M}/home-bg3-m.jpg`, list: [["Huzhou Huaikan Rooftop", "Huzhou · الصين", "5 kW"], ["Kingspan Residential BIPV", "Waterford · إنجلترا", "4.8 kW"], ["Cosmo Town BIPV", "Saitama · اليابان", "237 kW"], ["Waterloo Rooftop", "Ottawa · كندا", "8 kW"]] },
];

const TECH = [
  ["+26%", "كفاءة خلايا N-Type TOPCon"],
  ["−0.29%/°C", "معامل حرارة منخفض — إنتاج أعلى 3–4% من PERC"],
  ["حتى 30%", "إنتاج إضافي من الوجه الخلفي (Bifacial)"],
  ["30 سنة", "ضمان خطي: 1% أول سنة ثم 0.40% سنوياً"],
];

const NEWS = [
  { d: "14 سبتمبر 2026", t: "SunStorage PRO STE-1ML-500P يدخل السوق الأوكرانية", u: "https://www.suntech-power.com/suntech-sunstorage-pro-ste-1ml-500p-to-make-its-debut-in-the-ukrainian-market/" },
  { d: "7 أغسطس 2026", t: "طاقة أذكى بحلول الطاقة الشمسية + التخزين المتكاملة", u: "https://www.suntech-power.com/empowering-smarter-energy-with-integrated-solar-storage-solutions/" },
  { d: "22 يوليو 2026", t: "عقدان من الثقة: مزرعة نمساوية مستقلة طاقياً بألواح Suntech", u: "https://www.suntech-power.com/two-decades-of-trust-how-suntech-helps-power-austrias-energy-independent-farm/" },
  { d: "10 يوليو 2026", t: "Suntech تستعرض Ultra T 3.0 وSunStorage في منتدى TaiyangNews", u: "https://www.suntech-power.com/suntech-highlights-pv-and-energy-storage-innovations-at-taiyangnews-global-technology-forum/" },
];

const DL_TABS = ["نشرات المنتجات", "الملف التعريفي", "دليل التركيب", "ضمان المنتج", "شهادات الاعتماد"] as const;
const DL_URL = "https://www.suntech-power.com/download/";

function SuntechPage() {
  const items = PRODUCTS.filter((p) => p.brand === "Suntech" && p.category === "panels");
  const [detail, setDetail] = useState<string | null>(null);
  const detailP = items.find((p) => p.id === detail);
  const [slide, setSlide] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const [mobile, setMobile] = useState(false);
  const [proj, setProj] = useState(0);
  const [tab, setTab] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 7000);
    return () => clearInterval(t);
  }, []);

  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground">
      <AgencyBadge brand="suntech" />
      <header className="fixed inset-x-0 top-0 z-30 border-b border-border bg-background/95 backdrop-blur" onMouseLeave={() => setOpen(null)}>
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5">
          <div className="flex items-center gap-3">
            <img src={`${M}/logo-suntech.webp`} alt="Suntech" className="h-8 w-auto" />
            <span className="h-7 w-px bg-border" />
            <img src={actesLogo} alt="ACTES" className="h-8 w-auto" />
            <span className="hidden text-xs text-muted-foreground sm:inline">الوكيل المعتمد</span>
          </div>
          <nav className="hidden items-center gap-1 lg:flex">
            {NAV.map((n, i) => (
              <div key={n.label} className="relative" onMouseEnter={() => setOpen(i)}>
                <button onClick={() => setOpen(open === i ? null : i)} className={`flex items-center gap-1 px-3 py-5 text-sm hover:text-[#e60012] ${open === i ? ACCENT : ""}`}>
                  {n.label}<ChevronDown className="h-3.5 w-3.5" />
                </button>
                {open === i && (
                  <div className="absolute right-0 top-full min-w-[230px] rounded-b-md border border-border border-t-2 border-t-[#e60012] bg-background py-2 shadow-lg">
                    {n.items.map(([t, h]) => (
                      <a key={t} href={h} onClick={() => setOpen(null)} className="block px-5 py-2.5 text-sm hover:bg-muted hover:text-[#e60012]">{t}</a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/" className="hidden items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs hover:bg-muted sm:flex"><ArrowRight className="h-3.5 w-3.5" />الرئيسية</Link>
            <button className="lg:hidden" onClick={() => setMobile(true)} aria-label="القائمة"><Menu className="h-6 w-6" /></button>
          </div>
        </div>
      </header>

      {mobile && (
        <div className="fixed inset-0 z-40 bg-foreground/40" onClick={() => setMobile(false)}>
          <div className="mr-auto h-full w-72 overflow-y-auto bg-background p-5" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setMobile(false)} aria-label="إغلاق" className="mb-4"><X className="h-6 w-6" /></button>
            {NAV.map((n) => (
              <details key={n.label} className="border-b border-border py-2">
                <summary className="cursor-pointer font-medium">{n.label}</summary>
                {n.items.map(([t, h]) => <a key={t} href={h} onClick={() => setMobile(false)} className="block py-1.5 pr-3 text-sm text-muted-foreground">{t}</a>)}
              </details>
            ))}
            <Link to="/" className="mt-4 block text-sm">← الرئيسية</Link>
          </div>
        </div>
      )}

      <section className="relative h-[100svh] min-h-[520px] overflow-hidden">
        {SLIDES.map((s, i) => (
          <div key={s.title} className={`absolute inset-0 transition-opacity duration-1000 ${i === slide ? "opacity-100" : "opacity-0"}`}>
            <img src={s.img} alt={s.title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-l from-foreground/60 to-transparent" />
            <div className="absolute inset-x-0 bottom-24 mx-auto max-w-7xl px-5 text-background">
              <h1 className="text-4xl font-bold tracking-wide md:text-6xl" dir="ltr" style={{ textAlign: "right" }}>{s.title}</h1>
              <p className="mt-3 text-lg">{s.sub}</p>
              <a href="#products" className="mt-6 inline-block rounded-full bg-[#e60012] px-6 py-2.5 text-sm font-medium text-background">اعرف المزيد</a>
            </div>
          </div>
        ))}
        <div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 gap-2">
          {SLIDES.map((s, i) => <button key={s.title} onClick={() => setSlide(i)} aria-label={s.title} className={`h-1.5 rounded-full transition-all ${i === slide ? "w-8 bg-background" : "w-4 bg-background/50"}`} />)}
        </div>
      </section>

      <section id="products" className="bg-muted/40 py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-5 md:grid-cols-2">
          <div>
            <p className={`text-sm font-semibold ${ACCENT}`} dir="ltr" style={{ textAlign: "right" }}>ULTRA SERIES</p>
            <h2 className="mt-2 text-3xl font-bold">STAND THE TEST OF TIME</h2>
            <p className="mt-2 text-xl">صُممت لتصمد أمام اختبار الزمن</p>
            <p className="mt-4 leading-8 text-muted-foreground">ألواح Suntech من سلسلة Ultra بخلايا N-Type وتقنية ثنائية الوجه (Bifacial) وزجاج مزدوج، لإنتاج أعلى وموثوقية طويلة في الظروف القاسية.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {MODULES.map((m) => <span key={m} dir="ltr" className="rounded border border-border bg-background px-2 py-1 text-xs">{m}</span>)}
            </div>
          </div>
          <img src={`${M}/solar-module-banner.png`} alt="Ultra Series solar module" className="mx-auto w-full max-w-lg" />
        </div>
        <div className="mx-auto mt-14 grid max-w-7xl gap-6 px-5 md:grid-cols-2">
          {items.map((p) => {
            const ar = officialCatalogUrl(p, "ar");
            const en = officialCatalogUrl(p, "en");
            return (
              <div key={p.id} onClick={() => setDetail(p.id)} role="button" className="flex cursor-pointer gap-5 rounded-lg border border-border bg-background p-5 transition hover:border-[#e60012] hover:shadow-lg">
                <img src={p.image} alt={p.model} className="h-40 w-28 rounded object-cover" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">متوفر لدى ACTES</p>
                  <h3 className="mt-1 font-bold">{p.name}</h3>
                  <p className="text-sm text-muted-foreground" dir="ltr" style={{ textAlign: "right" }}>{p.model}</p>
                  <p className={`mt-2 text-lg font-bold ${ACCENT}`} dir="ltr" style={{ textAlign: "right" }}>{p.power}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {ar && <a onClick={(e) => e.stopPropagation()} href={ar} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full bg-[#e60012] px-3 py-1.5 text-xs text-background"><FileText className="h-3.5 w-3.5" />الكتالوج بالعربية</a>}
                    {en && <a onClick={(e) => e.stopPropagation()} href={en} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs"><Download className="h-3.5 w-3.5" />EN Datasheet</a>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="about" className="relative overflow-hidden py-24 text-background">
        <video src={`${M}/video-aboutus.mp4`} autoPlay muted loop playsInline className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-foreground/60" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-2 gap-8 px-5 md:grid-cols-4">
          {STATS.map(([n, u, d]) => (
            <div key={d}>
              <p className="text-4xl font-bold md:text-5xl" dir="ltr" style={{ textAlign: "right" }}>{n}</p>
              {u && <p className="text-lg">{u}</p>}
              <p className="mt-2 text-sm text-background/80">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <p className={`text-sm font-semibold ${ACCENT}`} dir="ltr" style={{ textAlign: "right" }}>ULTRA T TECHNOLOGY</p>
          <h2 className="mt-1 text-2xl font-bold">تقنيات سلسلة Ultra</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            {TECH.map(([v, l]) => (
              <div key={l} className="rounded-lg border border-border p-4">
                <p className={`text-2xl font-bold ${ACCENT}`} dir="ltr" style={{ textAlign: "right" }}>{v}</p>
                <p className="mt-1 text-sm text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">شهادات مقاومة رذاذ الملح IEC 61701 والأمونيا IEC 62716 والغبار والرمال — تحمل رياح 2400 Pa وثلوج 5400 Pa.</p>
        </div>
      </section>


      <section id="projects" className="relative overflow-hidden py-20">
        <video src={`${M}/project-v-bg.mp4`} autoPlay muted loop playsInline preload="metadata" className="absolute inset-0 h-full w-full object-cover opacity-20" />
        <div className="relative mx-auto max-w-7xl px-5">
          <h2 className="text-center text-3xl font-bold">خريطة مشاريع Suntech</h2>
          <p className="mt-2 text-center text-sm text-muted-foreground" dir="ltr">SUNTECH PROJECT MAP</p>
          <div className="mt-6 flex justify-center gap-2">
            {PROJECTS.map((p, i) => <button key={p.k} onClick={() => setProj(i)} className={`rounded-full border px-4 py-1.5 text-sm ${proj === i ? "border-[#e60012] bg-[#e60012] text-background" : "border-border bg-background"}`}>{p.t}</button>)}
          </div>
          {(() => { const p = PROJECTS[proj]!; return (
            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="relative h-72 overflow-hidden rounded-lg">
                <img src={p.img} alt={p.e} className="h-full w-full object-cover" />
                <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-foreground/70 to-transparent p-5 text-background"><p className="text-xl font-bold">{p.t}</p><p className="text-sm" dir="ltr" style={{ textAlign: "right" }}>{p.e}</p></div>
              </div>
              <div className="space-y-3">
                {p.list.length ? p.list.map(([n, l, c]) => (
                  <div key={n} className="flex items-center justify-between rounded border border-border bg-background p-4 text-sm"><div><p className="font-medium" dir="ltr" style={{ textAlign: "right" }}>{n}</p><p className="text-xs text-muted-foreground">{l}</p></div><span className={`font-bold ${ACCENT}`}>{c}</span></div>
                )) : <a href="https://www.suntech-power.com/projects/" target="_blank" rel="noreferrer" className="block rounded border border-border bg-background p-4 text-sm">عرض مشاريع المرافق على الموقع الرسمي</a>}
              </div>
            </div>
          ); })()}
        </div>
      </section>

      <section id="news" className="py-16">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="text-2xl font-bold">الأخبار 2026</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {NEWS.map((n) => (
              <a key={n.u} href={n.u} target="_blank" rel="noreferrer" className="rounded-lg border border-border p-4 hover:border-[#e60012]">
                <p className="text-xs text-muted-foreground">{n.d}</p>
                <p className="mt-2 text-sm font-medium leading-6">{n.t}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section id="downloads" className="bg-muted/40 py-16">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="text-2xl font-bold">التنزيلات</h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {DL_TABS.map((t, i) => <button key={t} onClick={() => setTab(i)} className={`rounded-full border px-4 py-1.5 text-sm ${tab === i ? "border-[#e60012] bg-[#e60012] text-background" : "border-border bg-background"}`}>{t}</button>)}
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {tab === 0 ? items.flatMap((p) => [["ar", "عربي"], ["en", "EN"]].map(([l, lab]) => {
              const u = officialCatalogUrl(p, l as "ar" | "en");
              return u ? <a key={p.id + l} href={u} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded border border-border bg-background p-4 text-sm hover:border-[#e60012]"><span dir="ltr">{p.model.split(" ")[0]} Datasheet</span><span className="flex items-center gap-1 text-muted-foreground"><Download className="h-4 w-4" />{lab}</span></a> : null;
            })) : tab === 1 ? (
              <a href="https://www.suntech-power.com/wp-content/uploads/download/Publicity-Material/EN-Suntech-Product-Brochure.pdf" target="_blank" rel="noreferrer" className="flex items-center justify-between rounded border border-border bg-background p-4 text-sm hover:border-[#e60012]"><span>دليل منتجات Suntech 2026</span><span className="flex items-center gap-1 text-muted-foreground"><Download className="h-4 w-4" />PDF</span></a>
            ) : (
              <a href={DL_URL} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded border border-border bg-background p-4 text-sm hover:border-[#e60012]"><span>{DL_TABS[tab]}</span><span className="text-xs text-muted-foreground">الموقع الرسمي</span></a>
            )}
          </div>
        </div>
      </section>

      <section id="contact" className="py-16">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 md:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold">اتصل بنا</h2>
            <p className="mt-3 text-sm text-muted-foreground">Wuxi Suntech Power Co., Ltd. — Wuxi, China</p>
            <a href="https://www.suntech-power.com/contact-us/" target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-sm hover:text-[#e60012]"><Mail className="h-4 w-4" />صفحة التواصل الرسمية</a>
          </div>
          <div className="flex items-center gap-4 rounded-lg border border-border p-5">
            <img src={actesLogo} alt="ACTES" className="h-12 w-auto" />
            <div><p className="font-bold">ACTES — الوكيل المعتمد لـ Suntech في اليمن</p><p className="text-sm text-muted-foreground">للاستشارات والتوريد والكتالوجات العربية المعتمدة.</p></div>
          </div>
        </div>
      </section>

      {detailP && <BrandProductDetail product={detailP} accent="#e60012" gallery={[`${M}/solar-module-banner.png`, `${M}/banner-20260408.webp`, `${M}/solar-module-banner-bg.jpg`]} onClose={() => setDetail(null)} />}
      <AgencyShowcase brand="suntech" />
      <footer className="bg-foreground py-8 text-sm text-background/70">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-5">
          <p dir="ltr">©Copyright. Wuxi Suntech Power Co., Ltd. All Rights Reserved.</p>
          <div className="flex gap-4">{["Linkedin", "Facebook", "Twitter", "Instagram", "Youtube"].map((s) => <span key={s}>{s}</span>)}</div>
        </div>
      </footer>
    </main>
  );
}
