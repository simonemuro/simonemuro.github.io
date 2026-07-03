# V4 component guide (for fleet agents)

Shared system: `v4.css` + `v4.js` (no dependencies, self-hosted fonts in `fonts/`).
Reference implementation: `index.html` (homepage) and `404.html` (repair page).

## Page skeleton

Every page uses this head and shell (copy from `index.html`):

- `<meta name="color-scheme" content="light">`, description, OG meta, the inline SVG data-URI favicon (same monogram on every page).
- `<link rel="stylesheet" href="v4.css">` and `<script src="v4.js" defer></script>`.
- Skip link -> `.masthead` (brand + `site:` ticker + nav Work / Resume / Contact) -> `<main id="main">` -> bands -> footer.
- Case pages: brand links to `index.html`; nav Work -> `index.html#work`, Contact -> `index.html#contact`.
- Sections get `data-state="<one word>"` (e.g. `deciding`, `indexing`); the ticker shows the state of the section in view.
- End of body: the `<noscript>` style block from `index.html` (unseals calls, hides JS-only controls).

## Hard budgets (BINDING, from v4-build-principles.md)

1. **ONE sealed decision spread per case page.** The homepage has two; that is the exception.
2. **Margin notes: at most 2 per page**, and only checkable observations about what the page just did. Never adjectives.
3. **Colophon table (`.evaltable`) is homepage-only.** Case pages use the one-line footer variant (`.foot-score`).
4. **Numbers only from the private verified-claims ledger.** Projections are always labeled projected. No unreceipted figures anywhere.
5. **Zero em or en dashes in rendered text.** Use periods, colons, "·", or "to".
6. **No manifesto-speak, no vocabulary cosplay.** Verbs only appear with evidence and constraint behind them. The phrase "judgment made visible" never appears.
7. **Reduced motion**: scroll reveals render complete, but sealed calls STAY sealed until click (open is instant). Never pre-open.
8. Case pages open on the decision; the factbox on top is outcome-first. Both layers, always.

## Components

### Masthead ticker
```html
<p class="mast-state mono" aria-hidden="true">site: <b data-ticker>reading</b></p>
```
Scroll sets ambient state from `[data-state]` sections. Reader actions call
`V4.tick("revealed: her call")` (holds ~4.5s, then reverts to ambient).
The decision, trace, and refusal components tick automatically. Ticker hides under 720px.

### Sealed decision spread (`[data-decision]`)
Copy the whole `<article class="decision with-note" data-decision>` block from `index.html`.
Config JSON lives inside the article:
```html
<script type="application/json" data-decision-config>
{
  "her": "verify",
  "name": "payroll call",
  "verdicts": {
    "match":  "{Her}. Same call.",
    "miss":   "You called {pick}. She called {her}. Her receipt is below.",
    "skip":   "Skipped. Her call is open below. Yours is still open too.",
    "repick": "Changed to {pick}. Her call stands: {her}.",
    "change": "Pick another verb above. The seal stays open.",
    "partial": { "ask": "Half of it. ... Her call: verify first." }
  }
}
</script>
```
Required structure inside the article: `.situation` (add `quoted` class for customer quotes),
`.d-grid` with `.d-setup` and `.d-choice` (options `role="group"` labelled by the question),
each `.opt` has `data-verb`, an `.opt-line` (idx + verb + `your call` tag) and a `.gloss`
(consequence: what that verb means HERE, one line). After the grid: `.opt-foot` with
`.skip-call` ("or skip: show her call") and the `.privacy` line ("your answer never leaves
this tab, stored nowhere"). Then `.verdict` (aria-live) containing `.verdict-line` and the
`.repick` button ("change my call"). The reveal: `.call-reveal > .call-clip > .call` with
`<h4 class="call-h" tabindex="-1">Her call</h4>` (focus lands here after a pick), `.call-verb`,
`.call-line`, `.receipt`. Optional `.score` rows in the setup flip `val-pending` -> `val-fail`
on reveal.

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
  <p>Held its answer until you committed. Then showed the receipt.</p>
</aside>
```
Place as the second child of a `.with-note` grid (sticky right rail >=1140px, accent-bordered
block below that). Max 2 per page, checkable observations only.

### Case factbox (skim layer, top of every case page)
```html
<dl class="factbox">
  <div class="fact fact-outcome"><dt>Outcome</dt><dd>Acceptance 32% to 56% · $135,160 realized</dd></div>
  <div class="fact"><dt>Role</dt><dd>Driver + designer</dd></div>
  <div class="fact"><dt>When</dt><dd>2024 · LLM era</dd></div>
</dl>
```
Outcome cell first and largest. Verified numbers only.

### Case index row / era ruler / options scorecard
Copy patterns from `index.html` (`.cases > .case`, `.eras`, `.score`). The whole case row is
clickable via the stretched link on the `h3 a`.

### Refusal widget (`[data-refusal]`): homepage only unless told otherwise
KB JSON inside the widget; see `index.html`. Entries: `{ "match": [keywords], "reply": "...",
"href": "...", "link": "..." }`, first match wins (lowercase substring). No match -> escalating
`refusals` lines + mailto handoff, tagged `refused: out of scope`. In-scope replies are tagged
`curated, designed response · no live model`. Keep the privacy footer line.

### Footer + one-line colophon variant (all non-home pages)
```html
<footer class="footer" role="contentinfo">
  <div class="shell">
    <p class="foot-score mono">colophon, one line: <b>answered</b> in the factbox · <b>sealed</b> one call · numbers <b>receipted</b> · <b>handoff</b> at the end</p>
    <p class="footer-inner mono">
      <span>Simone Muro · Portfolio, 4th edition · 2026</span>
      <span><a href="index.html">Home</a> · <a href="index.html#work">Work</a> · <a href="resume.html">Resume</a></span>
    </p>
  </div>
</footer>
```
Every claim in the one-liner must be true of that page.

## Tokens
`--paper #ffffff · --ink #0e0f12 · --sub #5c5f66 · --hair #e3e4e8 · --hair-strong #c9cbd2 ·
--accent #1e2bd0 (ultramarine: spend ONLY where judgment lives: her call, annotations,
refusals, pass marks, hover) · --wash #eef1fb (reveal panels only)`.
Fonts: `var(--serif)` Instrument Serif (display + italic verdict voice), `var(--sans)`
Instrument Sans (text), `var(--mono)` Fragment Mono (kickers, marks, verdicts; the `.mono`
utility uppercases at .68rem/.16em). Never add new colors, shadows, or radii.

## Local preview
`.claude/launch.json` has a `v4tree` server (python http.server, port 4643, directory
`portfolio/v4tree`). Verify: both decisions (pick, skip, repick), trace replay, refusal
(in-scope + out-of-scope), 375px masthead, reduced motion (calls still sealed), console clean,
and `grep -P '\x{2013}|\x{2014}' *.html` returns nothing.
