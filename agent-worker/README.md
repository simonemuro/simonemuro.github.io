# Portfolio Agent: live mode (Cloudflare Worker + Claude)

The site's floating agent has two modes:
- **Curated mode** (active now): deterministic retrieval over answers Simone wrote and tested. Zero cost, zero risk, works forever.
- **Live mode**: real Claude conversations behind a guardrailed system prompt, grounded in the case studies, eval-tested against `eval/golden-qa.json` (including prompt-injection attempts).

## To turn on live mode (~10 minutes, needs Simone)

1. **Anthropic API key**: create one at console.anthropic.com → API Keys. Add $5–10 of credit; at a few dozen visitors this lasts months (each reply ≈ $0.01–0.02 on Sonnet).
2. **Cloudflare Worker** (free plan is plenty):
   - dash.cloudflare.com → Workers & Pages → Create → Worker → name it `simone-portfolio-agent` → Deploy, then "Edit code" and paste `worker.js` → Deploy.
   - Worker → Settings → Variables and Secrets → Add → type **Secret**, name `ANTHROPIC_API_KEY`, value = the key from step 1.
   - Copy the worker URL (looks like `https://simone-portfolio-agent.<account>.workers.dev`).
3. **Point the site at it**: in `v2-agent.js`, set `AGENT_ENDPOINT = "<worker URL>"`, commit, push. Done.
4. **Run the eval before trusting it**: paste each input from `eval/golden-qa.json` into the live agent and check the gating criteria. If a case fails, fix the system prompt in `worker.js`, redeploy, re-run. (This loop is itself portfolio material: see the future "how I built my twin" case study.)

## Safety properties built in
- API key lives only in the Worker secret, never in the browser.
- CORS locked to simonemuro.github.io (+ localhost for testing).
- Input caps: 12 messages × 600 chars; replies capped at 350 tokens.
- System prompt forbids: off-scope topics, fabrication beyond the grounding facts, commitments on Simone's behalf, prompt disclosure, role changes via injection.
- If the Worker is down or unset, the site degrades gracefully to curated mode and says so honestly.

## Cost guardrail
If traffic ever spikes, set a spend limit in the Anthropic console (Settings → Limits). Worst case the agent falls back to curated mode.
