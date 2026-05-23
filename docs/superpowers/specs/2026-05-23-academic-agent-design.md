# Academic Agent — Design Spec

**Date:** 2026-05-23
**Status:** Approved
**Author:** s.samusenko

---

## Problem

Writing scientific articles and conference presentations is time-consuming and requires:
- Finding and verifying relevant sources across multiple databases
- Maintaining academic style and proper citation formatting
- Generating visually coherent presentation slides with appropriate imagery
- Iterative user validation at each stage to allow corrections

## Goal

A local Claude Code skill `/academic-agent` that orchestrates specialized subagents to produce:
1. A fully-cited scientific article (Markdown)
2. A PPTX presentation with generated images

Everything runs locally on the user's machine — no cloud deployment, no remote services except external APIs (OpenAI DALL-E 3, Semantic Scholar, arXiv, Crossref).

---

## Entry Points

```bash
# Full pipeline — article + presentation
/academic-agent "topic" [--venue ICIE|APA|IEEE|...] [--lang ru|en]

# Presentation only — new topic
/academic-agent --slides "topic" [--template path/to/template.pptx]

# Presentation only — from existing article file
/academic-agent --slides --from final.md [--template path/to/template.pptx]

# Resume interrupted session
/academic-agent --resume <session-id>

# Save global PPTX template (persists across sessions)
/academic-agent --set-template path/to/template.pptx
```

---

## Architecture

```
User: /academic-agent "topic" [flags]
                    │
          Orchestrator skill
          academic-agent.md
                    │
   ┌────────┬───────┴───────┬────────────┬─────────────┐
   ▼        ▼               ▼            ▼              ▼
researcher  writer    citation-     slide-       image-
subagent   subagent   checker      designer     generator
                      subagent     subagent     subagent
   │        │               │            │              │
Semantic  Claude         Crossref    python-pptx   DALL-E 3 API
Scholar   API            API         + template    + SD localhost
arXiv                                              (fallback)
Crossref
```

---

## Data Flow

### Mode: Full pipeline (`/academic-agent "topic"`)
Steps 1 → 2 → 3 → 4 → 5 → 6

### Mode: Slides from existing file (`--slides --from final.md`)
Skips Steps 1–4. Starts at Step 5 using the provided file as `final.md`.

### Mode: Slides only — new topic (`--slides "topic"`)
Runs Steps 1 → condensed Step 3 (short summary, no full article) → Step 5 → Step 6.
No outline or citation check. Researcher still runs to gather context for the writer.
Output: `final_presentation.pptx` only (no `final.md`).

---

### Step 1 — Research (`researcher` subagent)
- Query Semantic Scholar: top-15 by relevance
- Query arXiv: recent preprints (≤3 years)
- Resolve DOIs via Crossref for each result
- Output: `papers.json` `{title, authors, year, doi, abstract, url}`

**✅ CHECKPOINT 1** — user approves / removes sources

### Step 2 — Outline (`writer` subagent)
- Input: `papers.json` + topic + venue
- Builds structure: Abstract / Introduction / Related Work / Methodology / Results / Discussion / Conclusion
- Output: `outline.md`

**✅ CHECKPOINT 2** — user edits structure

### Step 3 — Full Draft (`writer` subagent)
- Writes each section, inserts `[CITE:doi]` placeholders
- Academic style, 4000–8000 words
- Output: `draft.md`

**✅ CHECKPOINT 3** — user edits text

### Step 4 — Citation Check (`citation-checker` subagent)
- Resolves each `[CITE:doi]` via Crossref
- Auto-detects citation style from `--venue` flag, or asks user if not specified
- Supported styles: IEEE, APA, MLA, Chicago, Vancouver
- Formats Reference List
- Output: `final.md` with live citations

**✅ CHECKPOINT 4** — user approves final article

### Step 5 — Slide Design (`slide-designer` subagent)
- Reads `final.md`, splits into 12–20 slides
- Each slide: title + bullet points + `image_prompt`
- If `--template` provided (or global template set): reads colors, fonts, layout from template
- Otherwise: uses built-in minimal default
- Output: `slides.json` + `slides_draft.pptx` (without images)

