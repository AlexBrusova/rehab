# Academic Agent Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a local Claude Code skill `/academic-agent` that orchestrates specialized subagents to write scientific articles (Markdown + citations) and generate PPTX presentations with AI images — with user validation at 5 checkpoints.

**Architecture:** Multi-agent pipeline. Orchestrator skill dispatches 5 subagent skills (researcher, writer, citation-checker, slide-designer, image-generator). Python utilities handle API calls (Semantic Scholar, arXiv, Crossref, DALL-E 3, Stable Diffusion A1111) and PPTX assembly. Sessions stored locally at `~/.academic-agent/`.

**Tech Stack:** Python 3.14, python-pptx 1.0.2, requests, openai, pytest, Claude Code skills (Markdown), Semantic Scholar REST API, arXiv Atom API, Crossref REST API, OpenAI DALL-E 3, SD A1111 HTTP API.

---

## File Map

```
~/.claude/plugins/cache/local/academic-agent/1.0.0/
  package.json
  skills/
    academic-agent.md              # orchestrator — entry point
    subagents/
      researcher.md                # queries APIs → papers.json
      writer.md                    # outline + full draft
      citation-checker.md          # DOI verify + citation format
      slide-designer.md            # text → slides.json + draft PPTX
      image-generator.md           # DALL-E/SD → images → final PPTX

~/.claude/plugins/cache/local/academic-agent/1.0.0/tools/
  session_manager.py               # create/resume/save sessions
  search_papers.py                 # Semantic Scholar + arXiv + Crossref
  citation_format.py               # IEEE/APA/MLA/Chicago formatter
  pptx_builder.py                  # slides.json + template → PPTX
  dalle_generate.py                # OpenAI DALL-E 3 → PNG
  sd_generate.py                   # A1111 localhost:7860 → PNG
  tests/
    test_session_manager.py
    test_search_papers.py
    test_citation_format.py
    test_pptx_builder.py
    test_dalle_generate.py
    test_sd_generate.py

~/.academic-agent/
  venv/                            # Python venv with all deps
  default-template.pptx            # minimal built-in template (created in Task 1)
  user-template.pptx               # optional global user template
  sessions/
    <session-id>/
      papers.json
      outline.md
      draft.md
      final.md
      slides.json
      images/
      final_presentation.pptx
```

**Shared constants (used across tools):**
```python
# All tools import this from session_manager.py
BASE_DIR = Path.home() / ".academic-agent"
SESSIONS_DIR = BASE_DIR / "sessions"
DEFAULT_TEMPLATE = BASE_DIR / "default-template.pptx"
USER_TEMPLATE = BASE_DIR / "user-template.pptx"
TOOLS_DIR = Path(__file__).parent  # path to tools/ directory
```

---

## Task 1: Environment Setup + Plugin Registration

**Files:**
- Create: `~/.academic-agent/` (directory tree)
- Create: `~/.academic-agent/venv/` (Python venv)
- Create: `~/.claude/plugins/cache/local/academic-agent/1.0.0/package.json`
- Modify: `~/.claude/settings.json` (add plugin to enabledPlugins)

- [ ] **Step 1: Create directory tree**

```bash
mkdir -p ~/.academic-agent/sessions
mkdir -p ~/.claude/plugins/cache/local/academic-agent/1.0.0/skills/subagents
mkdir -p ~/.claude/plugins/cache/local/academic-agent/1.0.0/tools/tests
```

- [ ] **Step 2: Create Python virtual environment**

```bash
python3 -m venv ~/.academic-agent/venv
~/.academic-agent/venv/bin/pip install --quiet requests openai pytest python-pptx
~/.academic-agent/venv/bin/python -c "import requests, openai, pytest, pptx; print('venv ok')"
```

Expected output: `venv ok`

- [ ] **Step 3: Create plugin package.json**

Create `~/.claude/plugins/cache/local/academic-agent/1.0.0/package.json`:

```json
{
  "name": "academic-agent",
  "version": "1.0.0",
  "publisher": "local",
  "description": "Multi-agent pipeline for scientific article writing and PPTX presentation generation"
}
```

- [ ] **Step 4: Register plugin in settings.json**

Read `~/.claude/settings.json`, add `"academic-agent@local": true` to `enabledPlugins`:

```json
{
  "enabledPlugins": {
    "caveman@caveman": true,
    "superpowers@claude-plugins-official": true,
    "code-review@claude-plugins-official": true,
    "security-guidance@claude-plugins-official": true,
    "frontend-design@claude-plugins-official": true,
    "academic-agent@local": true
  }
}
```

- [ ] **Step 5: Create minimal default PPTX template**

```bash
~/.academic-agent/venv/bin/python3 - <<'EOF'
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN

prs = Presentation()
prs.slide_width = Inches(13.33)
prs.slide_height = Inches(7.5)

# Title slide layout (index 0)
slide = prs.slides.add_slide(prs.slide_layouts[6])  # blank
bg = slide.background
fill = bg.fill
fill.solid()
fill.fore_color.rgb = RGBColor(0x1A, 0x1A, 0x2E)

prs.save("/Users/$(whoami)/.academic-agent/default-template.pptx")
print("template created")
EOF
```

Actually run as:
```bash
~/.academic-agent/venv/bin/python3 -c "
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches
from pptx.dml.color import RGBColor

prs = Presentation()
prs.slide_width = Inches(13.33)
prs.slide_height = Inches(7.5)
prs.save(str(Path.home() / '.academic-agent' / 'default-template.pptx'))
print('template created')
"
```

Expected: `template created`

- [ ] **Step 6: Verify setup**

```bash
ls ~/.academic-agent/
# Expected: default-template.pptx  sessions  venv
ls ~/.claude/plugins/cache/local/academic-agent/1.0.0/
# Expected: package.json  skills  tools
```

---

## Task 2: session_manager.py

**Files:**
- Create: `~/.claude/plugins/cache/local/academic-agent/1.0.0/tools/session_manager.py`
- Create: `~/.claude/plugins/cache/local/academic-agent/1.0.0/tools/tests/test_session_manager.py`

- [ ] **Step 1: Write failing tests**

Create `tools/tests/test_session_manager.py`:

```python
import json
import tempfile
from pathlib import Path
import pytest
import sys

sys.path.insert(0, str(Path(__file__).parent.parent))

# Patch BASE_DIR to a temp dir for all tests
import session_manager as sm

@pytest.fixture(autouse=True)
def tmp_base(tmp_path, monkeypatch):
    monkeypatch.setattr(sm, "BASE_DIR", tmp_path)
    monkeypatch.setattr(sm, "SESSIONS_DIR", tmp_path / "sessions")
    (tmp_path / "sessions").mkdir()
    return tmp_path


def test_create_session_returns_id():
    sid = sm.create_session("quantum computing")
    assert isinstance(sid, str) and len(sid) > 0


def test_create_session_creates_directory():
    sid = sm.create_session("AI in medicine")
    assert (sm.SESSIONS_DIR / sid).is_dir()


def test_create_session_writes_meta():
    sid = sm.create_session("neural networks", venue="IEEE", lang="en")
    meta = json.loads((sm.SESSIONS_DIR / sid / "meta.json").read_text())
    assert meta["topic"] == "neural networks"
    assert meta["venue"] == "IEEE"
    assert meta["lang"] == "en"


def test_save_and_load_step():
    sid = sm.create_session("test topic")
    sm.save_step(sid, "papers", [{"title": "Paper A", "doi": "10.1/x"}])
    data = sm.load_step(sid, "papers")
    assert data[0]["title"] == "Paper A"


def test_load_step_missing_returns_none():
    sid = sm.create_session("test topic")
    assert sm.load_step(sid, "papers") is None


def test_list_sessions():
    sm.create_session("topic 1")
    sm.create_session("topic 2")
    sessions = sm.list_sessions()
    assert len(sessions) == 2


def test_get_session_path():
    sid = sm.create_session("test")
    path = sm.get_session_path(sid)
    assert path.is_dir()


def test_get_template_returns_user_template_when_exists(tmp_base):
    user_tpl = tmp_base / "user-template.pptx"
    user_tpl.write_bytes(b"fake")
    assert sm.get_template(tmp_base) == user_tpl


def test_get_template_returns_default_when_no_user(tmp_base):
    default_tpl = tmp_base / "default-template.pptx"
    default_tpl.write_bytes(b"fake")
    assert sm.get_template(tmp_base) == default_tpl
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0/tools
~/.academic-agent/venv/bin/pytest tests/test_session_manager.py -v 2>&1 | head -20
```

