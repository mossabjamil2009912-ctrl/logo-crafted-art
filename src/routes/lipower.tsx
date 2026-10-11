import { AgencyBadge, AgencyShowcase } from "@/components/agency-showcase";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, BatteryCharging, Cpu, FileText, Gauge, ShieldCheck, Sun, Wifi } from "lucide-react";
import actesLogo from "@/assets/actes-logo-full.webp";
import { PRODUCTS, type Product } from "@/lib/products-data";
import { BrandProductDetail } from "@/components/brand-product-detail";

export const Route = createFileRoute("/lipower")({
  head: () => ({
    meta: [
      { title: "Li-Power — إنفرترات هجينة | ACTES" },
      { name: "description", content: "إنفرترات Li-Power الهجينة 1.6 و4 و6.2 كيلوواط: المواصفات المعتمدة والمزايا والكتالوجات العربية لدى ACTES." },
      { property: "og:title", content: "Li-Power — إنفرترات هجينة | ACTES" },
      { property: "og:description", content: "تعرّف على إنفرترات Li-Power الهجينة ومواصفاتها وكتالوجاتها المعتمدة." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LiPowerPage,
});

const HIGHLIGHTS = [
  { icon: Sun, title: "شحن شمسي MPPT", text: "استغلال أعلى للطاقة الشمسية حتى 6500W." },
  { icon: BatteryCharging, title: "دعم بطاريات الليثيوم", text: "اتصال BMS مع أشهر العلامات." },
  { icon: Wifi, title: "مراقبة عبر الواي فاي", text: "تابع منظومتك من أي مكان." },
  { icon: Gauge, title: "كفاءة عالية", text: "كفاءة تحويل تصل إلى 98%." },
  { icon: ShieldCheck, title: "حمايات متكاملة", text: "حماية من التحميل الزائد وعكس القطبية." },
  { icon: Cpu, title: "يعمل بدون بطارية", text: "خيار أوفر للمنظومات المتصلة بالشبكة." },
];

function LiPowerPage() {
  const items = PRODUCTS.filter((p) => p.brand === "Li-Power");
  const [sel, setSel] = useState<Product | null>(null);
  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground">
      <AgencyBadge brand="lipower" />
      <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3"><img src={actesLogo} alt="ACTES" className="h-10 w-auto" /><span className="h-8 w-px bg-border" /><img src="/brand/makers/lipower.png" alt="Li-Power" className="h-7 w-auto" /></div>
          <Link to="/" className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-1.5 text-sm hover:bg-muted">
            <ArrowRight className="h-4 w-4" /> الرئيسية
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-b from-muted to-background">
        <div className="mx-auto max-w-6xl px-4 py-14 text-center sm:py-20">
          <img src="/brand/makers/lipower.png" alt="Li-Power" className="mx-auto h-20 w-auto sm:h-28" />
          <h1 className="mt-6 text-3xl font-bold sm:text-5xl">إنفرترات هجينة ذكية لكل منزل</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground sm:text-lg">
            حلول Li-Power تجمع الإنفرتر والشاحن الشمسي وشاحن الشبكة في جهاز واحد، بموجة جيبية نقية وتصميم أنيق سهل التركيب.
          </p>
          <a href="#products" className="mt-8 inline-block rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground shadow hover:opacity-90">
            استعرض المنتجات
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
          {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <Icon className="h-7 w-7 text-primary" />
              <h3 className="mt-3 font-bold">{title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="products" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-16">
        <h2 className="mb-8 text-center text-2xl font-bold sm:text-3xl">منتجاتنا</h2>
        <div className="space-y-8">
          {items.map((p) => <ProductBlock key={p.id} p={p} onOpen={() => setSel(p)} />)}
        </div>
      </section>

      <AgencyShowcase brand="lipower" />
      <footer className="border-t border-border bg-card py-8 text-center text-sm text-muted-foreground">
        Li-Power — متوفر لدى ACTES لحلول أنظمة الطاقة
      </footer>
      {sel && <BrandProductDetail product={sel} accent="#f39200" gallery={["/media/items/lipower-1.6kw-12v.jpg","/media/items/lipower-6.2kw-48v.jpg"]} onClose={() => setSel(null)} />}
    </main>
  );
}

function ProductBlock({ p, onOpen }: { p: Product; onOpen: () => void }) {
  const [open, setOpen] = useState(false);
  return (
    <article className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
      <div className="grid gap-6 p-6 md:grid-cols-[280px_1fr]">
        <div className="flex items-center justify-center rounded-2xl bg-muted p-4">
          <img src={p.image} alt={p.name} loading="lazy" className="max-h-64 w-auto object-contain" />
        </div>
        <div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{p.power}</span>
          <h3 className="mt-3 text-xl font-bold sm:text-2xl">{p.name}</h3>
          <p className="text-sm text-muted-foreground" dir="ltr" style={{ textAlign: "right" }}>{p.model}</p>
          <p className="mt-3">{p.about}</p>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {p.features.slice(0, 6).map((f) => (
              <li key={f} className="flex gap-2 text-sm"><span className="text-primary">●</span>{f}</li>
            ))}
          </ul>
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={onOpen} className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background hover:opacity-90">تفاصيل المنتج</button>
            <button onClick={() => setOpen((v) => !v)} className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              {open ? "إخفاء المواصفات" : "المواصفات الفنية"}
            </button>
            {p.files.map((f) => (
              <a key={f.url} href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border border-border px-5 py-2 text-sm hover:bg-muted">
                <FileText className="h-4 w-4" /> الكتالوج
              </a>
            ))}
          </div>
        </div>
      </div>
      {open && (
        <div className="grid gap-4 border-t border-border bg-muted/40 p-6 md:grid-cols-2">
          {p.specs.map((g) => (
            <div key={g.title} className="rounded-2xl bg-card p-4">
              <h4 className="mb-2 font-bold text-primary">{g.title}</h4>
              <table className="w-full text-sm">
                <tbody>
                  {g.rows.map(([k, v]) => (
                    <tr key={k} className="border-b border-border last:border-0">
                      <td className="py-1.5 text-muted-foreground">{k}</td>
                      <td className="py-1.5 font-medium">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </article>
  );
}
