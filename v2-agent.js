/* Simone Muro portfolio: shared theme toggle + floating portfolio agent.
   Live mode calls a Cloudflare Worker proxy to Claude (see /agent-worker/).
   If the endpoint is unset or unreachable, curated mode answers from a
   hand-written, eval-tested knowledge base. Both modes refuse off-scope asks. */
(function () {
  "use strict";

  /* ============ THEME ============ */
  var saved = null;
  try { saved = localStorage.getItem("sm-theme"); } catch (e) {}
  if (saved === "light") document.documentElement.setAttribute("data-theme", "light");

  function buildThemeToggle() {
    var nav = document.querySelector(".nav-links");
    if (!nav) return;
    var btn = document.createElement("button");
    btn.className = "theme-toggle";
    btn.setAttribute("aria-label", "Switch between dark and light theme");
    function paint() {
      var light = document.documentElement.getAttribute("data-theme") === "light";
      btn.textContent = light ? "☾" : "☀";
      btn.title = light ? "Switch to dark" : "Switch to light";
    }
    btn.addEventListener("click", function () {
      var light = document.documentElement.getAttribute("data-theme") === "light";
      if (light) { document.documentElement.removeAttribute("data-theme"); try { localStorage.setItem("sm-theme", "dark"); } catch (e) {} }
      else { document.documentElement.setAttribute("data-theme", "light"); try { localStorage.setItem("sm-theme", "light"); } catch (e) {} }
      paint();
    });
    paint();
    nav.appendChild(btn);
  }

  /* ============ AGENT ============ */
  // Set to the deployed Cloudflare Worker URL to enable live mode; empty = curated mode.
  var AGENT_ENDPOINT = "";

  var KB = [
    { id: "who", chip: "Who is Simone?",
      match: ["who", "about", "background", "introduce", "summary", "experience", "career", "story", "intuit", "history"],
      a: "Simone is an AI experience designer and builder: nine years in language AI across Meta, Apple's Siri, Sam's Club, Intuit, and Credit Karma, with the last six and a half designing and building conversation and agentic systems. She has led the work and the people doing it, including a team of three designers and design technologists.",
      src: "source: About + career timeline" },
    { id: "build", chip: "Can she actually build?",
      match: ["build", "built", "code", "coding", "technical", "engineer", "hands-on", "ship", "mcp", "yaml", "skill", "prototype", "billing"],
      a: "Judge for yourself: in May 2026 she built a working agent skill in 5 days, solo. She wrote the skill YAML, built a billing lookup tool with three environment modes (LIVE, EVAL, DEV), registered it in the agent repo, tested it locally through a Streamlit harness, and authored a 108-case golden dataset with judge-checkable gating criteria. She builds AI-natively, pairing with Claude in Cursor, and she knows exactly where engineering partnership begins.",
      src: "source: BillingSkill case study",
      link: { href: "case-billing-skill.html", label: "Read the build story" } },
    { id: "eval", chip: "How does she think about AI quality?",
      match: ["quality", "eval", "evaluation", "golden", "dataset", "judge", "measure", "rubric", "metric", "test", "ground truth", "label"],
      a: "Her core belief: if you can't define what good looks like, you can't ship it. In practice that means golden datasets with ground truth and expected actions, LLM judges validated against human labels before anyone trusts them, multi-turn user simulators, and quality scores as release gates rather than reports. That program lifted agent quality 8 to 13 points across three domains.",
      src: "source: Quality Evaluation case study",
      link: { href: "case-quality-evaluation.html", label: "See the quality loop" } },
    { id: "voice", chip: "What about voice?",
      match: ["voice", "phone", "telephony", "ivr", "call", "speech", "audio", "snippet"],
      a: "Voice is her home turf: five years on Intuit's telephony assistant, then one of Intuit's first GenAI voice experiences, a concept she prototyped in mid-2023 before the platform had an approved path and co-shipped in December 2024. Result: a 3.9-point containment lift, measured in production. Her rule for the medium: a screen can show detail; voice has to earn every second.",
      src: "source: Voice Snippet case study",
      link: { href: "case-voice-snippet.html", label: "Voice Snippet, with video" } },
    { id: "lead", chip: "Designer, PM, or manager?",
      match: ["manager", "lead", "leader", " pm", "product", "role", "title", "team", "fit", "hire", "hiring", "level", "designer"],
      a: "Yes, deliberately. She has managed a team of three, authored PRDs and owned roadmap-facing deliverables, and stayed hands-on in the craft the whole time. She targets roles where that range is the point: agentic AI design, AI product, or the generalist seat on a team shipping AI that has to be measurably good.",
      src: "source: About + leadership record" },
    { id: "agent", chip: "How was this agent built?",
      match: ["this agent", "this bot", "this chat", "how was this", "how does this work", "scripted", "real", "twin"],
      a: "Two layers, honestly labeled. When the live endpoint is up, you're talking to Claude running behind a guardrailed system prompt Simone wrote: grounded in her case studies, scoped to her work, eval-tested against a golden set that includes injection attempts. When it isn't, this curated mode answers from responses she wrote and tested, so it can never improvise about her career. Designing scope, grounding, and refusal behavior is the same craft she applies at production scale.",
      src: "source: this page" }
  ];
  var FALLBACK = {
    a: "That's outside what I'm scoped to answer. I only speak to Simone's work, and only from her published case studies. (Refusing gracefully is a designed behavior, not a bug.) Try one of the suggested questions, or email her directly: [removed-private-contact].",
    src: "refusal boundary · by design"
  };

  var liveMode = !!AGENT_ENDPOINT;
  var history = [];   // live-mode conversation history
  var asked = {};
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var log, chipsEl, panel, launcher;

  function el(tag, cls, html) { var d = document.createElement(tag); if (cls) d.className = cls; if (html != null) d.innerHTML = html; return d; }
  function esc(t) { return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
  function scrollLog() { if (log) log.scrollTop = log.scrollHeight; }

  function typing() { var t = el("div", "typing"); t.appendChild(el("i")); t.appendChild(el("i")); t.appendChild(el("i")); log.appendChild(t); scrollLog(); return t; }

  function botSay(item, delay) {
    var t = typing();
    window.setTimeout(function () {
      if (t.parentNode) log.removeChild(t);
      var html = item.a;
      if (item.link) html += ' <a href="' + item.link.href + '">' + item.link.label + ' →</a>';
      if (item.src) html += '<span class="src">' + item.src + "</span>";
      log.appendChild(el("div", "msg bot", html));
      scrollLog();
    }, reduced ? 60 : (delay || 750));
  }

  function retrieve(q) {
    var text = q.toLowerCase(), best = null, bestScore = 0;
    KB.forEach(function (k) {
      var score = 0;
      k.match.forEach(function (kw) { if (text.indexOf(kw) !== -1) score += kw.length > 4 ? 2 : 1; });
      if (score > bestScore) { bestScore = score; best = k; }
    });
    return bestScore > 0 ? best : null;
  }

  function curatedAnswer(q) {
    var hit = retrieve(q);
    if (hit) { asked[hit.id] = true; renderChips(); botSay(hit); }
    else { botSay(FALLBACK); }
  }

  function liveAnswer(q) {
    history.push({ role: "user", content: q });
    var t = typing();
    fetch(AGENT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-12) })
    }).then(function (r) {
      if (!r.ok) throw new Error("status " + r.status);
      return r.json();
    }).then(function (data) {
      if (t.parentNode) log.removeChild(t);
      var text = (data && data.reply) ? data.reply : "";
      if (!text) throw new Error("empty reply");
      history.push({ role: "assistant", content: text });
      log.appendChild(el("div", "msg bot", esc(text).replace(/\n\n/g, "<br><br>") + '<span class="src">live · Claude, guardrailed &amp; grounded by Simone</span>'));
      scrollLog();
    }).catch(function () {
      if (t.parentNode) log.removeChild(t);
      liveMode = false;
      log.appendChild(el("div", "msg bot", "The live model is unreachable right now, so I've switched to curated mode: answers Simone wrote and tested. Everything I say is still grounded in her real work.<span class=\"src\">graceful degradation · by design</span>"));
      scrollLog();
      curatedAnswer(q);
    });
  }

  function ask(q, isChip, kbItem) {
    log.appendChild(el("div", "msg user", esc(q)));
    scrollLog();
    if (liveMode) { liveAnswer(q); }
    else if (isChip && kbItem) { asked[kbItem.id] = true; renderChips(); botSay(kbItem); }
    else { curatedAnswer(q); }
  }

  function renderChips() {
    chipsEl.innerHTML = "";
    KB.filter(function (k) { return !asked[k.id]; }).forEach(function (k) {
      var b = el("button", "agent-chip", k.chip);
      b.type = "button";
      b.addEventListener("click", function () { ask(k.chip, true, k); });
      chipsEl.appendChild(b);
    });
  }

  function buildAgent() {
    launcher = el("button", "agent-launcher");
    launcher.setAttribute("aria-label", "Open Simone's portfolio agent");
    launcher.setAttribute("aria-expanded", "false");
    launcher.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg><span class="agent-launcher-dot" aria-hidden="true"></span>';

    panel = el("div", "agent-panel");
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "Portfolio agent chat");
    panel.innerHTML =
      '<div class="agent-head">' +
        '<span class="agent-title">portfolio-agent <b>· grounded in the case studies · ' + (liveMode ? "live mode" : "curated mode") + '</b></span>' +
        '<button class="agent-close" aria-label="Close chat">✕</button>' +
      '</div>' +
      '<div class="agent-log" id="agent-log" aria-live="polite"></div>' +
      '<form class="agent-input" id="agent-form">' +
        '<label class="sr-only" for="agent-q">Ask a question about Simone’s work</label>' +
        '<input id="agent-q" type="text" autocomplete="off" maxlength="300" placeholder="Ask about my work. Off-scope gets refused, by design…" />' +
        '<button type="submit" aria-label="Send question">→</button>' +
      '</form>' +
      '<div class="agent-chips" id="agent-chips" role="group" aria-label="Suggested questions"></div>' +
      '<div class="agent-foot"><b>How this works:</b> <span>' +
        (liveMode
          ? 'a live model (Claude) behind a guardrailed, eval-tested system prompt I wrote, grounded in my case studies. If it’s unreachable, a curated mode I also wrote takes over.'
          : 'curated mode: deterministic retrieval over answers I wrote and tested, so nothing here is improvised. Designing the scope, grounding, and refusal behavior is the craft.') +
      '</span></div>';

    document.body.appendChild(panel);
    document.body.appendChild(launcher);

    log = panel.querySelector(".agent-log");
    chipsEl = panel.querySelector(".agent-chips");
    var form = panel.querySelector("#agent-form");
    var input = panel.querySelector("#agent-q");

    var greeted = false;
    function open() {
      panel.classList.add("open");
      launcher.setAttribute("aria-expanded", "true");
      if (!greeted) {
        greeted = true;
        botSay({
          a: liveMode
            ? "Hi, I’m Simone’s agent twin. She wrote my instructions, scoped what I can speak to, and eval-tested me before letting me talk to you. Ask me anything about her work. Try to take me off-topic if you like; the refusal is part of the design."
            : "Hi, I’m Simone’s portfolio agent. She designed my scope, wrote my responses, and decided what I should refuse to answer. Ask me about her work, or try to take me off-topic and watch the refusal.",
          src: "system: greeting"
        }, 500);
        renderChips();
      }
      window.setTimeout(function () { input.focus(); }, 120);
    }
    function close() { panel.classList.remove("open"); launcher.setAttribute("aria-expanded", "false"); }

    launcher.addEventListener("click", function () { panel.classList.contains("open") ? close() : open(); });
    panel.querySelector(".agent-close").addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (!q) return;
      input.value = "";
      ask(q, false, null);
    });

    window.PortfolioAgent = { open: open, close: close };
  }

  function init() { buildThemeToggle(); buildAgent(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