Expected: `ModuleNotFoundError: No module named 'session_manager'`

- [ ] **Step 3: Implement session_manager.py**

Create `tools/session_manager.py`:

```python
import json
import uuid
from datetime import datetime
from pathlib import Path

BASE_DIR = Path.home() / ".academic-agent"
SESSIONS_DIR = BASE_DIR / "sessions"


def create_session(topic: str, venue: str = "", lang: str = "en") -> str:
    sid = uuid.uuid4().hex[:12]
    session_dir = SESSIONS_DIR / sid
    session_dir.mkdir(parents=True, exist_ok=True)
    (session_dir / "images").mkdir(exist_ok=True)
    meta = {
        "id": sid,
        "topic": topic,
        "venue": venue,
        "lang": lang,
        "created": datetime.utcnow().isoformat(),
        "steps_completed": [],
    }
    (session_dir / "meta.json").write_text(json.dumps(meta, indent=2))
    return sid


def save_step(sid: str, step_name: str, data) -> None:
    path = SESSIONS_DIR / sid / f"{step_name}.json"
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2))
    meta_path = SESSIONS_DIR / sid / "meta.json"
    meta = json.loads(meta_path.read_text())
    if step_name not in meta["steps_completed"]:
        meta["steps_completed"].append(step_name)
    meta_path.write_text(json.dumps(meta, indent=2))


def load_step(sid: str, step_name: str):
    path = SESSIONS_DIR / sid / f"{step_name}.json"
    if not path.exists():
        return None
    return json.loads(path.read_text())


def list_sessions() -> list[dict]:
    if not SESSIONS_DIR.exists():
        return []
    sessions = []
    for d in SESSIONS_DIR.iterdir():
        meta_path = d / "meta.json"
        if meta_path.exists():
            sessions.append(json.loads(meta_path.read_text()))
    return sorted(sessions, key=lambda s: s["created"], reverse=True)


def get_session_path(sid: str) -> Path:
    return SESSIONS_DIR / sid


def get_template(base_dir: Path = BASE_DIR) -> Path:
    user_tpl = base_dir / "user-template.pptx"
    if user_tpl.exists():
        return user_tpl
    return base_dir / "default-template.pptx"
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0/tools
~/.academic-agent/venv/bin/pytest tests/test_session_manager.py -v
```

Expected: `9 passed`

- [ ] **Step 5: Commit**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0
git init . 2>/dev/null || true
git add tools/session_manager.py tools/tests/test_session_manager.py
git commit -m "feat: add session_manager with create/save/load/list"
```

---

## Task 3: search_papers.py

**Files:**
- Create: `tools/search_papers.py`
- Create: `tools/tests/test_search_papers.py`

The tool queries Semantic Scholar, arXiv, Crossref and outputs a list of paper dicts:
```json
[{"title": "...", "authors": ["..."], "year": 2024, "doi": "10.1/...", "abstract": "...", "url": "...", "source": "semantic_scholar"}]
```

- [ ] **Step 1: Write failing tests**

Create `tools/tests/test_search_papers.py`:

```python
import json
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock

sys.path.insert(0, str(Path(__file__).parent.parent))
import search_papers as sp


MOCK_SS_RESPONSE = {
    "data": [{
        "paperId": "abc123",
        "title": "Deep Learning for Healthcare",
        "authors": [{"name": "Alice Smith"}, {"name": "Bob Jones"}],
        "year": 2023,
        "externalIds": {"DOI": "10.1000/xyz"},
        "abstract": "We study deep learning.",
        "url": "https://semanticscholar.org/paper/abc123"
    }]
}

MOCK_ARXIV_RESPONSE = """<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <entry>
    <title>Neural Networks in Medicine</title>
    <author><name>Carol White</name></author>
    <published>2024-01-15T00:00:00Z</published>
    <id>http://arxiv.org/abs/2401.00001v1</id>
    <summary>A study of neural nets.</summary>
    <link href="https://arxiv.org/abs/2401.00001" rel="alternate"/>
  </entry>
</feed>"""

MOCK_CROSSREF_RESPONSE = {
    "message": {
        "DOI": "10.1000/xyz",
        "title": ["Deep Learning for Healthcare"],
        "author": [{"given": "Alice", "family": "Smith"}],
        "published": {"date-parts": [[2023, 6, 1]]},
        "URL": "https://doi.org/10.1000/xyz"
    }
}


def test_parse_semantic_scholar_entry():
    entry = MOCK_SS_RESPONSE["data"][0]
    paper = sp._parse_ss_entry(entry)
    assert paper["title"] == "Deep Learning for Healthcare"
    assert paper["doi"] == "10.1000/xyz"
    assert paper["year"] == 2023
    assert paper["source"] == "semantic_scholar"
    assert "Alice Smith" in paper["authors"]


def test_parse_arxiv_entry():
    import xml.etree.ElementTree as ET
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    root = ET.fromstring(MOCK_ARXIV_RESPONSE)
    entry = root.find("atom:entry", ns)
    paper = sp._parse_arxiv_entry(entry, ns)
    assert paper["title"] == "Neural Networks in Medicine"
    assert paper["year"] == 2024
    assert paper["source"] == "arxiv"
    assert paper["doi"] == ""


def test_search_semantic_scholar():
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = MOCK_SS_RESPONSE
    with patch("requests.get", return_value=mock_resp):
        papers = sp.search_semantic_scholar("deep learning healthcare", limit=5)
    assert len(papers) == 1
    assert papers[0]["title"] == "Deep Learning for Healthcare"


def test_search_arxiv():
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.text = MOCK_ARXIV_RESPONSE
    with patch("requests.get", return_value=mock_resp):
        papers = sp.search_arxiv("neural networks medicine", limit=5)
    assert len(papers) == 1
    assert papers[0]["title"] == "Neural Networks in Medicine"


def test_resolve_doi():
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = MOCK_CROSSREF_RESPONSE
    with patch("requests.get", return_value=mock_resp):
        result = sp.resolve_doi("10.1000/xyz")
    assert result["doi"] == "10.1000/xyz"


def test_resolve_doi_not_found():
    mock_resp = MagicMock()
    mock_resp.status_code = 404
    with patch("requests.get", return_value=mock_resp):
        result = sp.resolve_doi("10.9999/notfound")
    assert result is None


def test_deduplicate_removes_same_doi():
    papers = [
        {"title": "A", "doi": "10.1/x", "source": "semantic_scholar"},
        {"title": "A duplicate", "doi": "10.1/x", "source": "arxiv"},
        {"title": "B", "doi": "10.2/y", "source": "semantic_scholar"},
    ]
    result = sp.deduplicate(papers)
    assert len(result) == 2


def test_search_all_merges_sources():
    with patch("search_papers.search_semantic_scholar", return_value=[{"title": "SS Paper", "doi": "10.1/a", "source": "semantic_scholar"}]):
        with patch("search_papers.search_arxiv", return_value=[{"title": "arXiv Paper", "doi": "", "source": "arxiv"}]):
            results = sp.search_all("some topic", limit=10)
    assert len(results) == 2
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0/tools
~/.academic-agent/venv/bin/pytest tests/test_search_papers.py -v 2>&1 | head -10
```

Expected: `ModuleNotFoundError: No module named 'search_papers'`

- [ ] **Step 3: Implement search_papers.py**

Create `tools/search_papers.py`:

```python
import os
import xml.etree.ElementTree as ET
from typing import Optional
import requests

SS_BASE = "https://api.semanticscholar.org/graph/v1/paper/search"
ARXIV_BASE = "http://export.arxiv.org/api/query"
CROSSREF_BASE = "https://api.crossref.org/works"
TIMEOUT = 15


def _ss_headers() -> dict:
    key = os.getenv("SEMANTIC_SCHOLAR_API_KEY", "")
    return {"x-api-key": key} if key else {}


