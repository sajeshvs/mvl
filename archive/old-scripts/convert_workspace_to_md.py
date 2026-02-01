import os
import re
import shutil
from datetime import datetime
from pathlib import Path

from docx import Document
from docx.oxml.table import CT_Tbl
from docx.oxml.text.paragraph import CT_P
from docx.table import Table
from docx.text.paragraph import Paragraph
from markdownify import markdownify as md
from bs4 import BeautifulSoup

WORKSPACE = Path(__file__).resolve().parent
OUTPUT_DIR = WORKSPACE / "reference"
IMAGES_DIR = OUTPUT_DIR / "images"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
IMAGES_DIR.mkdir(parents=True, exist_ok=True)


def sanitize_filename(name: str) -> str:
    name = re.sub(r"[^a-zA-Z0-9._-]", "_", name)
    return name


def write_md(file_path: Path, title: str, body: str, source: Path):
    header = [
        f"# {title}",
        "",
        f"_Source: {source.name}_",
        f"_Converted: {datetime.now().strftime('%Y-%m-%d')}_",
        "",
        "---",
        "",
    ]
    content = "\n".join(header) + body.strip() + "\n"
    file_path.write_text(content, encoding="utf-8")


def iter_block_items(parent):
    for child in parent.element.body.iterchildren():
        if isinstance(child, CT_P):
            yield Paragraph(child, parent)
        elif isinstance(child, CT_Tbl):
            yield Table(child, parent)


def paragraph_to_md(paragraph: Paragraph) -> str:
    text = paragraph.text.strip()
    if not text:
        return ""
    style_name = paragraph.style.name if paragraph.style else ""
    heading_match = re.match(r"Heading\s*(\d+)", style_name, re.IGNORECASE)
    if heading_match:
        level = min(int(heading_match.group(1)), 6)
        return f"{'#' * level} {text}"
    return text


def table_to_md(table: Table) -> str:
    rows = [[cell.text.strip().replace("\n", " ") for cell in row.cells] for row in table.rows]
    if not rows:
        return ""
    col_count = max(len(r) for r in rows)
    rows = [r + [""] * (col_count - len(r)) for r in rows]
    header = rows[0]
    separator = ["---"] * col_count
    md_lines = ["| " + " | ".join(header) + " |", "| " + " | ".join(separator) + " |"]
    for r in rows[1:]:
        md_lines.append("| " + " | ".join(r) + " |")
    return "\n".join(md_lines)


def extract_docx_images(doc: Document, base_name: str) -> list[str]:
    image_links = []
    rels = doc.part.rels
    img_index = 1
    for rel in rels.values():
        if "image" in rel.reltype:
            image_part = rel._target
            image_bytes = image_part.blob
            content_type = image_part.content_type
            ext = content_type.split("/")[-1]
            ext = "jpg" if ext == "jpeg" else ext
            file_name = sanitize_filename(f"{base_name}_img{img_index}.{ext}")
            img_path = IMAGES_DIR / file_name
            img_path.write_bytes(image_bytes)
            image_links.append(f"images/{file_name}")
            img_index += 1
    return image_links


def convert_docx(file_path: Path):
    doc = Document(file_path)
    body_parts = []
    for block in iter_block_items(doc):
        if isinstance(block, Paragraph):
            md_line = paragraph_to_md(block)
            if md_line:
                body_parts.append(md_line)
        elif isinstance(block, Table):
            md_table = table_to_md(block)
            if md_table:
                body_parts.append(md_table)
        body_parts.append("")

    image_links = extract_docx_images(doc, file_path.stem)
    if image_links:
        body_parts.append("## Images")
        body_parts.append("")
        for link in image_links:
            body_parts.append(f"![]({link})")
        body_parts.append("")

    body = "\n".join(body_parts)
    out_path = OUTPUT_DIR / f"{file_path.stem}.md"
    write_md(out_path, file_path.stem, body, file_path)


def normalize_html_images(soup: BeautifulSoup, base_name: str):
    img_index = 1
    for img in soup.find_all("img"):
        src = img.get("src") or ""
        src_path = (WORKSPACE / src).resolve() if src else None
        if src and src_path and src_path.exists() and src_path.is_file():
            ext = src_path.suffix.lstrip(".") or "png"
            new_name = sanitize_filename(f"{base_name}_img{img_index}.{ext}")
            new_path = IMAGES_DIR / new_name
            shutil.copy2(src_path, new_path)
            img["src"] = f"images/{new_name}"
            img_index += 1
    return soup


def convert_html(file_path: Path):
    html = file_path.read_text(encoding="utf-8", errors="ignore")
    soup = BeautifulSoup(html, "html.parser")
    soup = normalize_html_images(soup, file_path.stem)
    md_body = md(str(soup), heading_style="ATX")
    out_path = OUTPUT_DIR / f"{file_path.stem}.md"
    write_md(out_path, file_path.stem, md_body, file_path)


def convert_image(file_path: Path):
    new_name = sanitize_filename(file_path.name)
    new_path = IMAGES_DIR / new_name
    shutil.copy2(file_path, new_path)
    body = f"![](images/{new_name})\n"
    out_path = OUTPUT_DIR / f"{file_path.stem}.md"
    write_md(out_path, file_path.stem, body, file_path)


def main():
    for item in WORKSPACE.iterdir():
        if item.name in {"reference", "images", "convert_workspace_to_md.py", ".venv"}:
            continue
        if item.is_dir():
            continue
        suffix = item.suffix.lower()
        if suffix == ".docx":
            convert_docx(item)
        elif suffix in {".html", ".htm"}:
            convert_html(item)
        elif suffix in {".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"}:
            convert_image(item)


if __name__ == "__main__":
    main()
