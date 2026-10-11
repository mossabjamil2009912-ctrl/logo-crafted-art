"""HiTHIUM NeoPower 4 G2 Arabic page 1: RTL feature grid (icons mirrored, labels redrawn)."""
import sys, shutil
sys.path.insert(0, '/dev-server/tools/catalog-ar')
import pymupdf as fitz
import engine

P = '/dev-server/public/catalogs/official-ar/hithium-heroee-neopower-4-g2.pdf'
SRC = sys.argv[1] if len(sys.argv) > 1 else P
COLS = [130, 299, 467]
ROWS = [(611, 651), (704, 744)]
LABELS = [  # right -> left (RTL reading order)
    ["نفس السعر، وعمر أطول<br>بأكثر من 3 أضعاف", "عمر تشغيلي طويل جداً", "لا تحتاج إلى صيانة"],
    ["بطارية ذكية مع<br>مراقبة في الوقت الفعلي", "وزن خفيف", "درجة حماية عالية IP65"],
]
LAB_Y = [(658, 692), (750, 786)]


def html(t, size, weight=400, align="center", color="#333"):
    return (f'<div dir="rtl" style="font-family:AR;font-size:{size}px;font-weight:{weight};'
            f'text-align:{align};color:{color};line-height:1.35">{t}</div>')


src = fitz.open(SRC)
doc = fitz.open(SRC)
pg = doc[0]
W = pg.rect.width
white = (1, 1, 1)
# clear heading + label rows + icons
pg.draw_rect(fitz.Rect(50, 538, 245, 572), color=None, fill=white)
for y0, y1 in LAB_Y:
    pg.draw_rect(fitz.Rect(15, y0 - 4, W - 15, y1 + 4), color=None, fill=white)
for y0, y1 in ROWS:
    for cx in COLS:
        pg.draw_rect(fitz.Rect(cx - 26, y0 - 3, cx + 26, y1 + 3), color=None, fill=white)
# mirrored icons
for y0, y1 in ROWS:
    for cx in COLS:
        old = fitz.Rect(cx - 26, y0 - 3, cx + 26, y1 + 3)
        nx = W - cx
        pg.show_pdf_page(fitz.Rect(nx - 26, y0 - 3, nx + 26, y1 + 3), src, 0, clip=old)
# heading, right-aligned where the English one starts (mirrored)
pg.insert_htmlbox(fitz.Rect(40, 538, 228, 574), html("مزايا المنتج", 20, 700, "right", "#111"),
                  css=engine.CSS, archive=engine.ARCH)
# labels: column order right -> left
for row, (y0, y1) in zip(LABELS, LAB_Y):
    for t, cx in zip(row, sorted((W - c for c in COLS), reverse=True)):
        pg.insert_htmlbox(fitz.Rect(cx - 85, y0, cx + 85, y1 + 6), html(t, 12.5), css=engine.CSS, archive=engine.ARCH)
tmp = P + '.tmp'
doc.save(tmp, garbage=3, deflate=True)
shutil.move(tmp, P)
print('ok')
