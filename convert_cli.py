#!/usr/bin/env python3
"""CLI alternativa al backend HTTP: mismo core de conversión, sin FastAPI,
sin Supabase, sin límites freemium. Útil para probar el parser/builder en
local o en scripts de CI sin levantar el servidor.

Uso:
    python convert_cli.py informe.md -o informe.docx
    python convert_cli.py informe.md --template "System Tests.docx"
    python convert_cli.py --list-templates
"""

import argparse
import sys
from pathlib import Path

from converter import build_docx, list_templates, parse, resolve_template


def main() -> int:
    parser = argparse.ArgumentParser(description="Convierte un fichero Markdown a .docx")
    parser.add_argument("input", nargs="?", help="Ruta al fichero .md de entrada")
    parser.add_argument("-o", "--output", help="Ruta del .docx de salida (por defecto: mismo nombre)")
    parser.add_argument("--template", default="", help="ID de plantilla registrada en templates/")
    parser.add_argument("--title", default=None, help="Título (si no viene ya en el frontmatter)")
    parser.add_argument("--author", default=None, help="Autor (si no viene ya en el frontmatter)")
    parser.add_argument("--list-templates", action="store_true", help="Lista las plantillas disponibles y sale")
    args = parser.parse_args()

    if args.list_templates:
        for tpl in list_templates():
            print(f"{tpl['id']}\t{tpl['name']}")
        return 0

    if not args.input:
        parser.error("Falta el fichero Markdown de entrada (o usa --list-templates)")

    input_path = Path(args.input)
    md_text = input_path.read_text(encoding="utf-8")

    metadata, blocks = parse(md_text)
    if args.title and "title" not in metadata:
        metadata["title"] = args.title
    if args.author and "author" not in metadata:
        metadata["author"] = args.author

    template_path = resolve_template(args.template)
    docx_bytes = build_docx(blocks, metadata, template_path)

    output_path = Path(args.output) if args.output else input_path.with_suffix(".docx")
    output_path.write_bytes(docx_bytes)
    print(f"Generado: {output_path}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
