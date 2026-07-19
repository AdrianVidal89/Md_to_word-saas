"""Auto-mapeo de estilos Word para plantillas Pro subidas por el usuario.

Capa de negocio nueva — el core de conversión (`converter/parser.py`,
`builder.py`, `template.py`, `styles.py`) permanece intacto (ver CLAUDE.md).
El builder existente espera encontrar los estilos nativos de Word
"Heading 1/2/3" y "Grid Table 1 Light Accent 5" por nombre. Este módulo
permite que una plantilla que usa nombres de estilo distintos (p. ej. una
plantilla en francés con "Titre Section") funcione igual: renombra ESA COPIA
de la plantilla antes de pasarla a `build_docx`, sin tocar el pipeline de
render en sí ni mutar el original persistido en Storage.

El auto-mapeo es siempre best-effort: si no encuentra nada razonable para un
slot, lo deja en `None` — la UI debe ofrecer siempre un dropdown manual con
`list_available_styles()` como fallback, nunca bloquear en base a esto.
"""

from io import BytesIO

from docx import Document

# Slots reconocidos por converter/builder.py, mapeados a su nombre nativo de Word.
CANONICAL_STYLES = {
    "heading_1": "Heading 1",
    "heading_2": "Heading 2",
    "heading_3": "Heading 3",
    "table": "Grid Table 1 Light Accent 5",
}

# python-docx expone "Heading N" (UI) pero el XML interno de Word para esos
# estilos concretos (heredados de las plantillas legacy) usa minúsculas; hay
# que escribir ese nombre interno o la búsqueda por nombre de python-docx no
# los encuentra tras el renombrado (ver docx.styles.BabelFish).
_UI_TO_INTERNAL_NAME = {
    "Heading 1": "heading 1",
    "Heading 2": "heading 2",
    "Heading 3": "heading 3",
}

_HEURISTICS = {
    "heading_1": ["heading 1", "título 1", "titulo 1", "encabezado 1", "h1"],
    "heading_2": ["heading 2", "título 2", "titulo 2", "encabezado 2", "h2"],
    "heading_3": ["heading 3", "título 3", "titulo 3", "encabezado 3", "h3"],
    "table": ["grid table 1 light accent 5", "table grid", "tabla con cuadrícula", "tabla"],
}


def list_available_styles(raw_docx_bytes: bytes) -> list:
    doc = Document(BytesIO(raw_docx_bytes))
    return sorted({s.name for s in doc.styles if s.name})


def detect_style_mapping(raw_docx_bytes: bytes) -> dict:
    """Best-effort: nunca lanza error. Un slot sin match razonable queda en
    None (ver docstring del módulo)."""
    available = list_available_styles(raw_docx_bytes)
    available_lower = {name.lower(): name for name in available}

    mapping = {}
    for slot, canonical_name in CANONICAL_STYLES.items():
        if canonical_name in available:
            mapping[slot] = canonical_name
            continue
        mapping[slot] = next(
            (available_lower[c] for c in _HEURISTICS.get(slot, []) if c in available_lower),
            None,
        )
    return mapping


def apply_style_mapping(raw_docx_bytes: bytes, mapping: dict) -> bytes:
    """Devuelve una COPIA en bytes de la plantilla con los estilos mapeados
    renombrados a su nombre canónico. Si el canónico ya existía con otro
    contenido, se renombra a un lado para no perderlo."""
    doc = Document(BytesIO(raw_docx_bytes))
    styles_by_name = {s.name: s for s in doc.styles if s.name}

    for slot, canonical_name in CANONICAL_STYLES.items():
        chosen_name = (mapping or {}).get(slot)
        if not chosen_name or chosen_name == canonical_name:
            continue

        chosen_style = styles_by_name.get(chosen_name)
        if chosen_style is None:
            continue  # la UI ya valida contra list_available_styles; defensivo

        existing_canonical = styles_by_name.get(canonical_name)
        if existing_canonical is not None and existing_canonical is not chosen_style:
            existing_canonical.name = f"{canonical_name} (plantilla original)"

        chosen_style.name = _UI_TO_INTERNAL_NAME.get(canonical_name, canonical_name)
        styles_by_name[canonical_name] = chosen_style

    buf = BytesIO()
    doc.save(buf)
    return buf.getvalue()
