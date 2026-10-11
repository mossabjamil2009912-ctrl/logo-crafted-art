import { AgencyBadge, AgencyShowcase } from "@/components/agency-showcase";
import { createFileRoute} from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, FileText, Headphones, Mail } from "lucide-react";
import { PRODUCTS } from "@/lib/products-data";
import { BrandProductDetail } from "@/components/brand-product-detail";
import { PYLON_SOLUTIONS } from "@/lib/pylontech-solutions";
import { PylontechSolution } from "@/components/pylontech-solution";
import { PylontechNav } from "@/components/pylontech-nav";
import { useResolvedVideoSrc } from "@/lib/video-source";
import actesLogo from "@/assets/actes-logo-full.webp";
import resBess from "@/assets/pylon/residential-bess.jpg";

export const Route = createFileRoute("/pylontech")({
  head: () => ({
    meta: [
      { title: "بايلونتك العالمية — أنظمة تخزين الطاقة بالبطاريات | ACTES" },
      { name: "description", content: "بايلونتك: المورّد الرائد عالمياً لأنظمة تخزين الطاقة بالبطاريات للمنازل والمرافق والقطاع التجاري والصناعي — بالعربية عبر ACTES." },
      { property: "og:title", content: "بايلونتك العالمية — حرّر طاقتك بشكل مستدام" },
      { property: "og:description", content: "أنظمة تخزين الطاقة من بايلونتك للمنازل والمشاريع التجارية والصناعية والمرافق." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PylontechPage,
});


const SLIDES = [
  { id: "home", video: "/videos/pylontech-home-official.mp4", poster: "/media/pylontech/hero-h3x.jpg", k: "PYLONTECH", t: "حرّر طاقتك بشكل مستدام", d: "المورّد الرائد عالمياً لأنظمة تخزين الطاقة بالبطاريات" },
  { id: "pylontech-fidus-battery-plus", video: "/videos/pylontech-fidus-official.mp4", poster: "/media/pylontech/hero-fidus.jpg", k: "Fidus", t: "عبر الحدود، طاقة بلا حدود", d: "من 5 حتى 16 كيلوواط ساعة، توسّع حسب حاجتك" },
  { id: "pylontech-optimus-l260-hy", video: "", poster: "/media/pylontech/hero-h3x.jpg", k: "All-in-One", t: "طاقة أذكى، توفير أكبر", d: "منظومة تخزين متكاملة الكل في واحد تُحدث ثورة في تجربة التخزين" },
];




const ESG = [
  { v: "13,949", u: "طن CO2e/سنة", l: "محطات شمسية مقترحة ومنشأة لتجنّب انبعاثات غازات الدفيئة" },
  { v: "1,387", u: "طن CO2e/سنة", l: "إعادة تدوير حرارة الغلايات المهدرة لتجنّب الانبعاثات" },
  { v: "2,495", u: "طن CO2e/سنة", l: "استرجاع طاقة التفريغ الجزئي لتجنّب الانبعاثات" },
];

const AWARDS = [
  { t: "جائزة الشفافية في ESG", d: "من EUPD Research تقديراً للإفصاح الشفاف والموثوق عن الاستدامة." },
  { t: "تصنيف CDP للتغيّر المناخي B", d: "اعتراف من CDP بالعمل المناخي الفعّال والإفصاح البيئي." },
  { t: "ميدالية EcoVadis الفضية", d: "ضمن أفضل 6% في القطاع من حيث أداء الاستدامة." },
];

const CASES = [
  { p: "أستراليا · 2025", t: "40kWh — Force H3X", img: "/media/pylontech/case-au.png" },
  { p: "الصين · 2024", t: "تخفيف ذروة الأحمال + الاستجابة للطلب 40MW/80MWh", img: "/media/pylontech/case-cn.jpg" },
  { p: "أوروبا · 2023", t: "خدمات الشبكة 400kW/432kWh", img: resBess },
];

const FOOTER = [
  { t: "المنتجات والحلول", l: ["التخزين السكني", "التخزين التجاري والصناعي", "الجهد العالي والمشاريع الكبرى", "الأنظمة المستقلة والمتنقلة"] },
  { t: "الخدمة والدعم", l: ["كن شريكاً لنا", "مركز الخدمة", "تسجيل البطارية", "التحميلات"] },
  { t: "من نحن", l: ["نبذة عن الشركة", "ثقافة الشركة", "البحث والتطوير", "التصنيع", "الاستدامة"] },
  { t: "المركز الإعلامي", l: ["الأخبار", "المعارض", "الندوات الإلكترونية", "أخبار Voltdeer"] },
  { t: "اتصل بنا", l: ["تواصل معنا", "انضم إلينا", "المبيعات: sales@pylontech.com.cn", "الخدمة: service@pylontech.com.cn", "ACTES — الوكيل المعتمد"] },
];

function PylontechPage() {
  const items = PRODUCTS.filter((p) => p.brand === "Pylontech");
  const [i, setI] = useState(0);
  const [detail, setDetail] = useState<string | null>(null);
  const detailP = items.find((p) => p.id === detail);
  const [sol, setSol] = useState<string | null>(null);
  const solP = PYLON_SOLUTIONS.find((x) => x.id === sol);
  useEffect(() => {
    const onHash = () => { const m = location.hash.match(/^#sol-(\w+)/); if (m) { setSol(m[1]!); history.replaceState(null, "", "#solutions"); } };
    onHash(); window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);
  const s = SLIDES[i] ?? SLIDES[0]!;
  const go = (d: number) => setI((x) => (x + d + SLIDES.length) % SLIDES.length);
  useEffect(() => {
    // شرائح الفيديو تنتقل عند انتهاء الفيديو؛ شرائح الصور بعد 7 ثوانٍ
    if (s.video) return;
    const t = setTimeout(() => go(1), 7000);
    return () => clearTimeout(t);
  }, [i, s.video]);

  return (
    <main dir="rtl" className="min-h-screen bg-background text-foreground">
      <AgencyBadge brand="pylontech" />
      {/* الترويسة */}
      <PylontechNav products={items} />

      {/* الشريط الرئيسي */}
      <section className="relative flex h-[100svh] min-h-[560px] items-center overflow-hidden bg-foreground text-background">
        <HeroMedia key={s.id} video={s.video} poster={s.poster} onEnded={() => go(1)} />
        <div className="absolute inset-0 bg-gradient-to-l from-foreground/70 via-foreground/30 to-transparent" />
        <div className="relative mx-auto w-full max-w-7xl px-5">
          <div className="max-w-xl">
            <p className="text-sm tracking-widest opacity-70">{s.k}</p>
            <h1 className="mt-3 text-4xl font-bold leading-tight sm:text-6xl">{s.t}</h1>
            <p className="mt-4 text-lg opacity-80">{s.d}</p>
            <a href="#solutions" className="mt-8 inline-block rounded-full border border-background/70 px-8 py-3 text-sm hover:bg-background hover:text-foreground">اعرف المزيد</a>
          </div>
        </div>
        <div className="absolute bottom-8 inset-x-0 flex items-center justify-center gap-4">
          <button aria-label="السابق" onClick={() => go(-1)} className="rounded-full border border-background/50 p-2"><ChevronRight className="h-4 w-4" /></button>
          {SLIDES.map((_, n) => (
            <button key={n} aria-label={`الشريحة ${n + 1}`} onClick={() => setI(n)} className={`h-1 rounded-full transition-all ${n === i ? "w-10 bg-background" : "w-5 bg-background/40"}`} />
          ))}
          <button aria-label="التالي" onClick={() => go(1)} className="rounded-full border border-background/50 p-2"><ChevronLeft className="h-4 w-4" /></button>
        </div>
      </section>

      {/* الحلول */}
      <section id="solutions" className="scroll-mt-16 bg-muted/50 py-20">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">المنتجات والحلول</h2>
          <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-muted-foreground">حلول بايلونتك المتوفرة لدى أكتس — اضغط على أي حل لعرض منتجاته والتكامل الهندسي والكتالوجات</p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {PYLON_SOLUTIONS.map((x) => (
              <button key={x.id} onClick={() => setSol(x.id)} className="group relative block h-[340px] overflow-hidden rounded-2xl text-right">
                <img src={x.img} alt={x.t} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 right-6 text-background">
                  <h3 className="text-xl font-bold">{x.t}</h3>
                  <p className="mt-1 text-sm opacity-85" dir="ltr">{x.en}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>


      {/* المنتجات */}
      <section id="products" className="scroll-mt-16 py-20">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="text-center text-3xl font-bold sm:text-4xl">جميع المنتجات</h2>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((p) => (
              <button key={p.id} onClick={() => setDetail(p.id)} className="group rounded-2xl border border-border bg-card p-5 text-right transition hover:border-primary hover:shadow-lg">
                <div className="flex h-44 items-center justify-center rounded-xl bg-muted"><img src={p.image} alt={p.name} loading="lazy" className="max-h-40 object-contain transition group-hover:scale-105" /></div>
                <p className="mt-4 text-sm font-bold" dir="ltr" style={{ textAlign: "right" }}>{p.model.split(" ")[0]}</p>
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{p.name}</p>
                <p className="mt-2 text-sm font-bold text-primary" dir="ltr" style={{ textAlign: "right" }}>{p.power}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* الاستدامة */}
      <section className="bg-background py-24">
        <div className="mx-auto max-w-7xl px-5 text-center">
          <h2 className="text-3xl font-bold sm:text-4xl">التزامنا بالاستدامة والتميّز</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {ESG.map((x) => (
              <div key={x.l} className="rounded-2xl bg-muted/50 p-8"><div className="text-4xl font-bold text-primary" dir="ltr">{x.v}</div><div className="text-sm text-muted-foreground">{x.u}</div><p className="mt-3">{x.l}</p></div>
            ))}
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {AWARDS.map((a) => (
              <div key={a.t} className="rounded-2xl border border-border p-6 text-right"><h3 className="font-bold">{a.t}</h3><p className="mt-2 text-sm text-muted-foreground leading-6">{a.d}</p></div>
            ))}
          </div>
          <a href="#solutions" className="mt-10 inline-block rounded-full border border-foreground/30 px-8 py-3 text-sm hover:bg-foreground hover:text-background">اعرف المزيد</a>
        </div>
      </section>

      {/* قصص النجاح */}
      <section id="support" className="scroll-mt-16 py-20">
        <div className="mx-auto max-w-7xl px-5">
          <h2 className="text-3xl font-bold sm:text-4xl">دراسات الحالة</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {CASES.map((c) => (
              <div key={c.t} className="group relative h-80 overflow-hidden rounded-2xl">
                <img src={c.img} alt={c.t} loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
                <div className="absolute bottom-5 right-5 left-5 text-background"><p className="text-sm opacity-80">{c.p}</p><h3 className="mt-1 text-lg font-bold">{c.t}</h3></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* الفوتر */}
      <AgencyShowcase brand="pylontech" />
      <footer id="contact" className="scroll-mt-16 bg-foreground text-background">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:grid-cols-2 md:grid-cols-5">
          {FOOTER.map((c) => (
            <div key={c.t}>
              <h3 className="mb-4 font-bold">{c.t}</h3>
              <ul className="space-y-2 text-sm opacity-70">{c.l.map((x) => <li key={x}>{x}</li>)}</ul>
            </div>
          ))}
        </div>
        <div className="border-t border-background/15">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-6 text-sm opacity-80">
            <div className="flex items-center gap-3">
              <span className="rounded-lg bg-background p-1.5"><img src={actesLogo} alt="ACTES" className="h-8 w-auto" /></span>
              <span>ACTES — الوكيل المعتمد لمنتجات بايلونتك</span>
            </div>
            <span>© Pylon Technologies Co., Ltd.</span>
          </div>
        </div>
      </footer>

      {solP && !detailP && <PylontechSolution s={solP} products={items} onClose={() => setSol(null)} onProduct={(id) => setDetail(id)} />}
      {detailP && <BrandProductDetail product={detailP} accent="#00a5b0" onClose={() => setDetail(null)} />}
      {/* الأزرار العائمة */}
      <div className="fixed left-4 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-3">
        {[{ I: FileText, h: "#solutions", l: "الكتالوجات" }, { I: Headphones, h: "#contact", l: "الدعم" }, { I: Mail, h: "#contact", l: "استفسار" }].map(({ I, h, l }) => (
          <a key={l} href={h} aria-label={l} className="rounded-full bg-primary p-3 text-primary-foreground shadow-lg hover:opacity-90"><I className="h-5 w-5" /></a>
        ))}
      </div>
    </main>
  );
}

function HeroMedia({ video, poster, onEnded }: { video: string; poster: string; onEnded?: () => void }) {
  const src = useResolvedVideoSrc(video);
  const ref = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const v = ref.current;
    if (!v || !src) return;
    v.defaultMuted = true;
    v.muted = true;
    v.playsInline = true;
    const p = v.play();
    if (p) p.catch(() => {});
  }, [src]);
  return (
    <>
      <img src={poster} alt="" className="absolute inset-0 h-full w-full object-cover" />
      {video && src && (
        <video
          ref={ref}
          src={src}
          poster={poster}
          autoPlay
          muted
          playsInline
          preload="auto"
          onCanPlay={(e) => { setReady(true); e.currentTarget.play().catch(() => {}); }}
          onPlaying={() => setReady(true)}
          onEnded={onEnded}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${ready ? "opacity-100" : "opacity-0"}`}
        />
      )}
    </>
  );
}