def _parse_ss_entry(entry: dict) -> dict:
    return {
        "title": entry.get("title", ""),
        "authors": [a["name"] for a in entry.get("authors", [])],
        "year": entry.get("year") or 0,
        "doi": (entry.get("externalIds") or {}).get("DOI", ""),
        "abstract": entry.get("abstract", ""),
        "url": entry.get("url", ""),
        "source": "semantic_scholar",
    }


def _parse_arxiv_entry(entry, ns: dict) -> dict:
    title = (entry.findtext("atom:title", "", ns) or "").strip()
    authors = [a.findtext("atom:name", "", ns) for a in entry.findall("atom:author", ns)]
    published = entry.findtext("atom:published", "", ns)
    year = int(published[:4]) if published else 0
    link_el = entry.find("atom:link[@rel='alternate']", ns)
    url = link_el.get("href", "") if link_el is not None else ""
    abstract = (entry.findtext("atom:summary", "", ns) or "").strip()
    return {
        "title": title,
        "authors": authors,
        "year": year,
        "doi": "",
        "abstract": abstract,
        "url": url,
        "source": "arxiv",
    }


def search_semantic_scholar(query: str, limit: int = 15) -> list[dict]:
    params = {
        "query": query,
        "limit": limit,
        "fields": "title,authors,year,externalIds,abstract,url",
    }
    try:
        resp = requests.get(SS_BASE, params=params, headers=_ss_headers(), timeout=TIMEOUT)
        if resp.status_code != 200:
            return []
        return [_parse_ss_entry(e) for e in resp.json().get("data", [])]
    except requests.RequestException:
        return []


def search_arxiv(query: str, limit: int = 10) -> list[dict]:
    params = {"search_query": f"all:{query}", "max_results": limit, "sortBy": "relevance"}
    try:
        resp = requests.get(ARXIV_BASE, params=params, timeout=TIMEOUT)
        if resp.status_code != 200:
            return []
        ns = {"atom": "http://www.w3.org/2005/Atom"}
        root = ET.fromstring(resp.text)
        return [_parse_arxiv_entry(e, ns) for e in root.findall("atom:entry", ns)]
    except (requests.RequestException, ET.ParseError):
        return []


def resolve_doi(doi: str) -> Optional[dict]:
    try:
        resp = requests.get(f"{CROSSREF_BASE}/{doi}", timeout=TIMEOUT)
        if resp.status_code != 200:
            return None
        msg = resp.json()["message"]
        authors = msg.get("author", [])
        year_parts = (msg.get("published") or {}).get("date-parts", [[0]])
        year = year_parts[0][0] if year_parts else 0
        return {
            "doi": msg.get("DOI", doi),
            "title": (msg.get("title") or [""])[0],
            "authors": [f"{a.get('given','')} {a.get('family','')}".strip() for a in authors],
            "year": year,
            "url": msg.get("URL", ""),
        }
    except (requests.RequestException, KeyError):
        return None


def deduplicate(papers: list[dict]) -> list[dict]:
    seen_dois: set[str] = set()
    result = []
    for p in papers:
        doi = p.get("doi", "")
        if doi and doi in seen_dois:
            continue
        if doi:
            seen_dois.add(doi)
        result.append(p)
    return result


def search_all(query: str, limit: int = 15) -> list[dict]:
    ss_papers = search_semantic_scholar(query, limit=limit)
    arxiv_papers = search_arxiv(query, limit=10)
    return deduplicate(ss_papers + arxiv_papers)


if __name__ == "__main__":
    import sys
    import json
    query = " ".join(sys.argv[1:]) if len(sys.argv) > 1 else "machine learning"
    results = search_all(query)
    print(json.dumps(results, ensure_ascii=False, indent=2))
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0/tools
~/.academic-agent/venv/bin/pytest tests/test_search_papers.py -v
```

Expected: `9 passed`

- [ ] **Step 5: Commit**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0
git add tools/search_papers.py tools/tests/test_search_papers.py
git commit -m "feat: add search_papers — Semantic Scholar + arXiv + Crossref"
```

---

## Task 4: citation_format.py

**Files:**
- Create: `tools/citation_format.py`
- Create: `tools/tests/test_citation_format.py`

Formats a paper dict into IEEE, APA, MLA, or Chicago citation string. Auto-detects style from venue name.

- [ ] **Step 1: Write failing tests**

Create `tools/tests/test_citation_format.py`:

```python
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))
import citation_format as cf

PAPER = {
    "title": "Deep Learning for Healthcare",
    "authors": ["Alice Smith", "Bob Jones"],
    "year": 2023,
    "doi": "10.1000/xyz",
    "url": "https://doi.org/10.1000/xyz",
}

PAPER_NO_DOI = {
    "title": "Arxiv Preprint",
    "authors": ["Carol White"],
    "year": 2024,
    "doi": "",
    "url": "https://arxiv.org/abs/2401.00001",
}


def test_ieee_format_with_doi():
    result = cf.format_ieee(PAPER)
    assert "A. Smith" in result or "Smith" in result
    assert "Deep Learning for Healthcare" in result
    assert "2023" in result
    assert "10.1000/xyz" in result


def test_ieee_format_no_doi_uses_url():
    result = cf.format_ieee(PAPER_NO_DOI)
    assert "arxiv.org" in result


def test_apa_format():
    result = cf.format_apa(PAPER)
    assert "Smith" in result
    assert "(2023)" in result
    assert "Deep Learning for Healthcare" in result


def test_mla_format():
    result = cf.format_mla(PAPER)
    assert "Smith" in result
    assert '"Deep Learning for Healthcare"' in result


def test_chicago_format():
    result = cf.format_chicago(PAPER)
    assert "Smith" in result
    assert "Deep Learning for Healthcare" in result
    assert "2023" in result


def test_detect_style_ieee():
    assert cf.detect_style("ICIE 2025") == "ieee"
    assert cf.detect_style("IEEE Transactions") == "ieee"
    assert cf.detect_style("ICIEAM") == "ieee"


def test_detect_style_apa():
    assert cf.detect_style("Journal of Psychology") == "apa"
    assert cf.detect_style("APA style") == "apa"


def test_detect_style_default_ieee():
    assert cf.detect_style("") == "ieee"
    assert cf.detect_style("Unknown Conference XYZ") == "ieee"


def test_format_dispatch():
    result = cf.format_citation(PAPER, style="ieee")
    assert "Deep Learning" in result
    result_apa = cf.format_citation(PAPER, style="apa")
    assert "(2023)" in result_apa


def test_format_unverified():
    paper = dict(PAPER, doi="10.9999/bad")
    result = cf.format_citation(paper, style="ieee", verified=False)
    assert "[UNVERIFIED]" in result
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0/tools
~/.academic-agent/venv/bin/pytest tests/test_citation_format.py -v 2>&1 | head -10
```

Expected: `ModuleNotFoundError: No module named 'citation_format'`

- [ ] **Step 3: Implement citation_format.py**

Create `tools/citation_format.py`:

