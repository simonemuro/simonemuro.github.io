# Simone Muro — Portfolio

Static portfolio site for `https://simonemuro.github.io/`.
Targeted at the **Staff Content Designer & Model UX Writer, Google Fi** role: leads with refining LLM
response quality, anchored in voice, and backed by judgment-first case studies.

## Structure

- `index.html` — homepage: thesis, proof bar, five case studies, career arc, six principles, contact.
- `case-credit-karma.html` — "See Why" & "Analyze My Wallet" (prompt engineering, regulated finance).
- `case-cancellation.html` — LLM savability classifier (retention, structured output).
- `case-voice-snippet.html` — GenAI voice support (voice AI, response evaluation).
- `case-omni-quality.html` — agentic-AI quality evaluation at scale (the recruiter's ask + leadership).
- `case-blueprint.html` — conversational AI design system (voice/tone + design patterns at scale).
- `resume.html` — printable résumé (browser print → Save as PDF).
- `styles.css` — shared visual system. `.nojekyll` — serve static files as-is.

## Local preview

```bash
cd simonemuro.github.io
python3 -m http.server 8000      # open http://localhost:8000
```

## Publish (GitHub Pages, deploy-from-branch on `main`)

```bash
git add -A
git commit -m "Rebuild portfolio for Google Fi role"
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
