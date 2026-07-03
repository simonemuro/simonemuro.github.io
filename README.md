# Simone Muro · Portfolio (v4)

Static portfolio site for `https://simonemuro.github.io/`. Version 4: an AI behavior design
portfolio built around decisions told directly, replayable traces, and judgment-first case studies.

## Structure

- `index.html` · homepage: thesis, work index, refusal widget, contact.
- Case studies (numbered chain): `billing-skill.html`, `payroll-intelligence.html`,
  `quality-program.html`, `cancellation-saves.html`, `voice.html`, `credit-karma.html`,
  `operate-with-ai.html`.
- `resume.html` · printable resume (browser print → Save as PDF). `404.html` · not-found page.
- `v4.css` / `v4.js` · shared visual system and interactions. `fonts/` · self-hosted webfonts.
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