```python
def _initials(name: str) -> str:
    parts = name.strip().split()
    if not parts:
        return ""
    last = parts[-1]
    firsts = " ".join(p[0] + "." for p in parts[:-1] if p)
    return f"{firsts} {last}".strip() if firsts else last


def _short_authors_ieee(authors: list[str]) -> str:
    if not authors:
        return "Unknown"
    formatted = [_initials(a) for a in authors[:3]]
    suffix = " et al." if len(authors) > 3 else ""
    return ", ".join(formatted) + suffix


def format_ieee(paper: dict, verified: bool = True) -> str:
    authors = _short_authors_ieee(paper.get("authors", []))
    title = paper.get("title", "Untitled")
    year = paper.get("year", "n.d.")
    doi = paper.get("doi", "")
    url = paper.get("url", "")
    ref = doi if doi else url
    base = f'{authors}, "{title}," {year}. doi: {ref}' if ref else f'{authors}, "{title}," {year}.'
    return f"[UNVERIFIED] {base}" if not verified else base


def format_apa(paper: dict, verified: bool = True) -> str:
    authors = paper.get("authors", [])
    if not authors:
        author_str = "Unknown"
    else:
        parts = [_initials(a) for a in authors[:6]]
        suffix = ", ... " + _initials(authors[-1]) if len(authors) > 6 else ""
        author_str = ", ".join(parts) + suffix
    title = paper.get("title", "Untitled")
    year = paper.get("year", "n.d.")
    doi = paper.get("doi", "")
    url = paper.get("url", "")
    ref = f" https://doi.org/{doi}" if doi else (f" {url}" if url else "")
    base = f"{author_str} ({year}). {title}.{ref}"
    return f"[UNVERIFIED] {base}" if not verified else base


def format_mla(paper: dict, verified: bool = True) -> str:
    authors = paper.get("authors", [])
    if not authors:
        author_str = "Unknown"
    elif len(authors) == 1:
        parts = authors[0].split()
        author_str = f"{parts[-1]}, {' '.join(parts[:-1])}" if len(parts) > 1 else parts[0]
    else:
        first = authors[0].split()
        author_str = f"{first[-1]}, {' '.join(first[:-1])}, et al." if len(first) > 1 else first[0]
    title = paper.get("title", "Untitled")
    year = paper.get("year", "n.d.")
    doi = paper.get("doi", "")
    url = paper.get("url", "")
    ref = f" doi:{doi}" if doi else (f" {url}" if url else "")
    base = f'{author_str}. "{title}." {year}.{ref}'
    return f"[UNVERIFIED] {base}" if not verified else base


def format_chicago(paper: dict, verified: bool = True) -> str:
    authors = paper.get("authors", [])
    if not authors:
        author_str = "Unknown"
    else:
        first = authors[0].split()
        first_str = f"{first[-1]}, {' '.join(first[:-1])}" if len(first) > 1 else first[0]
        rest = [_initials(a) for a in authors[1:3]]
        suffix = ", et al." if len(authors) > 3 else ""
        author_str = (first_str + ", " + ", ".join(rest) + suffix) if rest else first_str
    title = paper.get("title", "Untitled")
    year = paper.get("year", "n.d.")
    doi = paper.get("doi", "")
    url = paper.get("url", "")
    ref = f" https://doi.org/{doi}." if doi else (f" {url}." if url else "")
    base = f'{author_str}. "{title}." {year}.{ref}'
    return f"[UNVERIFIED] {base}" if not verified else base


_IEEE_KEYWORDS = {"ieee", "icie", "icieam", "icse", "acm", "iccv", "cvpr", "neurips", "iclr"}
_APA_KEYWORDS = {"apa", "psychology", "journal of", "behavior", "cognitive"}


def detect_style(venue: str) -> str:
    lower = venue.lower()
    if any(k in lower for k in _IEEE_KEYWORDS):
        return "ieee"
    if any(k in lower for k in _APA_KEYWORDS):
        return "apa"
    return "ieee"


_FORMATTERS = {
    "ieee": format_ieee,
    "apa": format_apa,
    "mla": format_mla,
    "chicago": format_chicago,
}


def format_citation(paper: dict, style: str = "ieee", verified: bool = True) -> str:
    formatter = _FORMATTERS.get(style.lower(), format_ieee)
    return formatter(paper, verified=verified)
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0/tools
~/.academic-agent/venv/bin/pytest tests/test_citation_format.py -v
```

Expected: `11 passed`

- [ ] **Step 5: Commit**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0
git add tools/citation_format.py tools/tests/test_citation_format.py
git commit -m "feat: add citation_format — IEEE/APA/MLA/Chicago with auto-detect"
```

---

## Task 5: pptx_builder.py

**Files:**
- Create: `tools/pptx_builder.py`
- Create: `tools/tests/test_pptx_builder.py`

Input: `slides.json` path + template PPTX path + images dir → output PPTX.

`slides.json` format:
```json
[
  {
    "index": 1,
    "title": "Introduction",
    "bullets": ["Point one", "Point two"],
    "image_path": "/path/to/image.png",
    "notes": "Speaker notes here"
  }
]
```

- [ ] **Step 1: Write failing tests**

Create `tools/tests/test_pptx_builder.py`:

```python
import json
import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))
import pptx_builder as pb
from pptx import Presentation
from pptx.util import Inches


@pytest.fixture
def template_path(tmp_path):
    prs = Presentation()
    prs.slide_width = Inches(13.33)
    prs.slide_height = Inches(7.5)
    path = tmp_path / "template.pptx"
    prs.save(str(path))
    return path


@pytest.fixture
def sample_slides():
    return [
        {"index": 1, "title": "Intro", "bullets": ["Point A", "Point B"], "image_path": "", "notes": ""},
        {"index": 2, "title": "Method", "bullets": ["Step 1"], "image_path": "", "notes": "Speaker note"},
    ]


def test_build_creates_output_file(tmp_path, template_path, sample_slides):
    slides_json = tmp_path / "slides.json"
    slides_json.write_text(json.dumps(sample_slides))
    output = tmp_path / "out.pptx"
    pb.build(str(slides_json), str(template_path), str(output))
    assert output.exists()


def test_build_correct_slide_count(tmp_path, template_path, sample_slides):
    slides_json = tmp_path / "slides.json"
    slides_json.write_text(json.dumps(sample_slides))
    output = tmp_path / "out.pptx"
    pb.build(str(slides_json), str(template_path), str(output))
    prs = Presentation(str(output))
    assert len(prs.slides) == 2


def test_build_slide_contains_title(tmp_path, template_path, sample_slides):
    slides_json = tmp_path / "slides.json"
    slides_json.write_text(json.dumps(sample_slides))
    output = tmp_path / "out.pptx"
    pb.build(str(slides_json), str(template_path), str(output))
    prs = Presentation(str(output))
    texts = " ".join(
        shape.text for slide in prs.slides for shape in slide.shapes if shape.has_text_frame
    )
    assert "Intro" in texts
    assert "Method" in texts


def test_build_with_image(tmp_path, template_path):
    img_path = tmp_path / "img.png"
    # Create minimal valid PNG (1x1 white pixel)
    png_bytes = (
        b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01'
        b'\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00'
        b'\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18'
        b'\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
    )
    img_path.write_bytes(png_bytes)
    slides = [{"index": 1, "title": "With Image", "bullets": [], "image_path": str(img_path), "notes": ""}]
    slides_json = tmp_path / "slides.json"
    slides_json.write_text(json.dumps(slides))
    output = tmp_path / "out.pptx"
    pb.build(str(slides_json), str(template_path), str(output))
    assert output.exists()


def test_build_missing_template_raises(tmp_path, sample_slides):
    slides_json = tmp_path / "slides.json"
    slides_json.write_text(json.dumps(sample_slides))
    output = tmp_path / "out.pptx"
    with pytest.raises(FileNotFoundError):
        pb.build(str(slides_json), str(tmp_path / "missing.pptx"), str(output))
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0/tools
~/.academic-agent/venv/bin/pytest tests/test_pptx_builder.py -v 2>&1 | head -10
```

Expected: `ModuleNotFoundError: No module named 'pptx_builder'`

- [ ] **Step 3: Implement pptx_builder.py**

Create `tools/pptx_builder.py`:

```python
import json
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor


def _add_slide(prs: Presentation, slide_data: dict) -> None:
    layout = prs.slide_layouts[6]  # blank layout
    slide = prs.slides.add_slide(layout)
    width = prs.slide_width
    height = prs.slide_height

    # Title box — top strip
    title_box = slide.shapes.add_textbox(Inches(0.3), Inches(0.2), width - Inches(0.6), Inches(1.0))
    tf = title_box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = slide_data.get("title", "")
    p.runs[0].font.size = Pt(28)
    p.runs[0].font.bold = True
    p.runs[0].font.color.rgb = RGBColor(0x22, 0x22, 0x44)

    # Bullets — left half (or full width if no image)
    image_path = slide_data.get("image_path", "")
    has_image = bool(image_path) and Path(image_path).exists()
    bullet_width = width * 0.5 if has_image else width - Inches(0.6)

    bullet_box = slide.shapes.add_textbox(Inches(0.3), Inches(1.4), bullet_width, height - Inches(1.8))
    btf = bullet_box.text_frame
    btf.word_wrap = True
    for i, bullet in enumerate(slide_data.get("bullets", [])):
        para = btf.paragraphs[0] if i == 0 else btf.add_paragraph()
        para.text = f"• {bullet}"
        para.runs[0].font.size = Pt(18)

    # Image — right half
    if has_image:
        img_left = width * 0.52
        img_top = Inches(1.2)
        img_width = width * 0.46
        img_height = height - Inches(1.5)
        slide.shapes.add_picture(image_path, img_left, img_top, img_width, img_height)

    # Speaker notes
    notes_text = slide_data.get("notes", "")
    if notes_text:
        notes_slide = slide.notes_slide
        notes_slide.notes_text_frame.text = notes_text


