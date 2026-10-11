// قراءة تقارير قياس الأحمال (PDF) — جدول 24 ساعة لكل يوم، العمود الإجمالي هو آخر عمود رقمي (أقصى اليسار).
export type LoadDay = { date: string; hours: number[] };
export type LoadPdf = { client: string; days: LoadDay[] };

type Item = { str: string; x: number; y: number };
const clean = (s: string) => s.replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "").trim();
const TIME = /^(\d{1,2}):\d{2}\s*(AM|PM)$/i;
const DATE = /(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})/;
const NUM = /^-?\d+(\.\d+)?$/;

/** pdfjs يُمرَّر من الخارج ليعمل في المتصفح والاختبارات معاً. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function parseLoadPdf(data: ArrayBuffer, pdfjs: any): Promise<LoadPdf> {
  const doc = await pdfjs.getDocument({ data: new Uint8Array(data), disableFontFace: true }).promise;
  let client = "";
  const days: LoadDay[] = [];
  let current: LoadDay | null = null;
  let lastDate = "";
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const tc = await page.getTextContent();
    const items: Item[] = tc.items
      .filter((i: { str?: string }) => typeof i.str === "string")
      .map((i: { str: string; transform: number[] }) => ({ str: clean(i.str), x: i.transform[4], y: i.transform[5] }))
      .filter((i: Item) => i.str);
    // تجميع الصفوف حسب الإحداثي الرأسي
    const rows: Item[][] = [];
    for (const it of items.sort((a, b) => b.y - a.y)) {
      const r = rows.find((row) => Math.abs(row[0]!.y - it.y) < 3);
      if (r) r.push(it); else rows.push([it]);
    }
    // نص كل صف: الأرقام من اليسار لليمين، والعربي من اليمين لليسار (المقاطع مجزأة في ملفات PDF)
    const ltr = rows.map((r) => [...r].sort((a, b) => a.x - b.x).map((i) => i.str).join(""));
    const rtl = rows.map((r) => [...r].sort((a, b) => b.x - a.x).map((i) => i.str).join(""));
    const dm = ltr.map((t) => t.match(DATE)).find(Boolean);
    if (!client) { const c = rtl.find((t) => t.includes("العميل")); if (c) client = c.split(/العميل\s*:?/)[1]?.trim().replace("للبالستيك", "للبلاستيك") ?? ""; }
    const hourly: [number, number][] = [];
    for (const row of rows) {
      const t = row.map((i) => i.str.match(TIME)).find(Boolean);
      if (!t) continue;
      let h = Number(t[1]) % 12; if (/pm/i.test(t[2] ?? "")) h += 12;
      const nums = row.filter((i) => NUM.test(i.str)).sort((a, b) => a.x - b.x);
      if (!nums.length) continue;
      hourly.push([h, Number(nums[0]!.str)]);
    }
    if (hourly.length < 12) continue;
    const date = dm ? `${(dm[1] ?? "").padStart(2, "0")}/${(dm[2] ?? "").padStart(2, "0")}/${dm[3]}` : `يوم ${days.length + 1}`;
    if (!current || date !== lastDate) { current = { date, hours: Array(24).fill(0) }; days.push(current); lastDate = date; }
    for (const [h, v] of hourly) current.hours[h] = v;
  }
  return { client, days };
}

/** متوسط الساعات عبر الأيام المختارة؛ يمكن تجاهل الساعات الصفرية (توقف جهاز القياس). */
export function averageDays(days: LoadDay[], skipZero: boolean): number[] {
  return Array.from({ length: 24 }, (_, h) => {
    const vals = days.map((d) => d.hours[h] ?? 0).filter((v) => !skipZero || v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  });
}
