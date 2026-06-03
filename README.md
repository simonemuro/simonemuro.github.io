# Simone Muro — Portfolio

Static portfolio site for `https://simonemuro.github.io/`. A staff-level content design and model UX
writing portfolio: leads with LLM response quality, anchored in voice, and backed by judgment-first
case studies.

## Structure

- `index.html` — homepage: thesis, proof bar, four case studies, career arc, principles, contact.
- `case-credit-karma.html` — "See Why" & "Analyze My Wallet" (prompt engineering, regulated finance).
- `case-cancellation.html` — LLM savability classifier (retention, structured output).
- `case-voice-snippet.html` — GenAI voice support (voice AI, response evaluation).
- `case-quality-legacy.html` — agentic-AI quality evaluation at scale (response quality + leadership).
- `resume.html` — printable resume (browser print → Save as PDF).
- `styles.css` — shared visual system. `.nojekyll` — serve static files as-is.

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