def build(slides_json_path: str, template_path: str, output_path: str) -> None:
    tpl = Path(template_path)
    if not tpl.exists():
        raise FileNotFoundError(f"Template not found: {template_path}")

    slides_data = json.loads(Path(slides_json_path).read_text())
    prs = Presentation(str(tpl))

    # Remove template slides (keep slide masters/layouts)
    xml_slides = prs.slides._sldIdLst
    for _ in range(len(prs.slides)):
        slide_id = prs.slides._sldIdLst[0]
        prs.slides._sldIdLst.remove(slide_id)

    for slide_data in slides_data:
        _add_slide(prs, slide_data)

    prs.save(output_path)


if __name__ == "__main__":
    import sys
    if len(sys.argv) != 4:
        print("Usage: pptx_builder.py slides.json template.pptx output.pptx")
        sys.exit(1)
    build(sys.argv[1], sys.argv[2], sys.argv[3])
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0/tools
~/.academic-agent/venv/bin/pytest tests/test_pptx_builder.py -v
```

Expected: `5 passed`

- [ ] **Step 5: Commit**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0
git add tools/pptx_builder.py tools/tests/test_pptx_builder.py
git commit -m "feat: add pptx_builder — slides.json + template → PPTX"
```

---

## Task 6: dalle_generate.py + sd_generate.py

**Files:**
- Create: `tools/dalle_generate.py`
- Create: `tools/sd_generate.py`
- Create: `tools/tests/test_dalle_generate.py`
- Create: `tools/tests/test_sd_generate.py`

- [ ] **Step 1: Write failing tests for dalle_generate**

Create `tools/tests/test_dalle_generate.py`:

```python
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))
import dalle_generate as dg


def test_generate_returns_png_path(tmp_path):
    mock_img_data = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR' + b'\x00' * 100
    mock_client = MagicMock()
    mock_client.images.generate.return_value = MagicMock(
        data=[MagicMock(b64_json=__import__('base64').b64encode(mock_img_data).decode())]
    )
    with patch("dalle_generate.openai.OpenAI", return_value=mock_client):
        result = dg.generate("a scientific diagram of neural networks", str(tmp_path / "out.png"))
    assert result.endswith(".png")
    assert Path(result).exists()


def test_generate_no_api_key_raises():
    with patch.dict("os.environ", {}, clear=True):
        with patch("dalle_generate.openai.OpenAI") as mock_cls:
            mock_cls.side_effect = Exception("No API key")
            with pytest.raises(Exception):
                dg.generate("prompt", "/tmp/out.png")


def test_generate_api_error_raises(tmp_path):
    mock_client = MagicMock()
    mock_client.images.generate.side_effect = Exception("API error")
    with patch("dalle_generate.openai.OpenAI", return_value=mock_client):
        with pytest.raises(Exception, match="API error"):
            dg.generate("prompt", str(tmp_path / "out.png"))
```

- [ ] **Step 2: Write failing tests for sd_generate**

Create `tools/tests/test_sd_generate.py`:

```python
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))
import sd_generate as sg


PNG_BYTES = (
    b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01'
    b'\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00'
    b'\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18'
    b'\xd8N\x00\x00\x00\x00IEND\xaeB`\x82'
)


def test_generate_returns_png_path(tmp_path):
    import base64
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {"images": [base64.b64encode(PNG_BYTES).decode()]}
    with patch("requests.post", return_value=mock_resp):
        result = sg.generate("a neural network diagram", str(tmp_path / "out.png"))
    assert result.endswith(".png")
    assert Path(result).exists()


def test_generate_server_unavailable_raises(tmp_path):
    import requests as req
    with patch("requests.post", side_effect=req.ConnectionError("refused")):
        with pytest.raises(req.ConnectionError):
            sg.generate("prompt", str(tmp_path / "out.png"))


def test_is_available_true():
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    with patch("requests.get", return_value=mock_resp):
        assert sg.is_available() is True


def test_is_available_false():
    import requests as req
    with patch("requests.get", side_effect=req.ConnectionError()):
        assert sg.is_available() is False
```

- [ ] **Step 3: Run tests — expect FAIL**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0/tools
~/.academic-agent/venv/bin/pytest tests/test_dalle_generate.py tests/test_sd_generate.py -v 2>&1 | head -10
```

Expected: `ModuleNotFoundError`

- [ ] **Step 4: Implement dalle_generate.py**

Create `tools/dalle_generate.py`:

```python
import base64
import os
from pathlib import Path
import openai


def generate(prompt: str, output_path: str, size: str = "1792x1024") -> str:
    client = openai.OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    response = client.images.generate(
        model="dall-e-3",
        prompt=prompt,
        n=1,
        size=size,
        response_format="b64_json",
    )
    img_data = base64.b64decode(response.data[0].b64_json)
    Path(output_path).write_bytes(img_data)
    return output_path


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Usage: dalle_generate.py 'prompt' output.png")
        sys.exit(1)
    print(generate(sys.argv[1], sys.argv[2]))
```

- [ ] **Step 5: Implement sd_generate.py**

Create `tools/sd_generate.py`:

```python
import base64
import os
from pathlib import Path
import requests

SD_URL = os.getenv("SD_API_URL", "http://localhost:7860")
TIMEOUT = 120


def is_available() -> bool:
    try:
        resp = requests.get(f"{SD_URL}/sdapi/v1/sd-models", timeout=5)
        return resp.status_code == 200
    except requests.RequestException:
        return False


def generate(prompt: str, output_path: str, steps: int = 25, cfg_scale: float = 7.0) -> str:
    payload = {
        "prompt": prompt,
        "negative_prompt": "blurry, low quality, text, watermark",
        "steps": steps,
        "cfg_scale": cfg_scale,
        "width": 1024,
        "height": 576,
    }
    resp = requests.post(f"{SD_URL}/sdapi/v1/txt2img", json=payload, timeout=TIMEOUT)
    resp.raise_for_status()
    img_data = base64.b64decode(resp.json()["images"][0])
    Path(output_path).write_bytes(img_data)
    return output_path


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 3:
        print("Usage: sd_generate.py 'prompt' output.png")
        sys.exit(1)
    print(generate(sys.argv[1], sys.argv[2]))
```

- [ ] **Step 6: Run tests — expect PASS**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0/tools
~/.academic-agent/venv/bin/pytest tests/test_dalle_generate.py tests/test_sd_generate.py -v
```

Expected: `7 passed`

- [ ] **Step 7: Commit**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0
git add tools/dalle_generate.py tools/sd_generate.py tools/tests/test_dalle_generate.py tools/tests/test_sd_generate.py
git commit -m "feat: add dalle_generate + sd_generate with fallback detection"
```

---

## Task 7: researcher.md subagent skill

**Files:**
- Create: `skills/subagents/researcher.md`

This skill is invoked by the orchestrator as a subagent. It receives a topic, queries APIs via `search_papers.py`, and outputs `papers.json` to the session directory.

- [ ] **Step 1: Create researcher.md**

Create `skills/subagents/researcher.md`:

````markdown
---
name: academic-researcher
description: Search Semantic Scholar, arXiv, and Crossref for papers relevant to a research topic. Outputs papers.json to the session directory.
---

# Academic Researcher Subagent

You are a research assistant that finds and curates scientific papers.

## Input (provided by orchestrator)

- `TOPIC`: the research topic/question
- `SESSION_DIR`: absolute path to the session directory (e.g., `~/.academic-agent/sessions/<id>`)
- `TOOLS_DIR`: absolute path to the tools directory
- `LANG`: output language (en or ru)
- `LIMIT`: number of papers to retrieve (default: 15)

