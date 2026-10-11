import { useEffect, useMemo, useRef, useState } from "react";
import { ShoppingCart, Download } from "lucide-react";

// تقرير دراسة الجدوى التنفيذي — مقارنة وضع المولد فقط بالمنظومة المقترحة (شمس + تخزين)
const PSH = 5.5, PR = 1, KWH_PER_L = 3.3, DOD = 0.9, CO2_PER_L = 2.68;
const PV_USD_KWP = 450, BAT_USD_KWH = 300, INV_USD_KW = 150;
const BAT_MOD = 16, RACK = 15, PANEL_W = 720;
const nf = (n: number, d = 0) => n.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d });
const hh = (h: number) => `${String(h % 24).padStart(2, "0")}:00`;
const C = { sun: "#f5a01e", bat: "#15803d", gen: "#7f1d1d", load: "#e60012", grid: "#d5dae4" };

type Hour = { h: number; load: number; pv: number; direct: number; batOut: number; charge: number; gen: number; soc: number };

export type EcoResults = { dailyKwh: number; yearKwh: number; loadDay: number | null; coverage: number | null; liters: number; saving: number; payback: number | null; cum: number; roi: number; wattCost: string; years: number; rows: { y: number; cum: number }[] };
export type CustomSystem = { panelName: string; panelW: number; panels: number; invName: string; invKw: number; invN: number; batName: string; batUnit: number; batN: number; capex: number; batKind?: "bat" | "cab"; prev?: CustomSystem };

function design(kw: number[], sys?: CustomSystem, target?: number) {
  const total = kw.reduce((s, v) => s + v, 0);
  const peak = Math.max(...kw, 0);
  const day = kw.reduce((s, v, h) => s + (h >= 7 && h < 17 ? v : 0), 0);
  const evening0 = kw.reduce((s, v, h) => s + (h >= 17 && h < 22 ? v : 0), 0) + (kw[6] ?? 0);
  // عند تحديد نسبة تغطية مستهدفة: النهار أولاً ثم البطاريات لباقي النسبة
  const want = target !== undefined ? total * target : undefined;
  const pvDay = want !== undefined ? Math.min(day, want) : day;
  const evening = want !== undefined ? Math.max(0, want - day) * (target! >= 0.99 ? 1.12 : 1.05) : evening0;
  const smallBat = peak <= 16 ? 5.12 : BAT_MOD;
  const prev = sys?.prev; // منظومة سابقة مدمجة: تدخل في الإنتاج والتغطية فقط، لا في التكلفة
  const mods = sys ? sys.batN : Math.max(evening > 0 ? 1 : 0, Math.ceil(evening / DOD / smallBat));
  const newBat = sys ? sys.batN * sys.batUnit : mods * smallBat;
  const prevBat = prev ? prev.batN * prev.batUnit : 0;
  const batKwh = newBat + prevBat;
  const racks = Math.ceil(mods / RACK);
  const panels = sys ? sys.panels : Math.max(1, Math.ceil(((pvDay * (want !== undefined ? 1.08 : 1) + evening / 0.95) / (PSH * PR)) * 1000 / PANEL_W));
  const newKwp = (panels * (sys ? sys.panelW : PANEL_W)) / 1000;
  const prevKwp = prev ? (prev.panels * prev.panelW) / 1000 : 0;
  const kwp = newKwp + prevKwp;
  const unit = sys ? sys.invKw : peak > 100 ? 125 : peak > 20 ? 50 : peak > 12 ? 20 : peak > 8 ? 12 : 8;
  const invN = sys ? sys.invN : Math.max(1, Math.ceil((peak * 1.25) / unit));
  const invBrand = sys ? sys.invName : unit >= 125 ? "Solis" : "Deye";
  const invTotal = sys ? unit * invN + (prev ? prev.invKw * prev.invN : 0) : unit * invN;
  const pvKw = sys ? Math.min(kwp, invTotal * 1.3) : kwp;
  const panelLabel = sys ? `${panels} لوح ${wattClean(sys.panelName, sys.panelW)}${prev && prevKwp > 0 ? ` + ${prev.panels} لوح ${wattClean(prev.panelName, prev.panelW)}` : ""}` : `${panels} لوح سنتك ${PANEL_W}W`;
  const newBatLabel = sys ? (newBat > 0 ? `${mods} ${sys.batKind === "cab" ? (mods > 2 && mods < 11 ? "كبائن" : "كابينة") : "بطارية"} ${kwhClean(sys.batName, sys.batUnit)}` : "بدون بطاريات") : mods === 0 ? "بدون بطاريات" : peak <= 16 ? `${mods} بطارية Pylontech ${smallBat}kWh` : `${racks} راك × ${mods} بطارية ${BAT_MOD}kWh`;
  const batLabel = prev && prevBat > 0 ? `${newBatLabel} + ${prev.batN} بطارية ${kwhClean(prev.batName, prev.batUnit)} (سابقة)` : newBatLabel;
  // منحنى الإنتاج الشمسي (جيبي من 6 إلى 18)
  const shape = Array.from({ length: 24 }, (_, h) => (h >= 6 && h < 18 ? Math.sin((Math.PI * (h + 0.5 - 6)) / 12) : 0));
  const sSum = shape.reduce((a, b) => a + b, 0);
  const pv = shape.map((s) => (pvKw * PSH * PR * s) / sSum);
  const cap = batKwh, min = cap * (1 - DOD);
  // المولد يعمل بفترة واحدة متصلة تنتهي عند شروق الشمس، بأقل عدد ساعات يكفي لعدم حدوث عجز
  let end = 6;
  while (end < 18 && pv[end]! < (kw[end] ?? 0)) end++;
  const inWin = (h: number, n: number) => n > 0 && ((h - (end - n) + 48) % 24) < n;
  const sim = (n: number) => {
    let soc = cap, unmet = 0, hrs: Hour[] = [];
    for (let pass = 0; pass < 3; pass++) {
      hrs = []; unmet = 0;
      for (let h = 0; h < 24; h++) {
        const load = kw[h] ?? 0;
        const direct = Math.min(load, pv[h]!);
        let rest = load - direct, charge = 0, batOut = 0, gen = 0;
        const surplus = pv[h]! - direct;
        if (surplus > 0) { charge = Math.min(surplus, cap - soc); soc += charge; }
        if (inWin(h, n)) {
          gen = rest;
        } else if (rest > 0) {
          batOut = Math.min(rest, Math.max(0, soc - min)); soc -= batOut; rest -= batOut;
          if (rest > 0.001) { unmet += rest; gen = rest; }
        }
        hrs.push({ h, load, pv: pv[h]!, direct, batOut, charge, gen, soc: cap > 0 ? (soc / cap) * 100 : 0 });
      }
    }
    return { hrs, unmet };
  };
  let hours: Hour[] = sim(0).hrs;
  for (let n = 0; n <= 24; n++) { const r = sim(n); hours = r.hrs; if (r.unmet <= 0.001) break; }
  const genE = hours.reduce((s, x) => s + x.gen, 0);
  const genHours = hours.filter((x) => x.gen > 0.001).length;
  const baseHours = kw.filter((v) => v > 0).length;
  const directE = hours.reduce((s, x) => s + x.direct, 0);
  const batE = hours.reduce((s, x) => s + x.batOut, 0);
  const sunH = hours.filter((x) => x.gen <= 0.001 && x.direct >= x.batOut && x.load > 0).length;
  return {
    total, peak, kwp, panels, panelLabel, batLabel, custom: !!sys, batKwh, mods, racks, invN, unit, invBrand, hours, genE, genHours, baseHours,
    sunH, batH: Math.max(0, baseHours - genHours - sunH),
    clean: total > 0 ? ((directE + batE) / total) * 100 : 0, solarPct: total > 0 ? (directE / total) * 100 : 0,
    capex: sys ? sys.capex : Math.round(kwp * PV_USD_KWP + batKwh * BAT_USD_KWH + invN * unit * INV_USD_KW),
  };
}

