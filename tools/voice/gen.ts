// يولّد الأصوات العربية الجاهزة في public/audio لتعمل بدون إنترنت.
import { PHRASES, STEP_INTROS, voiceTextFor } from "@/lib/voice-guide";
import { applyWaqf, diacritizeNumberWords } from "@/lib/ar-lexicon";
import { existsSync, writeFileSync, readdirSync } from "node:fs";
import { execFileSync } from "node:child_process";
const INSTR = "اقرأ النص العربي التالي بالفصحى بأسلوب معلق مؤسسي راقٍ لكبرى شركات الطاقة العالمية، نبرة رجالية دافئة ورخيمة وواثقة، فصاحة متقنة ومخارج حروف واضحة ومريحة للأذن. التزم بالتشكيل المكتوب على كل حرف حرفياً. قف على أواخر الكلمات بالسكون قبل علامات الترقيم وفي نهاية الجملة، ولا تُشبع الحركة الأخيرة أبداً. لا تترجم ولا تضف أي كلام:";
const out = "public/audio";
const sources = [...Object.values(PHRASES), ...Object.values(STEP_INTROS)];
const jobs = new Map<string, string>();
for (const s of sources) { const { text, key } = voiceTextFor(s, "ar"); if (text) jobs.set(key, text); }
let i = 0;
async function one(key: string, text: string) {
  if (existsSync(`${out}/${key}.mp3`)) return;
  const t = applyWaqf(diacritizeNumberWords(text));
  const r = await fetch("https://ai.gateway.lovable.dev/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "google/gemini-3.1-flash-tts-preview", contents: [{ role: "user", parts: [{ text: `${INSTR} ${t}` }] }],
      generationConfig: { responseModalities: ["AUDIO"], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: "Enceladus" } } } }, stream_format: "audio" }),
  });
  if (!r.ok) { console.log("fail", key, r.status, (await r.text()).slice(0, 120)); return; }
  const raw = `/tmp/${key}.bin`; writeFileSync(raw, Buffer.from(await r.arrayBuffer()));
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", raw, "-ac", "1", "-b:a", "64k", `${out}/${key}.mp3`]);
  console.log(++i, key);
}
const list = [...jobs];
for (let k = 0; k < list.length; k += 1) { await new Promise((r) => setTimeout(r, 4000)); await Promise.all(list.slice(k, k + 1).map(([a, b]) => one(a, b))); }
const have = readdirSync(out).filter((f) => f.endsWith(".mp3")).map((f) => f.replace(/\.mp3$/, ""));
writeFileSync(`${out}/index.json`, JSON.stringify(have));
console.log("total", jobs.size, "have", have.length);
