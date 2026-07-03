# Simone Muro · Portfolio (v4)

Static portfolio site for `https://simonemuro.github.io/`. Version 4: an AI behavior design
portfolio built around decisions told directly, replayable traces, and judgment-first case studies.

## Structure

- `index.html` · homepage: thesis, work index, refusal widget, contact.
- Case studies (numbered chain): `charge-lookup.html` (01, the shipped redesign and its
  numbers), `billing-skill.html` (02, the working skill build; build facts only, no shipped
  metrics), `payroll-intelligence.html` (03), `quality-program.html` (04),
  `cancellation-saves.html` (05), `voice.html` (06), `credit-karma.html` (07),
  `operate-with-ai.html` (08).
- `resume.html` · printable resume (browser print → Save as PDF). `404.html` · not-found page.
- `v4.css` / `v4.js` · shared visual system and interactions. `v5.css` / `v5-proto.js` · the
  v5 case layout and the target-state prototype player on the billing pair. `fonts/` · self-hosted webfonts.
- `V4-COMPONENTS.md` · component reference. `.nojekyll` · serve static files as-is.

The live-agent backend (Cloudflare Worker, skills, golden datasets, eval gate) lives in a
separate private repo (`portfolio-agent`); this site only carries the optional
`agent-endpoint` meta tag that points at the deployed worker.

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
proprietary prompts/system instructions, source code, or credentials. Use recreated examples,
sanitized before/afters, and approved metrics only.