## Instructions

1. Run the paper search tool:

```bash
PYTHON="~/.academic-agent/venv/bin/python3"
$PYTHON "$TOOLS_DIR/search_papers.py" "$TOPIC" > "$SESSION_DIR/papers.json"
```

If the script exits non-zero, report the error and stop.

2. Read `papers.json` and present the results to the orchestrator in this format:

```
Found N papers:

1. [Authors, Year] Title
   DOI: ... | Source: semantic_scholar/arxiv
   Abstract: first 120 chars...

2. ...
```

3. If fewer than 5 papers found, note this. The orchestrator will inform the user.

4. Return the papers as structured data — do NOT filter or remove papers yourself. The user will do that at Checkpoint 1.

## Output

- File written: `$SESSION_DIR/papers.json`
- Summary table printed for orchestrator to display to user
````

- [ ] **Step 2: Verify file created**

```bash
ls ~/.claude/plugins/cache/local/academic-agent/1.0.0/skills/subagents/researcher.md
```

- [ ] **Step 3: Commit**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0
git add skills/subagents/researcher.md
git commit -m "feat: add researcher subagent skill"
```

---

## Task 8: writer.md subagent skill

**Files:**
- Create: `skills/subagents/writer.md`

Two modes: outline generation and full draft generation. Uses `papers.json` from session.

- [ ] **Step 1: Create writer.md**

Create `skills/subagents/writer.md`:

````markdown
---
name: academic-writer
description: Writes scientific article outline and full draft using approved source papers. Inserts [CITE:doi] placeholders for citations.
---

# Academic Writer Subagent

You are an expert scientific writer. You produce academic content in formal, precise language.

## Input

- `MODE`: "outline" or "draft"
- `SESSION_DIR`: path to session directory
- `TOPIC`: research topic
- `VENUE`: conference/journal name (may be empty)
- `LANG`: en or ru

## Mode: outline

Read `$SESSION_DIR/papers.json`. Based on the topic and papers, generate an article structure:

```
# [Article Title]

## Abstract (150–250 words)
[placeholder description]

## 1. Introduction
- Motivation
- Problem statement
- Contributions (3 bullet points)

## 2. Related Work
- Subtopic A
- Subtopic B

## 3. Methodology
- [main approach]

## 4. Results
- [expected result types]

## 5. Discussion
- [interpretation approach]

## 6. Conclusion
- [summary approach]

