"""Constantes de configuración visual del conversor.

Punto único de "tokens de diseño". Si en el futuro se necesita white-labeling
multi-tenant, estos valores deberían parametrizarse por tenant en lugar de
seguir siendo constantes de módulo — no hacerlo hoy porque no hay un
requisito concreto todavía (YAGNI).
"""

from pathlib import Path

TEMPLATES_DIR = Path(__file__).resolve().parent.parent / "templates"

# Nombre de estilo de Word que marca dónde empieza el contenido de ejemplo
# a borrar dentro de una plantilla de referencia.
TEMPLATE_CONTENT_MARKER_STYLE = "Heading 1"

# Estilo de tabla nativo de Word usado cuando se convierte con plantilla.
TEMPLATE_TABLE_STYLE = "Grid Table 1 Light Accent 5"

# Etiquetas de la página de portada/control de documento -> clave de frontmatter.
COVER_FIELD_LABELS = {
    "Confidentiality Status": "confidentiality",
    "Document Owner": "owner",
    "Document Reviewer": "reviewer",
    "Document Approver": "approver",
}

# Colores de marca (hex sin '#', formato que espera python-docx RGBColor).
COLOR_BRAND_GREEN = "3DCD58"
COLOR_BRAND_BLUE = "00B0F0"
COLOR_HEADER_BG = "26374A"
COLOR_HEADER_FG = "FFFFFF"
COLOR_ACCENT = "1F497D"
COLOR_PASS_BG = "C6EFCE"
COLOR_FAIL_BG = "FFC7CE"

FONT_NAME = "Calibri"
FONT_SIZE_BODY = 10
FONT_SIZE_H1 = 16
FONT_SIZE_H2 = 13
FONT_SIZE_H3 = 11

SIZE_BY_LEVEL = {1: FONT_SIZE_H1, 2: FONT_SIZE_H2, 3: FONT_SIZE_H3}
