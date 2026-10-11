import { useState, type FormEvent } from "react";
import { ExternalLink, Headphones, Mail, ShieldCheck } from "lucide-react";

const input = "w-full rounded border border-border bg-background px-2.5 py-1.5 text-sm";

function mailto(to: string, subject: string, fields: Record<string, string>) {
  const body = Object.entries(fields).map(([k, v]) => `${k}: ${v}`).join("\n");
  window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function Form({ fields, to, subject, submit }: { fields: { k: string; l: string; type?: string; options?: string[] }[]; to: string; subject: string; submit: string }) {
  const [sent, setSent] = useState(false);
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    mailto(to, subject, Object.fromEntries(fields.map((f) => [f.l, String(fd.get(f.k) ?? "")])));
    setSent(true);
  };
  return (
    <form onSubmit={onSubmit} className="grid grid-cols-2 gap-2">
      {fields.map((f) => (
        <label key={f.k} className="text-xs text-muted-foreground">
          {f.l}
          {f.options ? (
            <select name={f.k} required className={input}><option value="">اختر</option>{f.options.map((o) => <option key={o}>{o}</option>)}</select>
          ) : (
            <input name={f.k} type={f.type ?? "text"} required className={input} />
          )}
        </label>
      ))}
      <button type="submit" className="col-span-2 mt-1 rounded bg-[#00a5b0] py-2 text-sm font-medium text-background hover:opacity-90">{submit}</button>
      {sent && <p className="col-span-2 text-xs text-primary">فُتح بريدك الإلكتروني ببيانات الطلب، اضغط إرسال لإتمامه.</p>}
    </form>
  );
}

export function ServicePanel() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div>
        <p className="mb-2 flex items-center gap-1 text-sm font-semibold text-[#00a5b0]"><Headphones className="h-4 w-4" />مركز الخدمة Service Center</p>
        <p className="text-xs leading-6 text-muted-foreground">افتح طلب دعم فني أو صيانة أو ضمان لدى فريق خدمة بايلونتك، أو تواصل مع فريق ACTES المحلي.</p>
        <a href="https://pylontechsupport.zendesk.com/hc/en-us/requests/new" target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 text-sm text-primary hover:underline"><ExternalLink className="h-3.5 w-3.5" />فتح تذكرة دعم فني</a>
        <a href="mailto:service@pylontech.com.cn" className="mt-1 flex items-center gap-1 text-sm hover:text-primary" dir="ltr"><Mail className="h-3.5 w-3.5" />service@pylontech.com.cn</a>
      </div>
      <div>
        <p className="mb-2 flex items-center gap-1 text-sm font-semibold text-[#00a5b0]"><ShieldCheck className="h-4 w-4" />تسجيل البطارية Battery Registration</p>
        <p className="mb-2 text-xs leading-6 text-muted-foreground">تسجيل بطاريتك يتيح لنا تقديم خدمة وضمان أفضل. سيرسل لك فريق الخدمة رقم التسجيل النهائي.</p>
        <Form to="service@pylontech.com.cn" subject="Battery Registration — تسجيل بطارية" submit="تسجيل البطارية"
          fields={[
            { k: "type", l: "نوع النشاط", options: ["مستخدم نهائي", "فني تركيب", "موزع"] },
            { k: "name", l: "الاسم الكامل" },
            { k: "country", l: "الدولة / المدينة" },
            { k: "phone", l: "الهاتف", type: "tel" },
            { k: "email", l: "البريد الإلكتروني", type: "email" },
            { k: "installer", l: "شركة التركيب" },
            { k: "date", l: "تاريخ التركيب", type: "date" },
            { k: "inverter", l: "ماركة وموديل الإنفرتر" },
            { k: "sn", l: "الرقم التسلسلي S.N." },
            { k: "source", l: "مصدر الشراء" },
          ]} />
        <a href="https://en.pylontech.com.cn/service/registration" target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"><ExternalLink className="h-3 w-3" />التسجيل مع رفع صور البطارية والفاتورة (الموقع الرسمي)</a>
      </div>
    </div>
  );
}

export function ContactPanel() {
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <div className="space-y-3 text-sm">
        <p className="text-sm font-semibold text-[#00a5b0]">تواصل معنا Contact Us</p>
        <p className="text-xs leading-6 text-muted-foreground">نحن هنا لدعم رحلتك في الطاقة. لنمضِ قدماً معاً.</p>
        <div><p className="font-medium">المقر الرئيسي العالمي</p><p className="text-xs text-muted-foreground">Pylon Technologies Co., Ltd. — Shanghai, China</p></div>
        <div><p className="font-medium">المبيعات Sales</p><a href="mailto:sales@pylontech.com.cn" dir="ltr" className="hover:text-primary">sales@pylontech.com.cn</a></div>
        <div><p className="font-medium">الخدمة Service</p><a href="mailto:service@pylontech.com.cn" dir="ltr" className="hover:text-primary">service@pylontech.com.cn</a></div>
        <a href="https://en.pylontech.com.cn/about/contact" target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"><ExternalLink className="h-3 w-3" />جهات الاتصال الإقليمية</a>
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold text-[#00a5b0]">طلب استفسار Enquiry</p>
        <Form to="sales@pylontech.com.cn" subject="Enquiry — استفسار" submit="إرسال الاستفسار"
          fields={[
            { k: "company", l: "اسم الشركة" },
            { k: "job", l: "المسمى الوظيفي" },
            { k: "name", l: "الاسم الكامل" },
            { k: "country", l: "الدولة / المدينة" },
            { k: "email", l: "البريد الإلكتروني", type: "email" },
            { k: "phone", l: "الهاتف", type: "tel" },
            { k: "cat", l: "فئة الطلب", options: ["Residential ESS", "Residential BESS", "Utility, C&I ESS", "Off-Grid ESS"] },
            { k: "total", l: "إجمالي الطلب (kWh)" },
            { k: "details", l: "تفاصيل المشروع" },
          ]} />
      </div>
    </div>
  );
}
