"""Bloques tipados -> Document (python-docx) -> bytes.

Dos modos de salida:
- Sin plantilla: documento en blanco, estilos propios forzados, portada
  generada por código.
- Con plantilla: se abre el .docx de referencia completo y se reutilizan sus
  estilos/portada/TOC (ver converter/template.py).

El coloreado automático Pass/Fail en celdas de tabla es la regla de negocio
central de este dominio (documentos de testing/QA) y se aplica en ambos
modos. No modificar sin acuerdo explícito — ver CLAUDE.md.
"""

from io import BytesIO

from docx import Document
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

from . import styles
from .template import prepare_from_template


def build_docx(blocks: list, metadata: dict | None = None, template_path=None) -> bytes:
    metadata = metadata or {}

    if template_path:
        doc = Document(str(template_path))
        prepare_from_template(doc, metadata)
        table_style = _first_available_style(doc, [styles.TEMPLATE_TABLE_STYLE, "Table Grid", "Normal Table"])
        use_template_colors = True
    else:
        doc = Document()
        _apply_base_styles(doc)
        _add_cover(doc, metadata)
        table_style = _first_available_style(doc, ["Table Grid", "Normal Table"])
        use_template_colors = False

    for block in blocks:
        btype = block.get("type")
        if btype == "heading":
            _add_heading(doc, block, use_template_colors)
        elif btype == "paragraph":
            _add_paragraph(doc, block)
        elif btype == "table":
            _add_table(doc, block, table_style, use_template_colors)
        elif btype == "list":
            _add_list(doc, block)

    buf = BytesIO()
    doc.save(buf)
    return buf.getvalue()


# --------------------------------------------------------------------------
# Modo sin plantilla: estilos propios + portada generada
# --------------------------------------------------------------------------

def _apply_base_styles(doc) -> None:
    normal = doc.styles["Normal"]
    normal.font.name = styles.FONT_NAME
    normal.font.size = Pt(styles.FONT_SIZE_BODY)


def _add_cover(doc, metadata: dict) -> None:
    title = metadata.get("title")
    if title:
        p = doc.add_paragraph()
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        run = p.add_run(str(title))
        run.bold = True
        run.font.size = Pt(24)
        run.font.color.rgb = RGBColor.from_string(styles.COLOR_ACCENT)

    for key, value in metadata.items():
        if key == "title" or value in (None, ""):
            continue
        p = doc.add_paragraph()
        p.add_run(f"{key}: ").bold = True
        p.add_run(str(value))

    if metadata:
        doc.add_page_break()


# --------------------------------------------------------------------------
# Recorrido de bloques (idéntico en ambos modos)
# --------------------------------------------------------------------------

def _add_heading(doc, block: dict, use_template_colors: bool) -> None:
    level = min(int(block["level"]), 3)  # Word solo soporta H1-H3 aquí (H4+ se degrada)
    heading = doc.add_heading(block["text"], level=level)
    if not use_template_colors and heading.runs:
        run = heading.runs[0]
        run.font.color.rgb = RGBColor.from_string(styles.COLOR_ACCENT)
        run.font.size = Pt(styles.SIZE_BY_LEVEL.get(level, styles.FONT_SIZE_BODY))


def _add_paragraph(doc, block: dict) -> None:
    # Nota: block.get("quote") existe (ver parser.py) pero NO se consume
    # aquí — las citas se renderizan como párrafo normal (gap documentado).
    p = doc.add_paragraph()
    _render_runs(p, block.get("children", []))


def _render_runs(paragraph, runs: list) -> None:
    for r in runs:
        run = paragraph.add_run(r.get("text", ""))
        run.bold = r.get("bold", False)
        run.italic = r.get("italic", False)
        if r.get("code"):
            run.font.name = "Consolas"
        if r.get("link"):
            # Simulación visual únicamente: no se crea relación OOXML
            # w:hyperlink/r:id, no es un hyperlink real navegable.
            run.font.underline = True
            run.font.color.rgb = RGBColor.from_string(styles.COLOR_ACCENT)


def _add_list(doc, block: dict) -> None:
    available = {s.name for s in doc.styles}
    style_name = "List Number" if block.get("ordered") else "List Bullet"
    if style_name not in available:
        style_name = "List Paragraph" if "List Paragraph" in available else None

    for runs in block.get("items", []):
        p = doc.add_paragraph(style=style_name) if style_name else doc.add_paragraph()
        _render_runs(p, runs)


def _add_table(doc, block: dict, table_style, use_template_colors: bool) -> None:
    headers = block.get("headers", [])
    rows = block.get("rows", [])
    n_cols = len(headers) if headers else (len(rows[0]) if rows else 0)
    if n_cols == 0:
        return

    n_rows = (1 if headers else 0) + len(rows)
    table = doc.add_table(rows=n_rows, cols=n_cols)
    if table_style:
        table.style = table_style

    row_idx = 0
    if headers:
        for col_idx, text in enumerate(headers):
            cell = table.cell(row_idx, col_idx)
            cell.text = text
            if not use_template_colors:
                _set_cell_bg(cell, styles.COLOR_HEADER_BG)
                for paragraph in cell.paragraphs:
                    for run in paragraph.runs:
                        run.font.color.rgb = RGBColor.from_string(styles.COLOR_HEADER_FG)
        row_idx += 1

    for row in rows:
        for col_idx, text in enumerate(row):
            cell = table.cell(row_idx, col_idx)
            cell.text = text
            _apply_pass_fail_color(cell, text)
        row_idx += 1

    _enable_first_row_format(table)


def _apply_pass_fail_color(cell, text: str) -> None:
    upper = text.strip().upper()
    if upper.startswith("PASS") or upper in ("OK", "✓"):
        _set_cell_bg(cell, styles.COLOR_PASS_BG)
    elif upper.startswith("FAIL") or upper in ("KO", "NOK", "✗"):
        _set_cell_bg(cell, styles.COLOR_FAIL_BG)


# --------------------------------------------------------------------------
# Manipulación OOXML directa (sin API de alto nivel equivalente en python-docx)
# --------------------------------------------------------------------------

def _set_cell_bg(cell, hex_color: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), hex_color)
    tc_pr.append(shd)


def _enable_first_row_format(table) -> None:
    """Activa el formato condicional de 'primera fila' de los estilos de
    tabla nativos de Word — necesario para que estilos como
    'Grid Table 1 Light Accent 5' pinten realmente la cabecera."""
    tbl_pr = table._tbl.tblPr
    look = OxmlElement("w:tblLook")
    look.set(qn("w:val"), "04A0")
    look.set(qn("w:firstRow"), "1")
    look.set(qn("w:lastRow"), "0")
    look.set(qn("w:firstColumn"), "1")
    look.set(qn("w:lastColumn"), "0")
    look.set(qn("w:noHBand"), "0")
    look.set(qn("w:noVBand"), "1")
    tbl_pr.append(look)


def _first_available_style(doc, candidates: list):
    available = {s.name for s in doc.styles}
    for name in candidates:
        if name in available:
            return name
    return None
