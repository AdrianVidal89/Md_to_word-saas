"""Markdown (mistune AST) -> lista de "bloques tipados" (dict).

Núcleo del conversor. NO modificar el comportamiento aquí sin acuerdo
explícito con el usuario — ver la sección "Regla inquebrantable" de
CLAUDE.md. Varias particularidades documentadas abajo son decisiones de
producto deliberadas, no bugs a corregir de oficio:

- Los headings solo devuelven texto plano (sin runs con formato).
- Un link con bold anidado (``**[texto](url)**``) pierde el bold porque
  ``_extract_text`` concatena solo el raw de los hijos, ignorando marcas de
  strong/emphasis anidadas dentro del link.
- Las celdas de tabla solo admiten texto plano.
- Las listas no soportan anidamiento: todos los ítems de un ``list_item``
  se concatenan en una única lista de runs plana.
- Los blockquotes se aplanan a bloques ``paragraph`` con ``quote: True``,
  pero esa clave no la consume el builder actual (ver builder.py).
- ``thematic_break`` se descarta explícitamente, no genera bloque.
- Las imágenes (``![alt](url)``) se propagan como un run con clave
  ``image`` (la URL cruda, sin decodificar aquí). El builder solo embebe
  la imagen si esa URL es una data URI ``data:image/...;base64,...`` —
  nunca descarga una URL http(s) externa (ver nota SSRF en builder.py).
  Este soporte es una extensión deliberada acordada con el usuario
  (julio 2026), no una limitación pendiente de arreglar.
"""

import frontmatter
import mistune

_md = mistune.create_markdown(renderer=None, plugins=["table", "strikethrough"])


def parse(md_text: str):
    """Devuelve (metadata: dict, blocks: list[dict])."""
    post = frontmatter.loads(md_text)
    metadata = dict(post.metadata)
    tokens = _md(post.content)
    blocks = _flatten(tokens)
    return metadata, blocks


def _flatten(tokens, quote: bool = False) -> list:
    blocks = []
    for tok in tokens:
        ttype = tok.get("type")

        if ttype == "heading":
            level = tok.get("attrs", {}).get("level", tok.get("level", 1))
            blocks.append({
                "type": "heading",
                "level": level,
                "text": _extract_text(tok.get("children", [])),
            })

        elif ttype in ("paragraph", "block_text"):
            block = {
                "type": "paragraph",
                "children": _extract_runs(tok.get("children", [])),
            }
            if quote:
                block["quote"] = True
            blocks.append(block)

        elif ttype == "table":
            blocks.append(_parse_table(tok))

        elif ttype == "list":
            blocks.append(_parse_list(tok))

        elif ttype == "block_quote":
            # Se aplana a paragraphs normales marcados con quote=True.
            blocks.extend(_flatten(tok.get("children", []), quote=True))

        elif ttype == "thematic_break":
            continue  # descartado explícitamente (decisión de producto)

        elif ttype == "blank_line":
            continue

        else:
            continue  # tipos no soportados se ignoran silenciosamente

    return blocks


def _parse_table(tok: dict) -> dict:
    headers: list = []
    rows: list = []
    for section in tok.get("children", []):
        stype = section.get("type")
        if stype == "table_head":
            headers = [_extract_text(cell.get("children", [])) for cell in section.get("children", [])]
        elif stype == "table_body":
            for row in section.get("children", []):
                rows.append([_extract_text(cell.get("children", [])) for cell in row.get("children", [])])
    return {"type": "table", "headers": headers, "rows": rows}


def _parse_list(tok: dict) -> dict:
    ordered = tok.get("attrs", {}).get("ordered", tok.get("ordered", False))
    items = []
    for item in tok.get("children", []):
        if item.get("type") != "list_item":
            continue
        runs = []
        for child in item.get("children", []):
            if child.get("type") in ("block_text", "paragraph"):
                runs.extend(_extract_runs(child.get("children", [])))
            # Sub-listas anidadas dentro de un item no se recorren como
            # bloque `list` independiente (limitación documentada §5.5).
        items.append(runs)
    return {"type": "list", "ordered": bool(ordered), "items": items}


def _extract_text(children: list) -> str:
    """Concatena solo el texto plano de una lista de nodos inline,
    ignorando cualquier marca de formato anidada (bold/italic)."""
    parts = []
    for child in children:
        ctype = child.get("type")
        if ctype in ("text", "codespan"):
            parts.append(child.get("raw", ""))
        elif ctype in ("linebreak", "softbreak"):
            parts.append("\n")
        elif "children" in child:
            parts.append(_extract_text(child["children"]))
    return "".join(parts)


def _extract_runs(children: list, bold: bool = False, italic: bool = False) -> list:
    """Recorre recursivamente los hijos acumulando flags bold/italic/code."""
    runs = []
    for child in children:
        ctype = child.get("type")

        if ctype == "text":
            runs.append({"text": child.get("raw", ""), "bold": bold, "italic": italic, "code": False})

        elif ctype in ("linebreak", "softbreak"):
            runs.append({"text": "\n", "bold": bold, "italic": italic, "code": False})

        elif ctype == "strong":
            runs.extend(_extract_runs(child.get("children", []), bold=True, italic=italic))

        elif ctype == "emphasis":
            runs.extend(_extract_runs(child.get("children", []), bold=bold, italic=True))

        elif ctype == "codespan":
            runs.append({"text": child.get("raw", ""), "bold": bold, "italic": italic, "code": True})

        elif ctype == "link":
            # Hoja: solo texto plano, sin recursar formato (ver docstring).
            runs.append({
                "text": _extract_text(child.get("children", [])),
                "bold": bold,
                "italic": italic,
                "code": False,
                "link": child.get("attrs", {}).get("url", ""),
            })

        elif ctype == "image":
            # Solo se admiten imágenes como data URI (ver builder.py) — una
            # URL http(s) normal se ignora en el builder, nunca se descarga
            # server-side (superficie SSRF en un endpoint público).
            runs.append({
                "text": "",
                "bold": bold,
                "italic": italic,
                "code": False,
                "image": child.get("attrs", {}).get("url", ""),
            })

        elif "children" in child:
            # p.ej. strikethrough u otros wrappers inline no mapeados a una
            # regla de negocio propia: se hereda el formato acumulado.
            runs.extend(_extract_runs(child["children"], bold=bold, italic=italic))

    return runs
