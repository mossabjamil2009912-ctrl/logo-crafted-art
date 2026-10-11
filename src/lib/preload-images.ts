// تحميل مسبق فوري للصور الخفيفة المستخدمة في الشاشات الأولى،
// حتى تظهر بطاقات نوع المشروع وبطاقات الخدمات بصورها بلا أي انتظار.
import residentialImage from "@/assets/arsh-residential.webp";
import commercialImage from "@/assets/arsh-commercial.webp";
import industrialImage from "@/assets/arsh-industrial.webp";
import agricultureImage from "@/assets/arsh-agriculture.webp";
import cardQuote from "@/assets/card-quote.webp";
import cardEnergy from "@/assets/card-energy.webp";
import cardSupport from "@/assets/card-support.webp";
import cardProducts from "@/assets/card-products.webp";
import actesLogo from "@/assets/actes-logo-full.webp";
import homeHero from "@/assets/actes-home-hero.webp";
import partnersStrip from "@/assets/partners-strip.webp";

// الترتيب بالأولوية: صورة الغلاف وشريط الوكلاء أولاً، ثم صور شاشة نوع المشروع وبطاقات الشاشة الرئيسية.
const IMAGES = [
  homeHero,
  partnersStrip,
  residentialImage,
  commercialImage,
  industrialImage,
  agricultureImage,
  cardQuote,
  cardEnergy,
  cardSupport,
  cardProducts,
  actesLogo,
];

let done = false;

/** يحمّل الصور في ذاكرة المتصفح مرة واحدة فور بدء التطبيق. */
export function preloadAppImages() {
  if (done || typeof window === "undefined") return;
  done = true;
  for (const src of IMAGES) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
    void img.decode?.().catch(() => {});
  }
}
