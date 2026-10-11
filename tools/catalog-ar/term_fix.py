"""Terminology touch-ups requested by the client (edits public/catalogs/official-ar in place):
Deye p1 feature "AC couple ..." , Deye spec label "Surge Protection Level", Suntech "Multi Busbar Technology"."""
import os, sys, shutil, pymupdf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import engine

D = "/dev-server/public/catalogs/official-ar/"
AC = "AC couple لتحديث نظام الطاقة الشمسية القائم"
SURGE = "مستوى الحماية من الارتفاعات المفاجئة في الجهد"


def edit(name, jobs):
    path = D + name + ".pdf"
    doc = pymupdf.open(path)
    for pno, wipe, xr, cy, s, w, size, col, maxw in jobs:
        pg = doc[pno]
        pg.draw_rect(pymupdf.Rect(wipe), color=None, fill=(1, 1, 1), overlay=True)
        tw = engine.line_width(s, w, size)
        if tw > maxw: size *= maxw / tw
        engine.draw_line(pg, xr, cy, s, w, size, col)
    tmp = "/tmp/" + name + ".pdf"
    doc.save(tmp, garbage=3, deflate=True)
    shutil.move(tmp, path)


def deye(name, ac_r, ac_cy, surge_cy):
    jobs = [(0, (330, ac_cy - 8, ac_r + 1.5, ac_cy + 8), ac_r, ac_cy, AC, 400, 10, "#231815", 220)]
    if surge_cy:
        jobs.append((1, (408, surge_cy - 5.5, 549, surge_cy + 5.5), 546, surge_cy, SURGE, 400, 7.5, "#555555", 136))
    edit(name, jobs)


for n, r, cy, s in [("deye-sun-14-20k-sg05lp3--16k", 546, 594.5, 526), ("deye-sun-14-20k-sg05lp3--20k", 546, 594.5, 526),
                    ("deye-sun-3-6k-sg04lp1--6k-sm2", 526, 596.5, 539.3), ("deye-sun-60-80k-sg02hp3--80k", 526, 594.5, 538.3),
                    ("deye-sun-7-6-12k-sg02lp1--8k", 526, 596.5, 532.8), ("deye-sun-7-6-12k-sg02lp1--12k", 526, 596.5, 532.8)]:
    deye(n, r, cy, s)

edit("suntech-stp595s-c72-nsh", [(0, (318, 327, 547, 344.3), 545, 336, "تقنية الموصلات المتعددة", 600, 12, "#231f20", 220)])
