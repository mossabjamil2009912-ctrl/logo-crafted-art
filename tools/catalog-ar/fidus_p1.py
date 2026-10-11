"""Fidus Battery Plus (catalog-5) Arabic page 1: features band mirrored right-to-left.
Starts from the English page, removes the feature texts and icons, re-places each icon at its
mirrored spot (icon on the right of its text) and draws the Arabic text right-aligned.
usage: python3 fidus_p1.py   (rewrites page 1 of public/catalogs/official-ar/catalog-5.pdf)"""
import os, sys, shutil, pymupdf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import engine

EN = "/dev-server/public/catalogs/catalog-5.pdf"
AR = "/dev-server/public/catalogs/official-ar/catalog-5.pdf"
M = 640.0  # mirror axis sum: x' = M - x  (band spans 52..588)
COL = "#231F20"

ICONS = [(51.5, 196.0, 73.5, 217.8), (314.8, 192.5, 335.3, 217.2),
         (55.0, 251.2, 69.4, 274.4), (314.8, 249.8, 335.3, 276.4)]
TEXT = [(84, 184, 300, 229), (348, 184, 590, 229), (84, 245, 228, 279), (348, 245, 478, 279)]

LINES = [  # (english text left x, cy, text, weight, size)
    (85, 199, "أمان وموثوقية فائقة", 700, 15),
    (85, 212, "تصميم حماية متعدد الطبقات مع وحدة", 400, 8),
    (85, 222, "إخماد حريق مدمجة", 400, 8),
    (349, 199, "مصممة للظروف القاسية", 700, 15),
    (349, 212, "تعمل في المناطق شديدة البرودة، ومقاومة لنفث الماء،", 400, 8),
    (349, 222, "ومحكمة ضد الغبار، ومقاومة للدخان والهواء المالح.", 400, 8),
    (85, 259, "تركيب مرن", 700, 15),
    (85, 272, "تثبيت على الجدار أو على الأرض.", 400, 8),
    (349, 259, "مراقبة ذكية", 700, 15),
    (349, 272, "تطبيق جوال وشاشة LED", 400, 8),
]

src = pymupdf.open(EN)
out = pymupdf.open()
out.insert_pdf(src, from_page=0, to_page=0)
pg = out[0]
for r in TEXT + ICONS:
    pg.add_redact_annot(pymupdf.Rect(r))
pg.apply_redactions(images=pymupdf.PDF_REDACT_IMAGE_NONE,
                    graphics=pymupdf.PDF_REDACT_LINE_ART_REMOVE_IF_TOUCHED)
for x0, y0, x1, y1 in ICONS:
    pg.show_pdf_page(pymupdf.Rect(M - x1, y0, M - x0, y1), src, 0, clip=pymupdf.Rect(x0, y0, x1, y1))
for x, cy, s, w, size in LINES:
    engine.draw_line(pg, M - x, cy, s, w, size, COL)

ar = pymupdf.open(AR)
res = pymupdf.open()
res.insert_pdf(out)
res.insert_pdf(ar, from_page=1, to_page=len(ar) - 1)
tmp = "/tmp/catalog-5.pdf"
res.save(tmp, garbage=3, deflate=True)
ar.close()
shutil.copy(AR, "/tmp/catalog-5.bak.pdf")
shutil.move(tmp, AR)
print("ok")
