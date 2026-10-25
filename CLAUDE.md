# CLAUDE.md

Instructions for Claude (Claude Code / Claude-based agents) in this repository.

The full, tool-agnostic project guide lives in **AGENTS.md** and is imported below so
there's a single source of truth. Database details are in **DATABASE.md**.

@AGENTS.md
@DATABASE.md

---

## Claude-Specific Workflow

- **Read before writing.** Before editing a page, open its `.html`, `.css`, and `.js` together —
  behaviour is often split across all three plus `frontend/shared/js/session.js`.
- **Plan non-trivial changes.** For anything touching more than one feature folder, or the
  backend schema, outline the plan and confirm with the user before editing.
- **Small, focused diffs.** Don't reformat files or reorder CSS you aren't changing.
- **Verify by running it.** There are no tests. After changes:
  1. `python run.py`
  2. Hit the affected endpoint in `http://127.0.0.1:8000/docs`, or load the affected page.
  3. Check the browser console for errors (the gateway logs failures with `console.warn/error`).
- **Windows environment.** The primary dev machine is Windows / PowerShell. Use
  PowerShell-compatible commands (`Remove-Item`, backslash paths) in instructions.
- **Keep docs in sync.** If you change routes, tables, folders, or pages, update
  `README.md`, `AGENTS.md`, and `DATABASE.md` in the same change.

## Quick Commands

```powershell
pip install -r backend/requirements.txt   # install deps
python run.py                             # run site + API on :8000
python backend/seed_rbac.py               # verify & seed RBAC accounts & triggers
Remove-Item backend\urbanscope.db         # reset DB (re-seeds on next start)
```

## Don'ts

- Don't introduce frameworks, bundlers, Tailwind, or npm packages unless asked.
- Don't rename `frontend/shared/js/supabase.js` or move folders without asking — paths are hard-coded
  across pages and in `backend/app.py`.
- Don't run `backend/supabase_schema.sql` against a live project (it drops tables).
- Don't commit `backend/urbanscope.db` or secrets.
