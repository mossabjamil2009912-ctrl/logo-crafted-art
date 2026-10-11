import { useState } from "react";
import { Download, FileText, X } from "lucide-react";
import type { Product } from "@/lib/products-data";
import { getProductVideo } from "@/lib/product-video";
import { officialCatalogUrl } from "@/lib/official-catalogs";
import { LazyVideo } from "@/components/lazy-video";

/** صفحة منتج كاملة داخل مواقع العلامات: فيديو المنتج الحقيقي، الصور، المزايا، المواصفات والملفات الرسمية. */
export function BrandProductDetail({ product, accent, onClose, gallery }: { product: Product; accent: string; onClose: () => void; gallery?: string[] }) {
  return (
    <div dir="rtl" className="fixed inset-0 z-50 overflow-y-auto bg-background">
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-5 py-3 backdrop-blur">
        <p className="font-bold" dir="ltr">{product.model.split(" ")[0]}</p>
        <button onClick={onClose} aria-label="إغلاق" className="rounded-full border border-border p-2 hover:bg-muted"><X className="h-5 w-5" /></button>
      </div>
      <ProductBody product={product} accent={accent} gallery={gallery} />
    </div>
  );
}

/** محتوى صفحة المنتج كاملاً (يُعرض مباشرة داخل صفحات الحلول). */
export function ProductBody({ product: p, accent, gallery }: { product: Product; accent: string; gallery?: string[] | undefined }) {
  const video = getProductVideo(p.baseId ?? p.id) ?? getProductVideo(p.id);
  const [tab, setTab] = useState(0);
  const ar = officialCatalogUrl(p, "ar");
  const en = officialCatalogUrl(p, "en");
  const tabs = ["المزايا", "المواصفات الفنية", "التنزيلات"];
  return (
    <div dir="rtl" id={`product-${p.id}`} className="scroll-mt-16 border-b-4 border-border">
      {/* الصورة الرسمية للمنتج أولاً كما في موقع الشركة */}
      <section className="bg-muted/40">
        <div className="mx-auto grid max-w-7xl items-center gap-6 px-5 py-10 md:grid-cols-2">
          <div className="text-right">
            <p className="text-sm text-muted-foreground" dir="ltr" style={{ textAlign: "right" }}>{p.brand}</p>
            <h1 className="mt-1 text-3xl font-bold sm:text-5xl" dir="ltr" style={{ textAlign: "right" }}>{p.model.split(" ")[0]}</h1>
            <p className="mt-2 text-xl font-bold" style={{ color: accent }} dir="ltr">{p.power}</p>
          </div>
          <div className="flex items-center justify-center"><img src={p.image} alt={p.name} className="max-h-[45svh] object-contain" /></div>
        </div>
      </section>
      {/* فيديو ووصف ACTES */}
      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-12 md:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-muted">
          {video ? (
            <LazyVideo src={video.src} poster={video.poster ?? p.image} controls className="h-full max-h-[60svh] w-full object-cover" />
          ) : (
            <div className="flex h-72 items-center justify-center"><img src={p.image} alt={p.name} className="max-h-[80%] object-contain" /></div>
          )}
        </div>
        <div>
          <p className="text-sm text-muted-foreground" dir="ltr" style={{ textAlign: "right" }}>{p.model}</p>
          <p className="mt-4 leading-8">{p.about || p.description}</p>
          <p className="mt-4 text-sm text-muted-foreground">{p.suitableFor}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            {ar && <a href={ar} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full px-4 py-2 text-sm text-background" style={{ background: accent }}><FileText className="h-4 w-4" />الكتالوج بالعربية</a>}
            {en && <a href={en} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm"><Download className="h-4 w-4" />EN Datasheet</a>}
          </div>
        </div>
      </section>
      {gallery && gallery.length > 0 && (
        <section className="bg-muted/40 py-10">
          <div className="mx-auto max-w-7xl px-5">
            <h2 className="mb-5 text-xl font-bold">صور المنتج من {p.brand}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {gallery.map((g) => <img key={g} src={g} alt={p.model} loading="lazy" className="h-56 w-full rounded-xl bg-background object-cover" />)}
            </div>
            <div className="mt-6 flex flex-wrap gap-2">
              {ar && <a href={ar} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full px-4 py-2 text-sm text-background" style={{ background: accent }}><FileText className="h-4 w-4" />الكتالوج بالعربية (ACTES)</a>}
              {en && <a href={en} target="_blank" rel="noreferrer" className="flex items-center gap-1 rounded-full border border-border bg-background px-4 py-2 text-sm"><Download className="h-4 w-4" />الكتالوج بالإنجليزية</a>}
            </div>
          </div>
        </section>
      )}
      <section className="mx-auto max-w-7xl px-5 pb-16">
        <div className="flex gap-6 border-b border-border">
          {tabs.map((t, i) => <button key={t} onClick={() => setTab(i)} className="-mb-px border-b-2 py-3 text-sm font-medium" style={{ borderColor: tab === i ? accent : "transparent", color: tab === i ? accent : undefined }}>{t}</button>)}
        </div>
        {tab === 0 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {p.features.map((f) => <div key={f} className="rounded-xl border border-border p-4 text-sm leading-7">{f}</div>)}
            {p.uses.map((u) => <div key={u} className="rounded-xl bg-muted/50 p-4 text-sm leading-7">{u}</div>)}
          </div>
        )}
        {tab === 1 && (
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {p.specs.map((g) => (
              <div key={g.title} className="rounded-xl border border-border p-4">
                <h4 className="mb-2 font-bold" style={{ color: accent }}>{g.title}</h4>
                <table className="w-full text-sm"><tbody>{g.rows.map(([k, v]) => <tr key={k} className="border-b border-border last:border-0"><td className="py-1.5 text-muted-foreground">{k}</td><td className="py-1.5 font-medium" dir="ltr" style={{ textAlign: "right" }}>{v}</td></tr>)}</tbody></table>
              </div>
            ))}
          </div>
        )}
        {tab === 2 && (
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {p.files.map((f) => <a key={f.url} href={f.url} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-border p-4 text-sm hover:bg-muted"><span>{f.label}</span><Download className="h-4 w-4" /></a>)}
          </div>
        )}
      </section>
    </div>
  );
}
