import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronDown, Download, Globe, Menu, Search, ShieldCheck, X } from "lucide-react";
import type { Product } from "@/lib/products-data";
import { officialCatalogUrl } from "@/lib/official-catalogs";
import { PYLON_SOLUTIONS } from "@/lib/pylontech-solutions";
import actesLogo from "@/assets/actes-logo-full.webp";

type Simple = { t: string; d?: string; h: string };
type Menu = { id: string; label: string; items: Simple[]; actes: Simple };

const SOLUTIONS: Simple[] = PYLON_SOLUTIONS.map((x) => ({ t: x.t, d: x.en, h: `#sol-${x.id}` }));


const MENUS: Menu[] = [
  {
    id: "support", label: "الخدمة والدعم",
    items: [
      { t: "كن شريكاً لنا", h: "#support" },
      { t: "مركز الخدمة", h: "#support" },
      { t: "تسجيل البطارية", h: "#support" },
      { t: "التحميلات", h: "#products" },
    ],
    actes: { t: "دعم ACTES الفني", d: "تركيب وضمان وصيانة عبر الوكيل المعتمد", h: "#support" },
  },
  {
    id: "contact", label: "اتصل بنا",
    items: [
      { t: "تواصل معنا", h: "#contact" },
      { t: "انضم إلينا", h: "#contact" },
    ],
    actes: { t: "تواصل مع ACTES", d: "استفسارات منتجات بايلونتك والدعم", h: "#contact" },
  },
];

function Downloads({ products }: { products: Product[] }) {
  const rows = products
    .map((p) => ({ p, ar: officialCatalogUrl(p, "ar"), en: officialCatalogUrl(p, "en") }))
    .filter((r) => r.ar || r.en);
  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-[#00a5b0]">التنزيلات — الكتالوجات (عربي / English)</p>
      <ul className="divide-y divide-border rounded-lg border border-border">
        {rows.map(({ p, ar, en }) => (
          <li key={p.id} className="flex items-center justify-between gap-3 p-2.5 text-sm">
            <span className="min-w-0 truncate">{p.name} <span className="text-xs text-muted-foreground" dir="ltr">({p.model})</span></span>
            <span className="flex shrink-0 gap-2">
              {ar && <a href={ar} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded border border-primary/40 px-2 py-1 text-xs text-primary hover:bg-primary/10"><Download className="h-3 w-3" />عربي</a>}
              {en && <a href={en} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded border border-border px-2 py-1 text-xs hover:bg-muted" dir="ltr"><Download className="h-3 w-3" />EN</a>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ActesCard({ a, onClick }: { a: Simple; onClick?: () => void }) {
  return (
    <a href={a.h} onClick={onClick} className="mt-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 hover:bg-primary/10">
      <img src={actesLogo} alt="ACTES" className="h-8 w-auto" />
      <div className="min-w-0 text-right">
        <p className="flex items-center gap-1 text-sm font-semibold text-primary"><ShieldCheck className="h-4 w-4" />{a.t}</p>
        {a.d && <p className="text-xs text-muted-foreground">{a.d}</p>}
      </div>
    </a>
  );
}

export function PylontechNav({ products }: { products: Product[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const [acc, setAcc] = useState<string | null>(null);
  const close = () => { setOpen(null); setMobile(false); };

  return (
    <header className="fixed inset-x-0 top-0 z-30 bg-background/95 backdrop-blur" onMouseLeave={() => setOpen(null)}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5">
        <div className="flex items-center gap-3">
          <img src="/media/pylontech/logo.svg" alt="PYLONTECH" className="h-6 w-auto" />
          <span className="h-7 w-px bg-border" />
          <img src={actesLogo} alt="ACTES" className="h-9 w-auto" />
        </div>
        <nav className="hidden h-full items-stretch gap-7 text-[15px] lg:flex">
          {[{ id: "solutions", label: "المنتجات والحلول", items: [...SOLUTIONS, { t: "جميع منتجات أكتس", h: "#products" }] }, ...MENUS].map((m) => (
            <div key={m.id} className="relative flex" onMouseEnter={() => setOpen(m.id)}>
              <button onClick={() => setOpen(open === m.id ? null : m.id)}
                className={`flex items-center gap-1 border-b-2 ${open === m.id ? "border-primary text-primary" : "border-transparent hover:text-primary"}`}>
                {m.label}<ChevronDown className="h-3.5 w-3.5" />
              </button>
              {open === m.id && m.items.length > 0 && (
                <div className="absolute right-0 top-full min-w-[220px] rounded-b-lg border border-border bg-background py-2 shadow-lg">
                  {m.items.map((it) => (
                    <a key={it.t} href={it.h} onClick={close} className="block px-5 py-2.5 text-sm hover:bg-muted hover:text-primary">{it.t}</a>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <div className="flex items-center gap-4 text-sm">
          <Search className="h-5 w-5" />
          <span className="hidden items-center gap-1 sm:flex"><Globe className="h-4 w-4" /> عالمي - عربي</span>
          <Link to="/" aria-label="الرئيسية" className="rounded-full border border-border p-1.5 hover:bg-muted"><ArrowRight className="h-4 w-4" /></Link>
          <button aria-label="القائمة" className="lg:hidden" onClick={() => setMobile(true)}><Menu className="h-6 w-6" /></button>
        </div>
      </div>


      {/* قائمة الجوال */}
      {mobile && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-foreground/50" onClick={() => setMobile(false)} />
          <aside className="absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col overflow-y-auto bg-background p-5">
            <div className="mb-4 flex items-center justify-between">
              <img src={actesLogo} alt="ACTES" className="h-9 w-auto" />
              <button aria-label="إغلاق" onClick={() => setMobile(false)}><X className="h-6 w-6" /></button>
            </div>
            {[{ id: "solutions", label: "المنتجات والحلول", items: SOLUTIONS, actes: { t: "متوفر لدى ACTES", d: "الكتالوجات المعتمدة", h: "#products" } }, ...MENUS].map((m) => (
              <div key={m.id} className="border-b border-border">
                <button className="flex w-full items-center justify-between py-4 font-medium" onClick={() => setAcc(acc === m.id ? null : m.id)}>
                  {m.label}<ChevronDown className={`h-4 w-4 transition ${acc === m.id ? "rotate-180" : ""}`} />
                </button>
                {acc === m.id && (
                  <div className="pb-4">
                    {m.items.map((it) => <a key={it.t} href={it.h} onClick={close} className="block py-2 pr-3 text-sm text-muted-foreground">{it.t}</a>)}
                    {m.id === "support" && <Downloads products={products} />}
                    <ActesCard a={m.actes} onClick={close} />
                  </div>
                )}
              </div>
            ))}
          </aside>
        </div>
      )}
    </header>
  );
}
