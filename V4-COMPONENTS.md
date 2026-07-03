# V4 component guide (for fleet agents)

Shared system: `v4.css` + `v4.js` (no dependencies, self-hosted fonts in `fonts/`).
Reference implementation: `index.html` (homepage) and `404.html` (repair page).

## Page skeleton

Every page uses this head and shell (copy from `index.html`):

- `<meta name="color-scheme" content="light">`, description, OG meta, the inline SVG data-URI favicon (same monogram on every page).
- `<link rel="stylesheet" href="v4.css">` and `<script src="v4.js" defer></script>`.
- Skip link -> `.masthead` (brand + nav Work / Resume / Contact + progress hairline; nothing else) -> `<main id="main">` -> bands -> footer.
- Case pages: brand links to `index.html`; nav Work -> `index.html#work`, Contact -> `index.html#contact`.
- End of body: the `<noscript>` style block from `index.html` (completes reveals, hides JS-only controls).

## Hard budgets (BINDING, from v4-build-principles.md)

1. **NO FORCED INTERACTION.** No quizzes, option grids, verdicts, sealed reveals, or any mechanic that makes a visitor act to see content. Decisions are told directly: situation -> her call -> why -> receipt, open by default.
2. **SECTION BUDGET: max 5 bands per case page**, including the opener and the handoff.
3. **EXHIBIT BUDGET: at most 2 exhibit-class figures per case page** (a real artifact excerpt, a trace, audio, or a before/after). Honesty labels on exhibits stay.
4. **Margin notes: at most 1 per page**, and only if it carries real information a recruiter needs; else zero. Never adjectives.
5. **Numbers only from the private verified-claims ledger.** Projections are always labeled projected. No unreceipted figures anywhere.
6. **Zero em or en dashes in rendered text.** Use periods, colons, "·", or "to". No contractions.
7. **No manifesto-speak, no vocabulary cosplay.** Verbs only appear with evidence and constraint behind them. The phrase "judgment made visible" never appears.
8. Case pages open on the decision; the factbox on top is outcome-first. Both layers, always.

## Components

### Decision spread (told directly)
No config JSON, no JS. Structure inside `<article class="decision">`:
`.d-kicker`, `.situation` (add `quoted` class for customer quotes), then `.d-grid` with
two columns: `.d-setup` (the situation and, optionally, `.score` rows with `val-pass` /
`val-fail` values, all resolved and visible) and a plain div holding
`<h4 class="call-h">Her call</h4>`, `.call-verb`, `.call-line`, `.receipt`.
The band lede above the article may enumerate the alternatives and state "Her call: X."

### Runtime trace (`[data-trace]`)
White panel, hairline rows, mono timestamps, ultramarine annotations. ALWAYS pre-rendered;
`replay` only re-animates. Never render an empty trace.
```html
<figure class="trace" data-trace="payroll trace">
  <figcaption class="trace-hd mono">
    <span>trace · ...</span>
    <span class="trace-state" data-trace-state>complete</span>
    <button class="trace-replay" type="button" data-trace-replay>replay</button>
  </figcaption>
  <ol class="trace-rows">
    <li class="t-row t-speech" data-d="480"><span class="t-time" aria-hidden="true">00.0</span>
      <div class="t-main"><span class="t-role">customer</span><p>"..."</p></div></li>
    <li class="t-row t-note" data-d="440"><span class="t-time" aria-hidden="true">00.4</span>
      <div class="t-main">scope check: passed</div></li>
    <li class="t-row t-tool" data-d="420"><span class="t-time" aria-hidden="true">00.9</span>
      <div class="t-main"><code>read <b>tool(arg)</b> &#8594; <span class="ok">ok</span> · result</code></div></li>
  </ol>
  <p class="trace-foot mono">reconstructed from the shipped behavior spec · pre-rendered, no live model</p>
</figure>
```
Row kinds: `t-speech` (+`t-agent` for the agent), `t-note` (ultramarine ✱ annotation), `t-tool`.
`data-d` = ms before the NEXT row during replay. Replay button hides itself under reduced motion.
Keep the honesty label in `.trace-foot` if the trace is a reconstruction.

### Margin note
```html
<aside class="bnote io" style="--d:4" aria-label="Behavior note 01">
  <span class="bnote-id">Note 01</span>
  <p>One claim in this section is a projection. It says projected where it appears.</p>
</aside>
```
Place as the second child of a `.with-note` grid (sticky right rail >=1140px, accent-bordered
block below that). Max 1 per page, only if it carries real information; else zero.

### Case factbox (skim layer, top of every case page)
```html
<dl class="factbox">
  <div class="fact fact-outcome"><dt>Outcome</dt><dd>Acceptance 32% to 56% · $135,160 realized</dd></div>
  <div class="fact"><dt>Role</dt><dd>Driver + designer</dd></div>
  <div class="fact"><dt>When</dt><dd>2024 · LLM era</dd></div>
</dl>
```
Outcome cell first and largest. Verified numbers only.

### Case index row / era ruler / scorecard
Copy patterns from `index.html` (`.cases > .case`, `.eras`, `.score`). The whole case row is
clickable via the stretched link on the `h3 a`.

### Refusal widget (`[data-refusal]`): homepage only unless told otherwise
KB JSON inside the widget; see `index.html`. One clean input + send, placeholder text only;
NO suggestion chips or preset question buttons. Entries: `{ "match": [keywords], "reply": "...",
"href": "...", "link": "..." }`, first match wins (lowercase substring). No match -> escalating
`refusals` lines + mailto handoff, tagged `refused: out of scope`. In-scope replies are tagged
`curated, designed response · no live model`. Keep the privacy footer line. Live mode: a
`<meta name="agent-endpoint">` tag switches the widget to a real chat against the Cloudflare
Worker in `agent-worker/`; on any fetch failure it degrades back to curated mode and says so.

### Footer + one-line foot-score variant (all non-home pages)
```html
<footer class="footer" role="contentinfo">
  <div class="shell">
    <p class="foot-score mono">colophon, one line: <b>answered</b> in the factbox · her call <b>stated</b> plainly · numbers <b>receipted</b> · <b>handoff</b> at the end</p>
    <p class="footer-inner mono">
      <span>Simone Muro · Portfolio, 4th edition · 2026</span>
      <span><a href="index.html">Home</a> · <a href="index.html#work">Work</a> · <a href="resume.html">Resume</a></span>
    </p>
  </div>
</footer>
```
Every claim in the one-liner must be true of that page. The homepage footer has no foot-score
line and no self-scoring table: `footer-inner` only.

## Tokens
`--paper #ffffff · --ink #0e0f12 · --sub #5c5f66 · --hair #e3e4e8 · --hair-strong #c9cbd2 ·
--accent #1e2bd0 (ultramarine: spend ONLY where judgment lives: her call, annotations,
refusals, pass marks, hover)`.
Fonts: `var(--serif)` Instrument Serif (display + italic "her call" voice), `var(--sans)`
Instrument Sans (text), `var(--mono)` Fragment Mono (kickers, marks; the `.mono`
utility uppercases at .68rem/.16em). Never add new colors, shadows, or radii.

## Local preview
`.claude/launch.json` has a server for this directory. Verify: trace replay, refusal
(in-scope + out-of-scope), 375px masthead, reduced motion (everything renders complete),
console clean, and `grep -P '\x{2013}|\x{2014}' *.html` returns nothing.