## References
[will be filled by citation-checker]
```

Save to `$SESSION_DIR/outline.md`.

## Mode: draft

Read `$SESSION_DIR/outline.md` and `$SESSION_DIR/papers.json`.

Write each section fully:
- Academic formal style (no casual language, no first person "I")
- Use "we" for multi-author convention or passive voice
- Cite papers inline: `[CITE:10.1000/doi]` — use actual DOIs from papers.json
- If a paper has no DOI, use URL as identifier: `[CITE:url:https://arxiv.org/...]`
- Target length: 4000–7000 words total
- Do NOT write the References section — citation-checker handles that

Save to `$SESSION_DIR/draft.md`.

## Style Rules

- Every claim needs a citation
- Technical terms defined on first use
- No marketing language ("novel", "revolutionary", "state-of-the-art" unless citing a paper that uses it)
- Numbers < 10 spelled out; ≥ 10 as digits
- Figures referenced as "Fig. 1" (even if no actual figure — mark as `[FIGURE_PLACEHOLDER: description]`)
````

- [ ] **Step 2: Commit**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0
git add skills/subagents/writer.md
git commit -m "feat: add writer subagent skill — outline + draft modes"
```

---

## Task 9: citation-checker.md subagent skill

**Files:**
- Create: `skills/subagents/citation-checker.md`

Resolves all `[CITE:doi]` placeholders via `citation_format.py`, builds Reference List, produces `final.md`.

- [ ] **Step 1: Create citation-checker.md**

Create `skills/subagents/citation-checker.md`:

````markdown
---
name: academic-citation-checker
description: Resolves [CITE:doi] placeholders in draft.md via Crossref, formats reference list, produces final.md.
---

# Citation Checker Subagent

## Input

- `SESSION_DIR`: path to session directory
- `TOOLS_DIR`: path to tools directory
- `STYLE`: citation style (ieee/apa/mla/chicago) — if empty, auto-detect from venue
- `VENUE`: conference/journal name (used for auto-detect)

## Instructions

1. Read `$SESSION_DIR/draft.md`

2. Extract all `[CITE:doi]` and `[CITE:url:...]` placeholders with regex

3. For each DOI, verify via Crossref using `citation_format.py`:

```bash
PYTHON="~/.academic-agent/venv/bin/python3"
# Inline verification:
$PYTHON -c "
import sys; sys.path.insert(0, '$TOOLS_DIR')
import search_papers, citation_format, json

doi = '$DOI'
result = search_papers.resolve_doi(doi)
style = citation_format.detect_style('$VENUE') if not '$STYLE' else '$STYLE'
if result:
    print(citation_format.format_citation(result, style=style, verified=True))
else:
    print(citation_format.format_citation({'title': 'Unknown', 'authors': [], 'year': '', 'doi': doi, 'url': ''}, style=style, verified=False))
"
```

4. Replace each `[CITE:doi]` inline marker with numbered reference `[N]` (IEEE) or `(Author, Year)` (APA/Chicago/MLA)

5. Append `## References` section at end of document with formatted list

6. Mark unresolved DOIs with `[UNVERIFIED]` in the reference entry AND add a warning summary at top of output

7. Save result to `$SESSION_DIR/final.md`

## Output Format

```
## References

[1] A. Smith, "Deep Learning for Healthcare," 2023. doi: 10.1000/xyz
[2] [UNVERIFIED] B. Jones, "Unknown Paper," 2022. doi: 10.9999/bad
```

Report counts: "Verified: N | Unverified: M"
````

- [ ] **Step 2: Commit**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0
git add skills/subagents/citation-checker.md
git commit -m "feat: add citation-checker subagent skill"
```

---

## Task 10: slide-designer.md subagent skill

**Files:**
- Create: `skills/subagents/slide-designer.md`

Reads `final.md` (or a provided file), produces `slides.json` and a draft PPTX without images.

- [ ] **Step 1: Create slide-designer.md**

Create `skills/subagents/slide-designer.md`:

````markdown
---
name: academic-slide-designer
description: Decomposes a scientific article into presentation slides. Generates slides.json and a draft PPTX without images.
---

# Slide Designer Subagent

## Input

- `SESSION_DIR`: path to session directory
- `TOOLS_DIR`: path to tools directory
- `SOURCE_FILE`: path to article file (default: `$SESSION_DIR/final.md`)
- `TEMPLATE_PATH`: path to PPTX template (default: `~/.academic-agent/default-template.pptx`)
- `SLIDE_COUNT_MIN`: 12 (default)
- `SLIDE_COUNT_MAX`: 20 (default)

## Instructions

1. Read `$SOURCE_FILE`

2. Decompose into slides following this mandatory structure:

| Slide | Content |
|-------|---------|
| 1 | Title slide: article title + authors + venue + year |
| 2 | Agenda / Table of Contents |
| 3–4 | Introduction & Motivation |
| 5–6 | Related Work (group into 2–3 themes) |
| 7–9 | Methodology (one slide per major step) |
| 10–12 | Results (one slide per key finding) |
| 13 | Discussion |
| 14 | Conclusion + Future Work |
| 15 | References (top 5–8 only) |
| 16 | Q&A / Thank You |

3. For each slide, produce a JSON entry:

```json
{
  "index": 1,
  "title": "slide title",
  "bullets": ["bullet 1", "bullet 2", "bullet 3"],
  "image_prompt": "scientific illustration of [topic], academic style, clean white background, high detail",
  "notes": "speaker notes for this slide"
}
```

Rules:
- Max 5 bullets per slide, max 10 words per bullet
- `image_prompt` must be specific — describe the actual content, not "presentation slide"
- Title slide: `image_prompt` = "" (no image needed)
- References slide: `image_prompt` = ""

4. Save `slides.json` to `$SESSION_DIR/slides.json`

5. Build draft PPTX (no images):

```bash
PYTHON="~/.academic-agent/venv/bin/python3"
# Set image_path to "" for all slides temporarily
$PYTHON -c "
import sys, json
sys.path.insert(0, '$TOOLS_DIR')
import pptx_builder
slides = json.loads(open('$SESSION_DIR/slides.json').read())
for s in slides:
    s['image_path'] = ''
import tempfile, json as j
tmp = '$SESSION_DIR/slides_no_img.json'
open(tmp,'w').write(j.dumps(slides))
pptx_builder.build(tmp, '$TEMPLATE_PATH', '$SESSION_DIR/slides_draft.pptx')
print('draft PPTX created')
"
```

6. Report: "Created N slides. Draft PPTX saved to `$SESSION_DIR/slides_draft.pptx`"
````

- [ ] **Step 2: Commit**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0
git add skills/subagents/slide-designer.md
git commit -m "feat: add slide-designer subagent skill"
```

---

## Task 11: image-generator.md subagent skill

**Files:**
- Create: `skills/subagents/image-generator.md`

Generates one image per slide using DALL-E 3 (primary) or SD A1111 (fallback). Inserts images into PPTX.

- [ ] **Step 1: Create image-generator.md**

Create `skills/subagents/image-generator.md`:

````markdown
---
name: academic-image-generator
description: Generates images for each slide using DALL-E 3 with SD A1111 fallback. Inserts images into PPTX and produces final_presentation.pptx.
---

# Image Generator Subagent

## Input

- `SESSION_DIR`: path to session directory
- `TOOLS_DIR`: path to tools directory
- `TEMPLATE_PATH`: path to PPTX template

## Instructions

1. Read `$SESSION_DIR/slides.json`

2. Check which image backend is available:

```bash
PYTHON="~/.academic-agent/venv/bin/python3"
$PYTHON -c "
import sys; sys.path.insert(0, '$TOOLS_DIR')
import sd_generate, os
dalle_ok = bool(os.getenv('OPENAI_API_KEY'))
sd_ok = sd_generate.is_available()
print(f'DALLE={dalle_ok} SD={sd_ok}')
"
```

3. For each slide where `image_prompt != ""`:

   a. Build output path: `$SESSION_DIR/images/slide_<index>.png`

   b. Try DALL-E 3 first (if `OPENAI_API_KEY` set):

   ```bash
   $PYTHON "$TOOLS_DIR/dalle_generate.py" "$IMAGE_PROMPT" "$SESSION_DIR/images/slide_$INDEX.png"
   ```

   c. If DALL-E fails or unavailable, try SD A1111:

   ```bash
   $PYTHON "$TOOLS_DIR/sd_generate.py" "$IMAGE_PROMPT" "$SESSION_DIR/images/slide_$INDEX.png"
   ```

   d. If both fail: set `image_path = ""` and note `[IMAGE_PLACEHOLDER]` for this slide.

   e. On success: update the slide entry in memory with `"image_path": "$SESSION_DIR/images/slide_$INDEX.png"`

4. After all images generated, write updated slides to `$SESSION_DIR/slides_final.json`

5. Build final PPTX:

```bash
$PYTHON "$TOOLS_DIR/pptx_builder.py" \
  "$SESSION_DIR/slides_final.json" \
  "$TEMPLATE_PATH" \
  "$SESSION_DIR/final_presentation.pptx"
```

6. Report:
   - Images generated: N / M slides
   - Placeholders remaining: K (if any)
   - Output: `$SESSION_DIR/final_presentation.pptx`
````

- [ ] **Step 2: Commit**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0
git add skills/subagents/image-generator.md
git commit -m "feat: add image-generator subagent skill — DALL-E + SD fallback"
```

---

## Task 12: academic-agent.md orchestrator skill

**Files:**
- Create: `skills/academic-agent.md`

The main entry point. Parses flags, manages 5 checkpoints, dispatches subagents.

- [ ] **Step 1: Create academic-agent.md**

Create `skills/academic-agent.md`:

````markdown
---
name: academic-agent
description: Orchestrates the full pipeline for writing scientific articles and PPTX presentations. Dispatches researcher, writer, citation-checker, slide-designer, and image-generator subagents with user validation at 5 checkpoints.
---

# Academic Agent Orchestrator

## Invocation Syntax

```
/academic-agent "topic" [--venue NAME] [--lang ru|en]
/academic-agent --slides "topic" [--template path/to/template.pptx]
/academic-agent --slides --from path/to/article.md [--template path/to/template.pptx]
/academic-agent --resume <session-id>
/academic-agent --set-template path/to/template.pptx
```

## Constants

```
TOOLS_DIR = ~/.claude/plugins/cache/local/academic-agent/1.0.0/tools
BASE_DIR   = ~/.academic-agent
VENV_PYTHON = ~/.academic-agent/venv/bin/python3
```

## Flag Handling

Parse the invocation arguments before doing anything else:

| Flag | Effect |
|------|--------|
| `--venue NAME` | Passed to writer + citation-checker for style detection |
| `--lang ru\|en` | Default: en. Writer produces content in this language |
| `--slides` | Slides-only mode: skip article writing |
| `--from FILE` | Use FILE as final.md instead of writing article |
| `--template PATH` | Use this PPTX template for the session |
| `--resume SID` | Load existing session, show completed steps, resume from next |
| `--set-template PATH` | Copy PATH to `~/.academic-agent/user-template.pptx` and exit |

## Template Resolution

```
if --template PATH provided → use PATH
else if ~/.academic-agent/user-template.pptx exists → use it
else → use ~/.academic-agent/default-template.pptx
```

## --set-template Mode

```bash
cp "$PATH" ~/.academic-agent/user-template.pptx
echo "Global template updated: ~/.academic-agent/user-template.pptx"
```

Then exit.

## --resume Mode

1. Read `~/.academic-agent/sessions/<SID>/meta.json`
2. Print: "Session <SID>: topic='...', completed steps: [...]"
3. Ask user: "Continue from step N? (yes/no)"
4. If yes, continue pipeline from the first incomplete step

## Full Pipeline (no --slides flag)

### Step 1 — Research

Dispatch `researcher` subagent with:
- `TOPIC`, `SESSION_DIR`, `TOOLS_DIR`, `LANG`

After subagent completes:

**CHECKPOINT 1 — show results to user:**
```
Found N papers. Please review:

[numbered list from papers.json]

Actions:
  - Type numbers to REMOVE (e.g., "remove 3 7 12")
  - Type "ok" to approve all
  - Type "more" to search additional sources
```

Wait for user response. Apply removals to `papers.json`. Save approved papers.

### Step 2 — Outline

Dispatch `writer` subagent with `MODE=outline`.

**CHECKPOINT 2:**
```
Article outline:
[content of outline.md]

Actions:
  - Type changes ("add section X", "remove Y", "rename Z to W")
  - Type "ok" to approve
```

Apply changes to `outline.md`.

### Step 3 — Full Draft

Dispatch `writer` subagent with `MODE=draft`.

**CHECKPOINT 3:**
```
Draft complete (~N words). Preview:
[first 300 chars of each section]

Actions:
  - Describe changes ("section 2 needs more detail on X", "shorten conclusion")
  - Type "ok" to approve
  - Type "show section N" to see full section
```

If changes requested, re-dispatch `writer` with specific instructions.

### Step 4 — Citations

Dispatch `citation-checker` subagent.

**CHECKPOINT 4:**
```
Citations resolved: N verified, M unverified
[unverified list if any]

final.md ready.
Actions:
  - "ok" to approve
  - "show references" to see full Reference List
```

### Step 5 — Slides

Dispatch `slide-designer` subagent.

**CHECKPOINT 5:**
```
Created N slides. Draft PPTX: $SESSION_DIR/slides_draft.pptx

Slide structure:
[numbered list: index. Title — N bullets]

Actions:
  - Describe changes ("slide 5 title should be X", "merge slides 8 and 9")
  - "ok" to generate images
```

If changes requested, re-dispatch `slide-designer`.

### Step 6 — Images (no checkpoint — runs automatically after Checkpoint 5 approval)

Dispatch `image-generator` subagent. Show progress per slide.

On completion:
```
Presentation complete!
Article:      $SESSION_DIR/final.md
Presentation: $SESSION_DIR/final_presentation.pptx
Session ID:   <SID> (resume with /academic-agent --resume <SID>)
```

## Slides-Only Pipeline (--slides flag)

### Without --from:
Run Steps 1 (research) → condensed Step 3 (writer produces short summary, not full article) → Step 5 → Step 6.
Skip Steps 2 (outline) and 4 (citations).

### With --from FILE:
Copy FILE to `$SESSION_DIR/final.md`. Skip Steps 1–4.
Run Steps 5 → 6 directly.

## Error Policy

- If any subagent fails, display the error and ask: "Retry? (yes/no/skip)"
- Never silently continue past a failed step
- Session state is saved after each completed step — user can always --resume
````

- [ ] **Step 2: Commit**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0
git add skills/academic-agent.md
git commit -m "feat: add academic-agent orchestrator skill — full pipeline with 5 checkpoints"
```

---

## Task 13: Integration Test + Final Verification

**Files:**
- Create: `tools/tests/test_integration.py`

- [ ] **Step 1: Run full unit test suite**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0/tools
~/.academic-agent/venv/bin/pytest tests/ -v --tb=short
```

Expected: all tests pass. Fix any failures before continuing.

- [ ] **Step 2: Write integration test for search → format pipeline**

Create `tools/tests/test_integration.py`:

```python
import json
import sys
from pathlib import Path
from unittest.mock import patch, MagicMock
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent))
import search_papers as sp
import citation_format as cf
import session_manager as sm
import pptx_builder as pb
from pptx import Presentation