function econ(total: number, genE: number, capex: number, price: number) {
  const baseL = total / KWH_PER_L, newL = genE / KWH_PER_L, savedL = baseL - newL;
  const saving = savedL * 365 * price;
  return { baseL, newL, savedL, saving, months: saving > 0 ? (capex / saving) * 12 : null, net5: saving * 5 - capex, sav5: saving * 5, co2: (savedL * 365 * CO2_PER_L) / 1000, cut: baseL > 0 ? (savedL / baseL) * 100 : 0 };
}

/** منع تكرار الواط/الكيلوواط في اسم المنتج إن كان مضمناً فيه مسبقاً */
const wattClean = (name: string, w: number) => (new RegExp(`\\b${w}\\s*(w|wp|واط|وات)\\b`, "i").test(name) ? name : `${name} ${w}W`);
const kwhClean = (name: string, k: number) => (new RegExp(`\\b${k}\\s*(kwh|كيلو)`, "i").test(name) ? name : `${name} ${k}kWh`);

const R = { red: "#e60012", ink: "#14171c", sub: "#6b7280", line: "#e5e7eb", paper: "#f7f8fa", mint: "#e8f5ee", green: "#15803d" };
const LOGO = "/brand/actes-logo-report.png";

const Sec = ({ n, kicker, title, note, children }: { n: string; kicker: string; title: string; note?: string; children: React.ReactNode }) => (
  <section className="break-inside-avoid">
    <p className="text-[12px] font-black" style={{ color: R.red }}>{n} — {kicker}</p>
    <div className="mt-1 flex flex-wrap items-end justify-between gap-2">
      <h3 className="text-2xl font-black" style={{ color: R.ink }}>{title}</h3>
      {note && <p className="max-w-md text-[12px]" style={{ color: R.sub }}>{note}</p>}
    </div>
    <div className="mt-4 rounded-xl border bg-white p-4 sm:p-6" style={{ borderColor: R.line, borderTop: `5px solid ${R.red}` }}>{children}</div>
  </section>
);

const TOTAL = 4;
const DOC_NO = `ACT-FS-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}`;
const Page = ({ n, children }: { n: number; children: React.ReactNode }) => (
  <div className="report-page flex flex-col rounded-xl border shadow-sm sm:min-h-[1123px]" style={{ background: R.paper, borderColor: R.line, breakAfter: n < TOTAL ? "page" : "auto" }}>
    <div className="flex items-center justify-between gap-3 border-b bg-white px-4 py-3 sm:px-6" style={{ borderColor: R.line }}>
      <div className="flex items-center gap-3"><img src={LOGO} alt="ARSH SMART TECH" className="h-14 w-auto object-contain" /><span dir="ltr" className="hidden text-[11px] font-black tracking-wide sm:inline" style={{ color: "#4b5563" }}>ENERGY SYSTEMS & SOLUTIONS</span></div>
      <span className="rounded-md border bg-white px-3 py-1.5 text-[11px]" style={{ borderColor: R.line, color: "#4b5563" }}><i className="me-1.5 inline-block size-2 rounded-full" style={{ background: R.green }} />دراسة جدوى تنفيذية</span>
    </div>
    <div className="flex flex-1 flex-col gap-5 p-4 sm:p-5">{children}</div>
    <div className="flex items-center justify-between gap-3 border-t bg-white px-4 py-2 text-[10px] sm:px-6" style={{ borderColor: R.line, color: R.sub }}>
      <span dir="ltr" className="tabular-nums">{DOC_NO}</span>
      <span>{new Date().toLocaleDateString("ar-EG-u-nu-latn")}</span>
      <b className="tabular-nums" style={{ color: R.ink }}>صفحة {n} من {TOTAL}</b>
    </div>
  </div>
);

const Kpi = ({ t, v, s, hot }: { t: string; v: string; s?: string | undefined; hot?: boolean }) => (
  <div className="rounded-lg border bg-white p-3.5" style={{ borderColor: hot ? "#f5a3a8" : R.line }}>
    <i className="inline-block size-2 rounded-full" style={{ background: R.green }} />
    <p className="mt-2 text-[12px] font-bold" style={{ color: "#374151" }}>{t}</p>
    <p className="mt-1 text-xl font-black tabular-nums" style={{ color: R.ink }}>{v}</p>
    {s && <p className="mt-1 text-[11px]" style={{ color: R.sub }}>{s}</p>}
  </div>
);

const W = 640, H = 220, P = { t: 12, r: 10, b: 24, l: 44 };
const X = (h: number) => P.l + ((W - P.l - P.r) * h) / 24;
function Frame({ max, unit, children }: { max: number; unit: string; children: React.ReactNode }) {
  const y = (v: number) => P.t + (H - P.t - P.b) * (1 - v / max);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ direction: "ltr" }}>
      {[0, 0.25, 0.5, 0.75, 1].map((f) => (
        <g key={f}><line x1={P.l} x2={W - P.r} y1={y(max * f)} y2={y(max * f)} stroke={C.grid} strokeDasharray="3 3" />
          <text x={P.l - 4} y={y(max * f) + 3} fontSize="9" textAnchor="end" fill="#666">{nf(max * f)}{unit}</text></g>
      ))}
      {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => <text key={h} x={X(h)} y={H - 8} fontSize="9" textAnchor="middle" fill="#666">{hh(h)}</text>)}
      {children}
    </svg>
  );
}
const Legend = ({ items }: { items: [string, string][] }) => (
  <div className="mt-2 flex flex-wrap gap-3 text-[11px]">{items.map(([c, l]) => <span key={l} className="inline-flex items-center gap-1.5"><i className="inline-block size-2.5 rounded-sm" style={{ background: c }} />{l}</span>)}</div>
);

