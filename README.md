# Simone Muro · Portfolio (v6)

Static portfolio site for `https://simonemuro.github.io/`. Version 6: an AI behavior design
portfolio built around real working artifacts, receipts-backed numbers, and judgment-first case studies.

## Structure

- `index.html` · homepage: thesis, work grid (flagship + era arc), contact.
- Case studies: `billing-skill.html` (01, the working skill build; build facts only, no shipped
  metrics), `charge-lookup.html` (02, the shipped redesign and its numbers),
  `payroll-intelligence.html` (03), `quality-program.html` (04),
  `cancellation-saves.html` (05), `voice.html` (06).
- `colophon.html` · the artifacts disclosure, how the site was made, type and tech.
  `operate-with-ai.html` is a redirect stub to it (the old Case 08, retired).
- `resume.html` · resume-request page. `404.html` · not-found page.
- `v4.css` / `v4.js` / `home.css` · homepage/resume/404 visual system and interactions.
  `v5.css` / `v6.css` / `v5-proto.js` · the case-page layout, the working-file artifact
  layer, and the target-state prototype player. `fonts/` · self-hosted webfonts.
- `V4-COMPONENTS.md` · component reference. `.nojekyll` · serve static files as-is.

The live-agent backend (Cloudflare Worker, skills, golden datasets, eval gate) lives in a
separate private repo (`portfolio-agent`); this site currently ships only a reserved,
inactive widget slot (an HTML comment on the homepage); no endpoint is wired.

## Local preview

```bash
cd simonemuro.github.io
python3 -m http.server 8000      # open http://localhost:8000
```

## Publish (GitHub Pages, deploy-from-branch on `main`)

```bash
git add -A
git commit -m "Update portfolio"
git push                          # Pages redeploys in ~1 minute
```

## Revert to the previous version

The original launched site is preserved:

```bash
git reset --hard original-launch     # local only; then `git push --force` to publish the revert
# or inspect it:  git checkout backup-original-launch
```

## Privacy rule (public-safe)

No raw internal datasets, internal URLs, customer data, employee names, internal screenshots,
source code, or credentials. No raw or unredacted proprietary prompts/system instructions;
redacted excerpts only, after the redaction gate. Use recreated examples, sanitized
before/afters, and approved metrics only.