@pytest.fixture(autouse=True)
def tmp_session(tmp_path, monkeypatch):
    monkeypatch.setattr(sm, "BASE_DIR", tmp_path)
    monkeypatch.setattr(sm, "SESSIONS_DIR", tmp_path / "sessions")
    (tmp_path / "sessions").mkdir()
    return tmp_path


def test_search_format_pipeline():
    """Research → citation format produces a valid formatted string."""
    paper = {
        "title": "Test Paper on ML",
        "authors": ["John Doe", "Jane Smith"],
        "year": 2023,
        "doi": "10.1/test",
        "url": "https://example.com",
        "source": "semantic_scholar",
    }
    style = cf.detect_style("ICIE 2024")
    assert style == "ieee"
    citation = cf.format_citation(paper, style=style, verified=True)
    assert "Test Paper on ML" in citation
    assert "2023" in citation


def test_session_persist_and_reload():
    """Create session, save papers step, reload correctly."""
    sid = sm.create_session("AI in healthcare", venue="ICIE", lang="en")
    papers = [{"title": "Paper A", "doi": "10.1/a", "year": 2023}]
    sm.save_step(sid, "papers", papers)

    reloaded = sm.load_step(sid, "papers")
    assert reloaded[0]["title"] == "Paper A"

    sessions = sm.list_sessions()
    assert any(s["id"] == sid for s in sessions)


def test_pptx_pipeline(tmp_path):
    """slides.json → PPTX → correct slide count and title presence."""
    from pptx import Presentation
    from pptx.util import Inches

    tpl_path = tmp_path / "tpl.pptx"
    prs = Presentation()
    prs.slide_width = Inches(13.33)
    prs.slide_height = Inches(7.5)
    prs.save(str(tpl_path))

    slides = [
        {"index": 1, "title": "Introduction to AI", "bullets": ["Point A", "Point B"], "image_path": "", "notes": ""},
        {"index": 2, "title": "Methodology", "bullets": ["Method 1"], "image_path": "", "notes": ""},
    ]
    slides_path = tmp_path / "slides.json"
    slides_path.write_text(json.dumps(slides))
    output_path = tmp_path / "final.pptx"

    pb.build(str(slides_path), str(tpl_path), str(output_path))

    result = Presentation(str(output_path))
    assert len(result.slides) == 2
    all_text = " ".join(
        shape.text for slide in result.slides for shape in slide.shapes if shape.has_text_frame
    )
    assert "Introduction to AI" in all_text
    assert "Methodology" in all_text
```

- [ ] **Step 3: Run integration tests**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0/tools
~/.academic-agent/venv/bin/pytest tests/test_integration.py -v
```

Expected: `3 passed`

- [ ] **Step 4: Verify plugin structure**

```bash
find ~/.claude/plugins/cache/local/academic-agent -type f | sort
```

Expected output includes:
```
.../1.0.0/package.json
.../1.0.0/skills/academic-agent.md
.../1.0.0/skills/subagents/citation-checker.md
.../1.0.0/skills/subagents/image-generator.md
.../1.0.0/skills/subagents/researcher.md
.../1.0.0/skills/subagents/slide-designer.md
.../1.0.0/skills/subagents/writer.md
.../1.0.0/tools/citation_format.py
.../1.0.0/tools/dalle_generate.py
.../1.0.0/tools/pptx_builder.py
.../1.0.0/tools/sd_generate.py
.../1.0.0/tools/sd_generate.py
.../1.0.0/tools/search_papers.py
.../1.0.0/tools/session_manager.py
```

- [ ] **Step 5: Smoke test — slides from existing file**

```bash
# Create a minimal test article
cat > /tmp/test_article.md << 'EOF'
# Machine Learning in Healthcare

## Abstract
This paper explores applications of ML in patient diagnosis.

## Introduction
Healthcare faces growing data challenges. ML offers solutions.

## Methodology
We apply a CNN to medical imaging data from 500 patients.

## Results
Accuracy reached 94.2% on the test set.

## Conclusion
ML significantly improves diagnostic accuracy.
EOF

# Invoke agent in --slides --from mode (will use Claude to run the skill)
echo "Test article ready at /tmp/test_article.md"
echo "Invoke: /local:academic-agent --slides --from /tmp/test_article.md"
echo "Expected: slide-designer + image-generator run, final_presentation.pptx produced"
```

- [ ] **Step 6: Final commit**

```bash
cd ~/.claude/plugins/cache/local/academic-agent/1.0.0
git add tools/tests/test_integration.py
git commit -m "test: add integration test suite for search→format→session→pptx pipeline"
```

---

## Self-Review

**Spec coverage check:**

| Spec Requirement | Covered in Task |
|-----------------|----------------|
| `/academic-agent "topic"` full pipeline | Task 12 (orchestrator) |
| `/academic-agent --slides "topic"` | Task 12 (slides-only mode) |
| `/academic-agent --slides --from file` | Task 12 (slides-only with --from) |
| `/academic-agent --resume <id>` | Task 12 (--resume mode) |
| `/academic-agent --set-template` | Task 12 (--set-template mode) |
| Semantic Scholar + arXiv search | Task 3 (search_papers.py) |
| Crossref DOI resolution | Task 3 + Task 4 |
| IEEE/APA/MLA/Chicago citation format | Task 4 (citation_format.py) |
| Auto-detect citation style from venue | Task 4 (detect_style) |
| [UNVERIFIED] marking | Task 4 + Task 9 |
| PPTX from template | Task 5 (pptx_builder.py) |
| DALL-E 3 image generation | Task 6 (dalle_generate.py) |
| SD A1111 fallback | Task 6 (sd_generate.py) |
| [IMAGE_PLACEHOLDER] when both fail | Task 11 (image-generator skill) |
| 5 user checkpoints | Task 12 (orchestrator skill) |
| Session persistence + resume | Task 2 (session_manager.py) |
| Global user template | Task 1 + Task 2 (get_template) |
| Python venv isolation | Task 1 |
| Plugin registration | Task 1 |

**No placeholders found** — all steps contain concrete code or commands.

**Type consistency** — `papers.json` dict keys (`title`, `authors`, `year`, `doi`, `abstract`, `url`, `source`) consistent across search_papers.py, citation_format.py, researcher.md, writer.md, citation-checker.md.

**`slides.json` schema** (`index`, `title`, `bullets`, `image_path`, `notes`, `image_prompt`) consistent across slide-designer.md, image-generator.md, pptx_builder.py.
