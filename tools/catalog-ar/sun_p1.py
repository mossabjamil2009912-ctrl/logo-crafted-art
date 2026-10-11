"""Suntech Arabic catalogs, page 1 touch-ups: warranty lines start with their number on the right (595),
the "high output" heading sits right-aligned like its siblings (595), and the degradation caption
splits into two phrases (720).  usage: python3 sun_p1.py   (edits public/catalogs/official-ar in place)"""
import os, sys, shutil, pymupdf
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import engine

D = "/dev-server/public/catalogs/official-ar/"
WHITE = (1, 1, 1)


def fix(name, cover, lines):
    path = D + name + ".pdf"
    doc = pymupdf.open(path)
    pg = doc[0]
    for r in cover:
        pg.draw_rect(pymupdf.Rect(r), color=None, fill=WHITE, overlay=True)
    for xr, cy, s, w, size, col in lines:
        engine.draw_line(pg, xr, cy, s, w, size, col)
    tmp = "/tmp/" + name + ".pdf"
    doc.save(tmp, garbage=3, deflate=True)
    shutil.move(tmp, path)


fix("suntech-stp595s-c72-nsh",
    [(395, 656, 600, 721), (452, 371, 552, 388.5)],
    [(578, 673, "30 سنة ضمان أداء خطي للقدرة", 700, 18, "#333333"),
     (578, 700, "15 سنة ضمان للمنتج", 700, 16, "#333333"),
     (545, 381, "قدرة خرج عالية", 600, 11, "#333333")])

fix("suntech-stp720s-d66-nsh",
    [(125, 719, 272, 737)],
    [(264, 728, "تدهور السنة الأولى 1%", 400, 7.5, "#555555"),
     (170, 728, "التدهور السنوي 0.40%", 400, 7.5, "#555555")])