export function EcoReport({ kw, price: price0, onBuy, onEdit, onSales, system, project, target, scenarioLabel, autoDownload, onDownloaded, hideActions, results }: { results?: EcoResults | undefined; kw: number[]; price: number; system?: CustomSystem | undefined; onBuy?: (() => void) | undefined; onEdit?: (() => void) | undefined; onSales?: (() => void) | undefined; project?: string | undefined; target?: number | undefined; scenarioLabel?: string | undefined; autoDownload?: boolean | undefined; onDownloaded?: (() => void) | undefined; hideActions?: boolean | undefined }) {
  const d = useMemo(() => design(kw, system, target), [kw, system, target]);
  const e0 = econ(d.total, d.genE, d.capex, price0);
  const e1 = results ? (() => { const savedL = results.liters / 365; const newL = Math.max(0, e0.baseL - savedL); return { ...e0, savedL, newL, saving: results.saving, months: results.payback ? results.payback * 12 : null, sav5: results.saving * 5, net5: results.saving * 5 - d.capex, co2: (results.liters * CO2_PER_L) / 1000, cut: e0.baseL > 0 ? Math.min(100, (savedL / e0.baseL) * 100) : 0 }; })() : e0;
  // دمج منظومة سابقة: الاقتصاد على الوفر الإضافي للمنظومة الجديدة فقط (وفر المنظومتين − وفر السابقة)
  const prevSys = system?.prev;
  const dPrev = useMemo(() => { if (!prevSys) return null; const { prev: _p, ...rest } = prevSys; return design(kw, rest); }, [kw, prevSys]);
  const ePrev = dPrev ? econ(dPrev.total, dPrev.genE, 0, price0) : null;
  const eInc = ePrev ? { ...e1, saving: Math.max(0, e0.saving - ePrev.saving) } : e1;
  // استرداد بسيط بدون خصومات: التكلفة ÷ التوفير السنوي
  const e = { ...eInc, months: eInc.saving > 0 ? (d.capex / eInc.saving) * 12 : null, net5: eInc.saving * 5 - d.capex, sav5: eInc.saving * 5 };
  const cleanKwhY = d.total * (d.clean / 100) * 365;
  const lcoe = cleanKwhY > 0 ? d.capex / (cleanKwhY * 20) : 0;
  const roi = d.capex > 0 ? (e.saving / d.capex) * 100 : 0;
  const pb = (sv: number) => (sv > 0 ? (d.capex / sv) * 12 : null);
  const sens = [0.7, 0.85, 1, 1.15, 1.3].map((f) => { const sv = e.saving * f; return { pr: price0 * f, sv, m: f === 1 ? e.months : pb(sv), n5: sv * 5 - d.capex, cur: f === 1 }; });
  const ref = useRef<HTMLDivElement>(null);
  const offH = 24 - d.genHours;
  const yMax = (v: number) => { const m = Math.max(v, 1); const p = Math.pow(10, Math.floor(Math.log10(m))); return Math.ceil(m / p) * p; };
  const kMax = yMax(Math.max(d.peak, ...d.hours.map((x) => x.pv)));
  const yk = (v: number) => P.t + (H - P.t - P.b) * (1 - v / kMax);
  const step = (vals: number[], base: number[] = []) => vals.map((v, h) => `${h ? "L" : "M"}${X(h)},${yk(v + (base[h] ?? 0))} L${X(h + 1)},${yk(v + (base[h] ?? 0))}`).join(" ");
  const area = (top: number[], bot: number[]) => `${step(top)} L${X(24)},${yk(bot[23]!)} ${bot.map((_, i) => { const h = 23 - i; return `L${X(h + 1)},${yk(bot[h]!)} L${X(h)},${yk(bot[h]!)}`; }).join(" ")} Z`;
  const a1 = d.hours.map((x) => x.direct), a2 = d.hours.map((x) => x.direct + x.batOut), a3 = d.hours.map((x) => x.direct + x.batOut + Math.max(0, x.load - x.direct - x.batOut));
  const zero = Array(24).fill(0);
  const ys = (v: number) => P.t + (H - P.t - P.b) * (1 - v / 100);
  const noBat = d.batKwh <= 0;
  const fmtM = (m: number | null) => m === null ? "—" : `${nf(Math.round(m * 10) / 10, 1)} شهراً`;

  // صفوف مفصّلة عند دمج منظومة سابقة: جديدة / سابقة / إجمالي
  const prevKwp = prevSys ? (prevSys.panels * prevSys.panelW) / 1000 : 0;
  const newKwp = d.kwp - prevKwp;
  const prevInvKw = prevSys ? prevSys.invKw * prevSys.invN : 0;
  const prevBatKwh = prevSys ? prevSys.batUnit * prevSys.batN : 0;
  const newBatKwh = d.batKwh - prevBatKwh;
  const invTotalKw = d.invN * d.unit + prevInvKw;
  const cabWord = (n: number) => (n > 2 && n < 11 ? "كبائن" : "كابينة");
  const newPanelTxt = system ? `${d.panels} لوح ${wattClean(system.panelName, system.panelW)} — ${nf(newKwp, 2)} kWp` : d.panelLabel;
  const panelRows: string[][] = prevSys
    ? [
        ["الألواح الجديدة (المضافة)", "لا يوجد", newPanelTxt],
        ["الألواح السابقة (القائمة)", "—", `${prevSys.panels} لوح ${wattClean(prevSys.panelName, prevSys.panelW)} — ${nf(prevKwp, 2)} kWp`],
        ["إجمالي القدرة الشمسية بعد الدمج", "0 kWp", `${d.panels + prevSys.panels} لوح — ${nf(d.kwp, 2)} kWp`],
      ]
    : [["الألواح الشمسية", "لا يوجد", d.panelLabel], ["قدرة الألواح", "0 kWp", `${nf(d.kwp, 2)} kWp`]];
  const invRows: string[][] = prevSys
    ? [
        ["الإنفرترات الجديدة", "لا يوجد", `${d.invN} وحدة ${d.invBrand} × ${d.unit} kW (${nf(d.invN * d.unit)} kW)`],
        ...(prevSys.invN > 0 ? [[`الإنفرترات السابقة`, "—", `${prevSys.invN} وحدة ${prevSys.invName} × ${prevSys.invKw} kW (${nf(prevInvKw)} kW)`]] : []),
        ["إجمالي قدرة الإنفرترات", "0 kW", `${nf(invTotalKw)} kW`],
      ]
    : [["الإنفرترات", "لا يوجد", `${d.invN} وحدة ${d.invBrand} × ${d.unit} kW`]];
  const batRows: string[][] = noBat
    ? []
    : prevSys
      ? [
          ["سعة التخزين الجديدة", "لا يوجد", system ? `${system.batN} ${system.batKind === "cab" ? cabWord(system.batN) : "بطارية"} ${kwhClean(system.batName, system.batUnit)} (${nf(newBatKwh)} kWh)` : d.batLabel],
          ...(prevBatKwh > 0 ? [["سعة التخزين السابقة", "—", `${prevSys.batN} بطارية ${kwhClean(prevSys.batName, prevSys.batUnit)} (${nf(prevBatKwh)} kWh)`]] : []),
          ["إجمالي سعة التخزين بعد الدمج", "0 kWh", `${nf(d.batKwh)} kWh (${nf(d.batKwh * DOD)} kWh عند ${DOD * 100}% DoD)`],
        ]
      : [["بطاريات الليثيوم", "لا يوجد", `${d.batLabel} — ${nf(d.batKwh)} kWh (${nf(d.batKwh * DOD)} kWh عند ${DOD * 100}% DoD)`]];

  const [busy, setBusy] = useState(false);
  const download = async () => {
    const node = ref.current; if (!node || busy) return;
    setBusy(true);
    try {
      const name = (project || "ARSH SMART TECH").replace(/[\\/:*?"<>|]+/g, " ").trim();
      const title = `دراسة_الجدوى_الاقتصادية-${name}${scenarioLabel ? `-${scenarioLabel}` : ""}`;
      const heads = Array.from(document.querySelectorAll('link[rel="stylesheet"], style')).map((n) => {
        if (n instanceof HTMLLinkElement) return `<link rel="stylesheet" href="${new URL(n.href, location.href).href}">`;
        return n.outerHTML;
      }).join("");
      const css = `@page{size:A4;margin:8mm}html,body{background:#fff !important;margin:0;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        body{width:194mm}.report-page{width:194mm !important;max-width:none !important;margin:0 !important;box-shadow:none !important;break-after:page;page-break-after:always;min-height:0 !important}
        .report-page:last-child{break-after:auto;page-break-after:auto}[dir=rtl],[dir=rtl] *{font-family:Tajawal,'IBM Plex Sans Arabic',sans-serif}`;
      // الشعار كبيانات مضمّنة حتى يظهر دائماً في الطباعة
      let logoData = LOGO;
      try { const b = await (await fetch(LOGO)).blob(); logoData = await new Promise<string>((r) => { const fr = new FileReader(); fr.onload = () => r(String(fr.result)); fr.readAsDataURL(b); }); } catch { /* ignore */ }
      const body = node.outerHTML.split(`src="${LOGO}"`).join(`src="${logoData}"`);
      const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><base href="${location.origin}/"><title>${title.replace(/</g, "")}</title>${heads}<style>${css}</style></head><body dir="rtl">${body}</body></html>`;
      const frame = document.createElement("iframe");
      frame.setAttribute("style", "position:fixed;right:0;bottom:0;width:794px;height:1123px;border:0;opacity:0;pointer-events:none;z-index:-1");
      document.body.appendChild(frame);
      const doc = frame.contentDocument!; doc.open(); doc.write(html); doc.close();
      const win = frame.contentWindow!;
      await new Promise<void>((r) => { if (doc.readyState === "complete") r(); else frame.onload = () => r(); setTimeout(r, 3000); });
      try { await doc.fonts.ready; } catch { /* ignore */ }
      await Promise.all(Array.from(doc.images).map((im) => im.complete ? null : new Promise((r) => { im.onload = im.onerror = r; setTimeout(r, 3000); })));
      await new Promise((r) => setTimeout(r, 300));
      // تصغير كل صفحة لتناسب ورقة A4 واحدة بالضبط (194×281 مم ≈ 733×1062px) — قياس متكرر لأن تغيير العرض يعيد ترتيب المحتوى
      const pageH = 1035;
      doc.querySelectorAll<HTMLElement>(".report-page").forEach((p) => {
        let z = 1;
        for (let i = 0; i < 6; i++) {
          const h = p.getBoundingClientRect().height;
          if (h <= pageH) break;
          z = z * (pageH / h) * 0.98;
          p.style.setProperty("zoom", String(z));
          p.style.setProperty("width", `${194 / z}mm`, "important");
        }
        p.style.setProperty("overflow", "hidden");
        p.style.setProperty("break-inside", "avoid");
      });
      await new Promise((r) => setTimeout(r, 200));
      const prevTitle = document.title; document.title = title;
      win.focus(); win.print();
      setTimeout(() => { document.title = prevTitle; frame.remove(); }, 60000);
    } finally { setBusy(false); onDownloaded?.(); }
  };
  const started = useRef(false);
  useEffect(() => { if (autoDownload && !started.current) { started.current = true; const t = setTimeout(() => { void download(); }, 400); return () => { clearTimeout(t); started.current = false; }; } return undefined; }, [autoDownload]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-5">
      <div ref={ref} className="space-y-5" style={{ color: R.ink }}>
        <Page n={1}>
          <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
            <div>
              <h2 className="text-2xl font-extrabold leading-snug sm:text-4xl" style={{ color: R.ink }}>{project || "منظومة الطاقة الشمسية والتخزين"}</h2>
              <p className="mt-2 text-2xl font-extrabold leading-snug sm:text-4xl" style={{ color: R.red }}>دراسة الجدوى الاقتصادية</p>
              <p className="mt-4 text-sm" style={{ color: R.sub }}>دراسة فنية ومالية تنفيذية مقدمة من ARSH SMART TECH • إصدار {new Date().getFullYear()}</p>
            </div>
            <div className="rounded-xl border bg-white p-5 shadow-md lg:order-first" style={{ borderColor: R.line, borderTop: `5px solid ${R.red}` }}>
              <p className="text-[13px] font-semibold" style={{ color: "#1f2937" }}>ملخص الاستثمار</p>
              {[["الاستثمار المطلوب", d.capex], ["التوفير في 5 سنوات", e.sav5], ["صافي الوفر التراكمي", e.net5]].map(([l, v]) => (
                <div key={l as string} className="flex items-center justify-between border-b py-3.5" style={{ borderColor: R.line }}><span className="text-sm font-bold" style={{ color: "#000000" }}>{l}</span><b className="text-xl tabular-nums" style={{ color: "#000000" }}>${nf(v as number)}</b></div>
              ))}
              <p className="mt-4 rounded-md py-3 text-center text-sm font-black" style={{ background: R.mint, color: R.green }}>خفض فاتورة الديزل الحالية بنسبة {nf(e.cut, 1)}%</p>
            </div>
          </div>

        <Sec n="01" kicker="لوحة المؤشرات" title="الأثر التنفيذي" note="المؤشرات الأساسية للمنظومة، محسوبة على أساس التشغيل السنوي الكامل.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Kpi hot t="إجمالي القدرة الشمسية" v={`${nf(d.kwp, 2)} kWp`} s={d.panelLabel} />
            {noBat ? <Kpi t="توفير الديزل" v={`${nf(e.savedL * 365)} لتر/سنة`} s={`≈ ${nf(e.savedL)} لتر/يوم`} /> : <Kpi t="سعة التخزين المركبة" v={`${nf(d.batKwh)} kWh`} s={d.batLabel} />}
            <Kpi t="التكلفة الاستثمارية" v={`${nf(d.capex)} $`} s="CAPEX" />
            <Kpi hot t="التوفير المالي السنوي" v={`${nf(e.saving)} $`} s={`عند ${nf(price0, 3)} $/L`} />
            <Kpi hot t="فترة الاسترداد" v={fmtM(e.months)} s={undefined} />
            <Kpi t="صافي التوفير خلال 5 سنوات" v={`${nf(e.net5)} $`} s="توفير تراكمي" />
            <Kpi t="إيقاف المولد" v={`${offH} ساعة/يوم`} s={`${nf(offH * 365)} ساعة سنوياً`} />
            <Kpi t="التغطية النظيفة" v={`${nf(d.clean)} %`} s={`من حمل يومي ${nf(d.total)} kWh`} />
          </div>
        </Sec>
        <Sec n="01-ب" kicker="تحليل الحساسية" title="أثر تغيّر سعر الديزل على الجدوى" note="مصفوفة السيناريوهات عند أسعار ديزل مختلفة بنفس المنظومة والحمل.">
          <table className="w-full text-xs">
            <thead><tr className="bg-navy text-primary-foreground"><th className="p-2 text-right">سعر اللتر</th><th className="p-2 text-right">التوفير السنوي</th><th className="p-2 text-right">فترة الاسترداد</th><th className="p-2 text-right">صافي 5 سنوات</th></tr></thead>
            <tbody>{sens.map((r) => (
              <tr key={r.pr} className="border-b border-border" style={r.cur ? { background: R.mint, fontWeight: 900 } : undefined}><td className="p-2 tabular-nums">${nf(r.pr, 3)}{r.cur ? " (الحالي)" : ""}</td><td className="p-2 tabular-nums">${nf(r.sv)}</td><td className="p-2">{fmtM(r.m)}</td><td className="p-2 tabular-nums">${nf(r.n5)}</td></tr>
            ))}</tbody>
          </table>
        </Sec>
        </Page>
        <Page n={2}>

        <Sec n="02" kicker="المقارنة" title="الوضع بدون منظومة مقابل المنظومة المقترحة" note="مقارنة تفصيلية بين التشغيل على المولدات فقط والمنظومة الهجينة المقترحة.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-xs">
              <thead><tr className="bg-navy text-primary-foreground"><th className="p-2 text-right">بند المقارنة</th><th className="p-2 text-right">بدون منظومة</th><th className="p-2 text-right">المنظومة المقترحة (Solar + BESS)</th></tr></thead>
              <tbody>
                {([
                  ["نوع المنظومة", "مولدات ديزل فقط", noBat ? "منظومة شمسية On-Grid بدون بطاريات" : prevSys ? "منظومة هجينة متكاملة Solar + BESS (جديدة + قائمة مدمجة)" : "منظومة هجينة متكاملة Solar + BESS"],
                  ...panelRows,
                  ...invRows,
                  ...batRows,
                  ...(d.custom || noBat || prevSys ? [] : [["راكات التخزين", "لا يوجد", `${d.racks} راك`]]),
                  ["ساعات تشغيل المولد", `${d.baseHours} ساعة/يوم`, `${d.genHours} ساعة/يوم`],
                  ["استهلاك الديزل اليومي", `${nf(e.baseL)} لتر`, `${nf(e.newL)} لتر/يوم`],
                  ["استهلاك الديزل السنوي", `${nf(e.baseL * 365)} لتر`, `${nf(e.newL * 365)} لتر (توفير ${nf(e.savedL * 365)} لتر)`],
                  ["التكلفة التشغيلية السنوية", `$${nf(e.baseL * 365 * price0)}`, `$${nf(e.newL * 365 * price0)} (توفير $${nf(e.saving)})`],
                  ...(prevSys && ePrev ? [["الوفر السنوي الإضافي من المنظومة الجديدة", "—", `$${nf(e.saving)} (بعد خصم وفر المنظومة السابقة $${nf(ePrev.saving)})`]] : []),
                  ["نسبة التغطية النظيفة", "0%", `${nf(d.clean)}% (${nf(d.solarPct)}% شمس + ${nf(d.clean - d.solarPct)}% بطاريات)`],
                  ["الاستثمار المطلوب", "$0", `$${nf(d.capex)} — استرداد خلال ${fmtM(e.months)}${prevSys ? " (المنظومة الجديدة فقط)" : ""}`],
                ] as string[][]).map(([a, b, c], i) => (
                  <tr key={a} className={i % 2 ? "bg-muted/40" : ""}><td className="p-2 font-bold">{a}</td><td className="p-2 text-muted-foreground">{b}</td><td className="p-2 font-bold text-navy">{c}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </Sec>

        <Sec n="02-ب" kicker="ملف الأحمال" title="متوسط الأحمال بالساعة" note={`إجمالي ${nf(d.total, 1)} kWh/يوم • الذروة ${nf(d.peak, 1)} kW • المتوسط ${nf(d.total / 24, 1)} kW`}>
          <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-8">
            {kw.map((v, h) => (
              <div key={h} className="rounded-md border px-1 py-1.5 text-center" style={{ borderColor: R.line, background: v === d.peak && v > 0 ? "#fde8ea" : "#fff" }}>
                <p dir="ltr" className="text-[10px] tabular-nums" style={{ color: R.sub }}>{hh(h)}–{hh(h + 1)}</p>
                <p className="text-[13px] font-black tabular-nums" style={{ color: R.ink }}>{nf(v, 1)} <span className="text-[9px] font-normal">kW</span></p>
              </div>
            ))}
          </div>
        </Sec>


        <Sec n="03" kicker="المواصفات الفنية" title="مواصفات المعدات المقترحة" note="المواصفات العامة لفئة المعدات المعتمدة؛ تُثبَّت الموديلات النهائية في عرض السعر.">
          <table className="w-full text-xs">
            <thead><tr className="bg-navy text-primary-foreground"><th className="p-2 text-right">المكوّن</th><th className="p-2 text-right">الكمية / القدرة</th><th className="p-2 text-right">المواصفة الفنية</th></tr></thead>
            <tbody>{([
              [prevSys ? "الألواح الشمسية الجديدة" : "الألواح الشمسية", prevSys ? newPanelTxt : `${d.panelLabel} — ${nf(d.kwp, 2)} kWp`, d.panels > 0 && d.kwp * 1000 / d.panels >= 700 ? "Suntech STP720S-D66/Nsh+ — N-Type TOPCon ثنائي الوجه زجاج/زجاج، كفاءة 23.2%، معامل حرارة -0.29%/°C، 2384×1303×33 مم، 37.3 كغ، ضمان 15 سنة منتج و30 سنة أداء (تدهور 0.40%/سنة)" : d.panels > 0 && Math.abs(d.kwp * 1000 / d.panels - 590) <= 10 ? "Suntech STP595S-C72/Nsh+ — N-Type TOPCon ثنائي الوجه، كفاءة حتى 23.2%، 2278×1134×30 مم، 32 كغ، ضمان 15 سنة منتج و30 سنة أداء" : "خلايا أحادية البلورة عالية الكفاءة، مقاومة للحرارة والغبار، ضمان أداء طويل الأمد"],
              [prevSys ? "الإنفرترات الهجينة الجديدة" : "الإنفرترات الهجينة", `${d.invN} × ${d.invBrand} ${d.unit} kW`, "تحويل نقي (Pure Sine)، متتبع MPPT متعدد، حماية من الغبار والرطوبة، مراقبة عن بعد"],
              ...(noBat ? [] : [[prevSys ? "سعة التخزين الجديدة" : "بطاريات الليثيوم", prevSys && system ? `${system.batN} ${system.batKind === "cab" ? cabWord(system.batN) : "بطارية"} ${kwhClean(system.batName, system.batUnit)} — ${nf(newBatKwh)} kWh` : `${d.batLabel} — ${nf(d.batKwh)} kWh`, `كيمياء LiFePO4 آمنة، عمق تفريغ ${DOD * 100}%، نظام إدارة بطاريات BMS ذكي`]]),
              ...(prevSys ? [
                ["الألواح السابقة (قائمة)", `${prevSys.panels} لوح ${wattClean(prevSys.panelName, prevSys.panelW)} — ${nf(prevKwp, 2)} kWp`, "منظومة قائمة مدمجة — تدخل في الإنتاج والتغطية فقط ولا تدخل في الاستثمار"],
                ...(prevSys.invN > 0 ? [["الإنفرترات السابقة (قائمة)", `${prevSys.invN} × ${prevSys.invName} ${prevSys.invKw} kW`, "منظومة قائمة مدمجة"]] : []),
                ...(prevBatKwh > 0 ? [["التخزين السابق (قائم)", `${prevSys.batN} × ${kwhClean(prevSys.batName, prevSys.batUnit)}`, "منظومة قائمة مدمجة"]] : []),
                ["الإجمالي بعد الدمج", `${nf(d.kwp, 2)} kWp • ${nf(invTotalKw)} kW إنفرترات${noBat ? "" : ` • ${nf(d.batKwh)} kWh تخزين`}`, "إجمالي قدرات المنظومتين معاً"],
              ] : []),
              ["كابلات DC/AC", "حسب التصميم الهندسي", "كابلات شمسية مقاومة للأشعة فوق البنفسجية، مقاطع محسوبة لفاقد جهد أقل من 2%"],
              ["الحمايات", "لوحات DC و AC", "قواطع وفيوزات DC، مانعات صواعق SPD، تأريض كامل للمنظومة"],
              ["الهياكل", "هياكل تثبيت", "حديد مجلفن أو ألمنيوم مقاوم للصدأ وبزاوية ميل مثالية"],
            ] as string[][]).map(([a, b, c], i) => <tr key={a} className={i % 2 ? "bg-muted/40" : ""}><td className="p-2 font-bold">{a}</td><td className="p-2 text-navy">{b}</td><td className="p-2 text-muted-foreground">{c}</td></tr>)}</tbody>
          </table>
          {(() => {
            const w = d.panels > 0 ? (d.kwp * 1000) / d.panels : 0;
            // أبعاد وأوزان رسمية من ورقة مواصفات Suntech؛ غير ذلك تقدير بالكفاءة
            const spec = w >= 700 ? { a: 2.384 * 1.303, kg: 37.3 } : w >= 580 && w <= 600 ? { a: 2.278 * 1.134, kg: 32.0 } : { a: w / 232, kg: w / 19 };
            const m2 = d.panels * spec.a;
            const kg = d.panels * spec.kg;
            return (
              <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-4">
                {[["مساحة الألواح الصافية", `${nf(m2)} م²`], ["مساحة السطح المطلوبة", `≈ ${nf(m2 * 1.5)} م²`], ["وزن الألواح", `≈ ${nf(kg / 1000, 1)} طن`], ["الحمل على السطح", `≈ ${nf((kg * 1.25) / (m2 || 1), 1)} كغ/م²`]].map(([a, b]) => (
                  <div key={a} className="rounded-md border p-2" style={{ borderColor: R.line }}><p className="text-[10px] text-muted-foreground">{a}</p><b className="tabular-nums text-navy">{b}</b></div>
                ))}
              </div>
            );
          })()}
        </Sec>
        </Page>
        <Page n={3}>
        {results && <Sec n="04" kicker="النتائج" title="نتائج الجدوى الاقتصادية">
          <table className="w-full text-xs"><tbody>{([
            ["الإنتاج اليومي المتوقع", `${nf(results.dailyKwh, 1)} kWh`], ["الإنتاج السنوي", `${nf(results.yearKwh)} kWh`],
            ...(results.loadDay ? [["الحمل اليومي", `${nf(results.loadDay, 1)} kWh`], ["نسبة تغطية الحمل", `${results.coverage ?? 0}%`]] : []),
            ["الديزل الموفّر سنوياً", `${nf(results.liters)} لتر`], ["التوفير السنوي", `${nf(results.saving)} $`],
            ["فترة الاسترداد", fmtM(e.months)], [`صافي الربح خلال ${results.years} سنة`, `${nf(results.cum)} $`],
            ["العائد على الاستثمار", `${results.roi}%`], ["تكلفة الواط", results.wattCost],
          ] as [string, string][]).map(([a, b]) => <tr key={a} className="border-b border-border"><td className="p-2">{a}</td><td className="p-2 font-bold tabular-nums text-navy">{b}</td></tr>)}</tbody></table>
          <div className="mt-3 grid grid-cols-5 gap-1 text-center text-[10px]">{results.rows.filter((r) => r.y % 5 === 0 || r.y <= 5).map((r) => (
            <div key={r.y} className="rounded p-1" style={{ background: r.cum >= 0 ? R.mint : "#f1f2f4" }}>سنة {r.y}<br /><b className="tabular-nums">{nf(r.cum)}</b></div>
          ))}</div>
        </Sec>}

        <Sec n="05" kicker="ساعات التغطية" title="كم تكفي المنظومة نهاراً وليلاً؟">
          <div className="grid gap-4 lg:grid-cols-2">
            <table className="w-full text-xs">
              <tbody>{[
                ["ساعات التغطية النهارية (شمس مباشرة)", `${d.sunH} ساعات — ${nf(d.kwp, 1)} kWp`],
                ...(noBat ? [] : [["ساعات التغطية الليلية (تفريغ البطاريات)", `${d.batH} ساعات — ${nf(d.batKwh * DOD)} kWh صافي`]]),
                ["ساعات الاستغناء التام عن المولد", `${offH} ساعة/يوم`],
                ["ساعات تشغيل المولد المتبقية", `${d.genHours} ساعات/يوم`],
                ["نسبة الاستغناء عن المولد من اليوم", `${nf((offH / 24) * 100, 1)}%`],
                ["ساعات إراحة المولد سنوياً", `${nf(offH * 365)} ساعة/سنة`],
              ].map(([a, b]) => <tr key={a} className="border-b border-border"><td className="p-2">{a}</td><td className="p-2 font-bold text-navy">{b}</td></tr>)}</tbody>
            </table>
            <div>
              <p className="text-xs font-black">توزيع ساعات اليوم حسب المصدر</p>
              {[["بدون منظومة", 0, 0, d.baseHours], ["المنظومة المقترحة", d.sunH, d.batH, d.genHours]].map(([l, s, b, g]) => (
                <div key={l as string} className="mt-3">
                  <p className="mb-1 text-[11px] font-bold">{l}</p>
                  <div className="flex h-7 overflow-hidden rounded text-[10px] font-bold text-primary-foreground">
                    {[[s, C.sun], [b, C.bat], [g, C.gen]].map(([v, c], i) => (v as number) > 0 && <div key={i} style={{ width: `${((v as number) / 24) * 100}%`, background: c as string }} className="grid place-items-center">{v as number}h</div>)}
                  </div>
                </div>
              ))}
              <Legend items={[[C.sun, "شمس نهاراً"], ...(noBat ? [] : [[C.bat, "بطاريات ليلاً"] as [string, string]]), [C.gen, "تشغيل المولد"]]} />
            </div>
          </div>
        </Sec>

        <Sec n="06" kicker="التدفق النقدي" title="التدفق النقدي التراكمي ولحظة استرداد رأس المال" note={`نقطة التعادل بعد ${fmtM(e.months)} • توفير ثابت بدون خصومات صيانة أو تدهور`}>
          {(() => {
            const N = 10; const cf: number[] = [-d.capex];
            for (let y = 1; y <= N; y++) cf.push(cf[y - 1]! + e1.saving);
            const W = 720, Hc = 220, pl = 64, pr = 12, pt = 14, pb = 26;
            const mx = Math.max(...cf, 1), mn = Math.min(...cf, 0);
            const xs = (i: number) => pl + ((W - pl - pr) / (N + 1)) * (i + 0.5);
            const ysc = (v: number) => pt + (Hc - pt - pb) * ((mx - v) / (mx - mn));
            const bw = ((W - pl - pr) / (N + 1)) * 0.6;
            const be = e.months !== null && e.months / 12 <= N ? e.months / 12 : null;
            const ticks = [mn, mn / 2, 0, mx / 2, mx];
            return (
              <svg viewBox={`0 0 ${W} ${Hc}`} className="w-full" style={{ direction: "ltr" }}>
                {ticks.map((t, i) => <g key={i}><line x1={pl} x2={W - pr} y1={ysc(t)} y2={ysc(t)} stroke="#e5e7eb" /><text x={pl - 6} y={ysc(t) + 3} fontSize="9" textAnchor="end" fill="#666">{`${nf(t / 1000)}k $`}</text></g>)}
                <line x1={pl} x2={W - pr} y1={ysc(0)} y2={ysc(0)} stroke="#111" strokeWidth="1.2" />
                {cf.map((v, i) => <g key={i}>
                  <rect x={xs(i) - bw / 2} width={bw} y={Math.min(ysc(v), ysc(0))} height={Math.max(1, Math.abs(ysc(v) - ysc(0)))} fill={v >= 0 ? C.bat : R.red} rx="2" />
                  <text x={xs(i)} y={Hc - 10} fontSize="9" textAnchor="middle" fill="#666">{i}</text>
                </g>)}
                <polyline fill="none" stroke="#111" strokeWidth="1.5" points={cf.map((v, i) => `${xs(i)},${ysc(v)}`).join(" ")} />
                {be !== null && <g>
                  <line x1={xs(be)} x2={xs(be)} y1={pt} y2={Hc - pb} stroke={R.green} strokeDasharray="4 3" strokeWidth="1.5" />
                  <circle cx={xs(be)} cy={ysc(0)} r="4" fill={R.green} />
                  <text x={xs(be) + 6} y={pt + 10} fontSize="10" fontWeight="700" fill={R.green}>{`Payback ${nf(e.months!, 1)} mo`}</text>
                </g>}
                <text x={(W + pl) / 2} y={Hc - 1} fontSize="9" textAnchor="middle" fill="#666">Year</text>
              </svg>
            );
          })()}
          <Legend items={[[R.red, "رأس مال غير مسترد"], [C.bat, "أرباح صافية بعد الاسترداد"], [R.green, "لحظة استرداد رأس المال"]]} />
        </Sec>

        <Sec n="06-ب" kicker="البيئة والمعايير" title="الأثر البيئي والمطابقة الهندسية">
          <div className="grid gap-4 sm:grid-cols-2">
            <table className="w-full text-xs"><tbody>{[
              ["خفض انبعاثات CO₂ سنوياً", `${nf(e.co2)} طن`],
              ["خفض الانبعاثات خلال 25 سنة", `${nf(e.co2 * 25)} طن`],
              ["مكافئ براميل النفط الموفّرة سنوياً", `${nf((e.savedL * 365) / 159)} برميل`],
              ["خفض تقديري لعمرات وزيوت وفلاتر المولد", `${nf(Math.max(0, Math.min(100, (1 - d.genHours / Math.max(d.baseHours, 1)) * 100)))}%`],
            ].map(([a, b]) => <tr key={a} className="border-b border-border"><td className="p-2">{a}</td><td className="p-2 font-bold text-navy">{b}</td></tr>)}</tbody></table>
            <table className="w-full text-xs"><tbody>{[
              ["الألواح الشمسية", "IEC 61215 / IEC 61730"],
              ["الإنفرترات", "IEC 62109 / IEC 62116"],
              ["بطاريات الليثيوم", "IEC 62619 / UN38.3"],
              ["الكابلات والحمايات", "IEC 62930 / IEC 61643"],
              ["مراقبة الأداء", "IEC 61724"],
            ].map(([a, b]) => <tr key={a} className="border-b border-border"><td className="p-2">{a}</td><td dir="ltr" className="p-2 text-right font-bold text-navy">{b}</td></tr>)}</tbody></table>
          </div>
        </Sec>
        </Page>
        <Page n={4}>
        <Sec n="07" kicker="تغطية الأحمال" title="تغطية الحمل على مدار 24 ساعة" note={`طاقة نظيفة ${nf(d.clean)}% • المولد ${d.genHours} ساعة/يوم`}>
          <Frame max={kMax} unit="">
            <path d={area(a3, a2)} fill={C.gen} opacity={0.75} />
            <path d={area(a2, a1)} fill={C.bat} opacity={0.8} />
            <path d={area(a1, zero)} fill={C.sun} opacity={0.85} />
            <path d={step(d.hours.map((x) => x.load))} fill="none" stroke={C.load} strokeWidth={1.8} />
          </Frame>
          <Legend items={[[C.sun, "شمس مباشرة"], ...(noBat ? [] : [[C.bat, "البطاريات"] as [string, string]]), [C.gen, "المولد"], [C.load, "الحمل (kW)"]]} />
        </Sec>
        <div className={noBat ? "" : "grid gap-5 lg:grid-cols-2"}>
        {!noBat && <Sec n="08" kicker="أداء البطاريات" title="حالة شحن البطاريات" note="منحنى شحن وتفريغ البطاريات خلال 24 ساعة.">
          <div>
            <div>
              <p className="text-xs font-black">حالة شحن البطاريات — 24 ساعة</p>
              <p className="text-[10px] text-muted-foreground">الحد الأدنى الآمن 10% وفق عمق تفريغ 90% • السعة القابلة للاستخدام {nf(d.batKwh * DOD)} kWh</p>
              <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ direction: "ltr" }}>
                {[0, 25, 50, 75, 100].map((v) => <g key={v}><line x1={P.l} x2={W - P.r} y1={ys(v)} y2={ys(v)} stroke={C.grid} strokeDasharray="3 3" /><text x={P.l - 4} y={ys(v) + 3} fontSize="9" textAnchor="end" fill="#666">{v}%</text></g>)}
                {[0, 4, 8, 12, 16, 20].map((h) => <text key={h} x={X(h)} y={H - 8} fontSize="9" textAnchor="middle" fill="#666">{hh(h)}</text>)}
                <path d={`M${X(0)},${ys(d.hours[23]!.soc)} ${d.hours.map((x) => `L${X(x.h + 1)},${ys(x.soc)}`).join(" ")} L${X(24)},${ys(0)} L${X(0)},${ys(0)} Z`} fill={C.bat} opacity={0.15} />
                <path d={`M${X(0)},${ys(d.hours[23]!.soc)} ${d.hours.map((x) => `L${X(x.h + 1)},${ys(x.soc)}`).join(" ")}`} fill="none" stroke={C.bat} strokeWidth={2.2} />
                <line x1={P.l} x2={W - P.r} y1={ys(10)} y2={ys(10)} stroke={C.gen} strokeDasharray="5 3" />
                <text x={W - P.r - 4} y={ys(10) - 4} fontSize="9" textAnchor="end" fill={C.gen}>10%</text>
              </svg>
            </div>
          </div>
        </Sec>}
        <Sec n={noBat ? "08" : "09"} kicker="الإنتاج الشمسي" title="الإنتاج الشمسي مقابل الحمل">
          <div>
              <p className="text-[11px] text-muted-foreground">المساحة الخضراء تمثل الفائض الشمسي المستخدم في شحن البطاريات • ذروة الإنتاج {nf(Math.max(...d.hours.map((x) => x.pv)))} / ذروة الحمل {nf(d.peak)} kW</p>
              <Frame max={kMax} unit="">
                <path d={area(d.hours.map((x) => x.pv), d.hours.map((x) => Math.min(x.pv, x.load)))} fill={C.bat} opacity={0.35} />
                <path d={step(d.hours.map((x) => x.pv))} fill="none" stroke={C.sun} strokeWidth={2} />
                <path d={step(d.hours.map((x) => x.load))} fill="none" stroke={C.load} strokeWidth={2} />
              </Frame>
              <Legend items={[[C.sun, "الإنتاج الشمسي"], [C.load, "حمل المنشأة"], [C.bat, "فائض للشحن"]]} />
          </div>
        </Sec>
        </div>
        <footer className="flex flex-wrap items-center justify-between gap-3 rounded-xl px-5 py-4" style={{ background: R.ink }}>
          <div className="flex items-center gap-3"><span className="rounded bg-white px-2 py-1"><img src={LOGO} alt="ARSH SMART TECH" className="h-12 w-auto" /></span><b dir="ltr" className="text-sm" style={{ color: "#fff" }}>ARSH SMART TECH Energy Systems & Solutions</b></div>
          <span className="text-[12px]" style={{ color: "#9ca3af" }}>من إعداد شركة عرش التقنية الذكية</span>
        </footer>
        </Page>
      </div>

      {!hideActions && <div className="flex flex-wrap gap-2" data-noprint>
        <button type="button" onClick={() => void download()} disabled={busy} className="inline-flex items-center gap-2 rounded-md bg-navy px-5 py-3 text-sm font-black text-primary-foreground disabled:opacity-60"><Download className="size-4" /> {busy ? "جارٍ التجهيز..." : "حفظ التقرير PDF (عالي الدقة)"}</button>
        {onBuy && <button type="button" onClick={onBuy} className="inline-flex items-center gap-2 rounded-md border border-border bg-card text-foreground hover:border-energy px-5 py-3 text-sm font-black transition"><ShoppingCart className="size-4 text-energy" />متابعة الشراء</button>}
        {onEdit && <button type="button" onClick={onEdit} className="rounded-md border border-border px-4 py-2 text-xs font-bold">رجوع</button>}
        {onSales && <button type="button" onClick={onSales} className="rounded-md border border-border px-4 py-2 text-xs font-bold">تواصل مع فريق عرش التقنية الذكية</button>}
      </div>}
    </div>
  );
}

/** ملخص سريع لسيناريو بنسبة تغطية مستهدفة — يُستخدم في بطاقات السيناريوهات. */
export function ecoSummary(kw: number[], price: number, target: number) {
  const d = design(kw, undefined, target);
  const e = econ(d.total, d.genE, d.capex, price);
  return { kwp: d.kwp, panelLabel: d.panelLabel, batKwh: d.batKwh, batLabel: d.batLabel, inv: `${d.invN} × ${d.invBrand} ${d.unit} kW`, invKw: d.unit * d.invN, capex: d.capex, saving: e.saving, months: e.months, cut: e.cut, savedL: e.savedL * 365, offH: 24 - d.genHours, peak: d.peak, total: d.total };
}

/** نفس محاكاة التقرير لمنظومة جاهزة — حتى تطابق شاشة النتائج التقرير حرفياً. عند تمرير prev تُحسب الأرقام الاقتصادية على الوفر الإضافي للمنظومة الجديدة فقط. */
export function ecoSystemSummary(kw: number[], price: number, sys: CustomSystem, prev?: CustomSystem) {
  const d = design(kw, prev ? { ...sys, prev } : sys);
  const e = econ(d.total, d.genE, d.capex, price);
  if (!prev) return { total: d.total, clean: d.clean, savedL: e.savedL * 365, saving: e.saving, months: e.months, net5: e.net5, cut: e.cut };
  const dp = design(kw, prev);
  const ep = econ(dp.total, dp.genE, 0, price);
  const saving = Math.max(0, e.saving - ep.saving);
  return { total: d.total, clean: d.clean, savedL: e.savedL * 365, saving, months: saving > 0 ? (d.capex / saving) * 12 : null, net5: saving * 5 - d.capex, cut: e.cut, prevSaving: ep.saving, prevSavedL: ep.savedL * 365 };
}
