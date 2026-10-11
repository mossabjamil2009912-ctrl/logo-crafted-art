import { useEffect, useRef, useState } from "react";

let manifestPromise: Promise<Record<string, number>> | null = null;
function loadManifest() {
  manifestPromise ??= fetch("/catalogs/pages/manifest.json")
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}));
  return manifestPromise;
}

/** يعرض صفحات الكتالوج: صور جاهزة خفيفة إن وُجدت (فوري)، وإلا يرسم ملف PDF. */
export default function PdfPages({ url }: { url: string }) {
  const [pages, setPages] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    setPages(undefined);
    loadManifest().then((m) => { if (alive) setPages(m[url] ?? null); });
    return () => { alive = false; };
  }, [url]);

  if (pages === undefined) return <div className="h-full w-full flex-1 bg-muted" />;
  if (pages === null) return <PdfCanvas url={url} />;

  const base = `/catalogs/pages/${url.replace(/^\/catalogs\//, "").replace(/\.pdf$/i, "")}`;
  return (
    <div className="h-full w-full flex-1 overflow-auto bg-muted p-2">
      {Array.from({ length: pages }, (_, i) => (
        <img
          key={i}
          src={`${base}/${i + 1}.webp`}
          alt={`صفحة ${i + 1}`}
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
          className="mb-2 block h-auto w-full rounded bg-card shadow"
        />
      ))}
    </div>
  );
}

function PdfCanvas({ url }: { url: string }) {
  const box = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const el = box.current;
    if (!el) return;
    el.innerHTML = "";
    setState("loading");
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        const worker = (await import("pdfjs-dist/build/pdf.worker.min.mjs?url")).default;
        pdfjs.GlobalWorkerOptions.workerSrc = worker;
        const doc = await pdfjs.getDocument({ url, disableFontFace: true }).promise;
        const width = el.clientWidth || 360;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        for (let i = 1; i <= doc.numPages; i++) {
          if (cancelled) return;
          const page = await doc.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const vp = page.getViewport({ scale: (width / base.width) * dpr });
          const canvas = document.createElement("canvas");
          canvas.width = vp.width;
          canvas.height = vp.height;
          canvas.style.width = "100%";
          canvas.style.height = "auto";
          canvas.className = "mb-2 block rounded bg-card shadow";
          el.appendChild(canvas);
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport: vp }).promise;
          if (i === 1 && !cancelled) setState("ok");
        }
      } catch {
        if (!cancelled) setState("error");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className="h-full w-full flex-1 overflow-auto bg-muted p-2">
      {state === "loading" && <p className="py-6 text-center text-xs text-muted-foreground">جارٍ تحميل الكتالوج…</p>}
      {state === "error" && <p className="py-6 text-center text-xs text-muted-foreground">تعذّر عرض الملف، استخدم زر «تحميل».</p>}
      <div ref={box} />
    </div>
  );
}