**✅ CHECKPOINT 5** — user approves slide structure

### Step 6 — Image Generation (`image-generator` subagent)
- For each slide: DALL-E 3 via OpenAI API using `image_prompt`
- If DALL-E unavailable or `OPENAI_API_KEY` not set → Stable Diffusion at `http://localhost:7860` (A1111 API)
- If both unavailable → slide saved with `[IMAGE_PLACEHOLDER]` text, user notified
- Inserts images into `slides_draft.pptx` via `pptx_builder.py`
- Output: `final_presentation.pptx`

---

## Components

### Skills

| File | Role |
|------|------|
| `academic-agent.md` | Orchestrator — parses flags, launches subagents, manages checkpoints, session state |
| `subagents/researcher.md` | MCP calls to Semantic Scholar + arXiv + Crossref, relevance ranking |
| `subagents/writer.md` | Outline → Draft, academic style, citation placeholders |
| `subagents/citation-checker.md` | DOI resolution, style autodetect, Reference List formatting |
| `subagents/slide-designer.md` | Text → slides decomposition, image_prompt generation, template handling |
| `subagents/image-generator.md` | DALL-E 3 → SD fallback, image insertion into PPTX |

### MCP Servers (local, configured in `settings.json`)

```json
{
  "mcpServers": {
    "semantic-scholar": {
      "command": "npx",
      "args": ["-y", "@mcp-servers/semantic-scholar"]
    },
    "arxiv": {
      "command": "npx",
      "args": ["-y", "@mcp-servers/arxiv"]
    },
    "crossref": {
      "command": "npx",
      "args": ["-y", "@mcp-servers/crossref"]
    },
    "openai-image": {
      "command": "npx",
      "args": ["-y", "@mcp-servers/openai-image"],
      "env": { "OPENAI_API_KEY": "${OPENAI_API_KEY}" }
    }
  }
}
```

All MCP servers run as local Node processes — no remote deployment.

### Python Utilities (`tools/`)

| Script | Purpose |
|--------|---------|
| `pptx_builder.py` | Accepts `slides.json` + `template.pptx` → inserts text + images → saves `final.pptx` |
| `sd_generate.py` | Calls local Stable Diffusion A1111 API at `localhost:7860` → returns PNG path |
| `session_manager.py` | Creates/resumes sessions, persists state between checkpoints |

### Session Storage

```
~/.academic-agent/
  default-template.pptx      # built-in minimal template
  user-template.pptx          # optional global user template (set via --set-template)
  sessions/
    <session-id>/
      papers.json
      outline.md
      draft.md
      final.md
      slides.json
      images/
        slide_01.png
        slide_02.png
        ...
      final_presentation.pptx
```

---

## Environment Variables

```bash
OPENAI_API_KEY=sk-...             # required for DALL-E 3 image generation
SD_API_URL=http://localhost:7860  # Stable Diffusion A1111 (optional, fallback)
SEMANTIC_SCHOLAR_API_KEY=...      # optional — raises rate limit 100 → 1000 req/min
```

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| MCP server unavailable | Notifies user, offers to continue without that source |
| DALL-E unavailable / no API key | Auto-switches to SD; if SD also unavailable → `[IMAGE_PLACEHOLDER]` with warning |
| DOI not resolved in Crossref | Citation marked `[UNVERIFIED]`, user warned at Checkpoint 4 |
| User cancels at checkpoint | Session saved, resumable via `--resume <session-id>` |
| MCP request timeout | Retry × 3, then skip with notification |

---

## Testing Plan

- [ ] Unit: `session_manager.py` — create, save, resume session
- [ ] Unit: `pptx_builder.py` — inserts text + image into template correctly
- [ ] Unit: `sd_generate.py` — handles A1111 offline gracefully
- [ ] Integration: researcher subagent → valid `papers.json` from Semantic Scholar
- [ ] Integration: citation-checker → IEEE format for known DOI
- [ ] Integration: slide-designer → correct slide count from sample article
- [ ] E2E: full pipeline on short topic → `final.md` + `final_presentation.pptx` produced
- [ ] E2E: `--slides --from` mode → presentation from existing article
- [ ] E2E: `--resume` → correct continuation from saved session
