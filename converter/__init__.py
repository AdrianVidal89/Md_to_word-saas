from .parser import parse
from .builder import build_docx
from .template import list_templates, resolve_template

__all__ = ["parse", "build_docx", "list_templates", "resolve_template"]
