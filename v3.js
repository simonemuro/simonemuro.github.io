/* SIMONE MURO · V3 instrument engine.
   Config-driven components; every animation has a designed static end state.
   Reduced-motion renders the complete artifact instantly. */
(function () {
  "use strict";
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SM = (window.SM = {});

  function el(tag, cls, html) { var d = document.createElement(tag); if (cls) d.className = cls; if (html != null) d.innerHTML = html; return d; }
  function esc(t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }

  /* ---------- reveal ---------- */
  SM.reveal = function () {
    var els = document.querySelectorAll(".reveal");
    if (reduced || !("IntersectionObserver" in window)) { els.forEach(function (e) { e.classList.add("in"); }); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } }); }, { threshold: 0.12 });
    els.forEach(function (e) { io.observe(e); });
  };

  /* ---------- counters ---------- */
  SM.counters = function () {
    document.querySelectorAll("[data-count]").forEach(function (n) {
      var target = parseFloat(n.dataset.count), dec = (n.dataset.count.indexOf(".") > -1) ? 1 : 0;
      var small = n.querySelector("small"), suffix = small ? small.outerHTML : "";
      var prefix = n.dataset.prefix || "";
      function setv(v) { n.innerHTML = prefix + v.toFixed(dec) + suffix; }
      if (reduced) { setv(target); return; }
      var t0 = null;
      function step(ts) { if (!t0) t0 = ts; var p = Math.min((ts - t0) / 900, 1); p = 1 - Math.pow(1 - p, 3); setv(target * p); if (p < 1) requestAnimationFrame(step); }
      var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { requestAnimationFrame(step); io.unobserve(n); } }); }, { threshold: 0.4 });
      io.observe(n);
    });
  };

  /* ---------- margin notes ---------- */
  SM.notes = function () {
    document.querySelectorAll(".note-ref").forEach(function (ref) {
      ref.addEventListener("click", function () {
        var body = document.getElementById(ref.getAttribute("data-note"));
        if (body) body.classList.toggle("open");
      });
    });
  };

  /* ---------- sequence player (replay core) ----------
     config: { seq: [{k:'user'|'bot'|'tool'|'sys', t:'...'}], variants: {NAME: seq}, autoplay: bool } */
  function playSeq(body, seq) {
    body.innerHTML = "";
    var delay = 0;
    seq.forEach(function (m, i) {
      var node;
      if (m.k === "tool") { node = el("div", "tool-chip", '<span class="dot"></span>' + esc(m.t)); }
      else { node = el("div", "msg " + m.k, esc(m.t)); }
      body.appendChild(node);
      delay += (i === 0 ? 120 : 700);
      if (reduced) { node.classList.add("in"); if (m.k === "tool") node.classList.add("done"); }
      else (function (nd, kk, dl) {
        setTimeout(function () { nd.classList.add("in"); if (kk === "tool") setTimeout(function () { nd.classList.add("done"); }, 900); }, dl);
      })(node, m.k, delay);
    });
  }
  SM.replay = function (root, config) {
    var body = root.querySelector(".inst-body");
    var current = config.autoplayVariant || Object.keys(config.variants)[0];
    root.querySelectorAll(".pill-toggle button").forEach(function (b) {
      b.addEventListener("click", function () {
        root.querySelectorAll(".pill-toggle button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        playSeq(body, config.variants[b.dataset.variant]);
      });
    });
    var first = root.querySelector('.pill-toggle button[data-variant="' + current + '"]');
    if (first) first.classList.add("on");
    if (config.deferUntilVisible && !reduced && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { playSeq(body, config.variants[current]); io.unobserve(root); } }); }, { threshold: 0.3 });
      io.observe(root);
    } else { playSeq(body, config.variants[current]); }
  };

  /* ---------- choices (Classifier) ----------
     config: { prompt:'...', choices: [{label, outcome: seq}] } */
  SM.choices = function (root, config) {
    var body = root.querySelector(".inst-body");
    var bar = el("div", "choices");
    var out = el("div");
    if (config.prompt) body.appendChild(el("p", "msg sys in", esc(config.prompt)));
    body.appendChild(bar); body.appendChild(out);
    config.choices.forEach(function (c) {
      var b = el("button", "choice", esc(c.label));
      b.addEventListener("click", function () {
        bar.querySelectorAll(".choice").forEach(function (x) { x.classList.add("dim"); x.classList.remove("picked"); });
        b.classList.remove("dim"); b.classList.add("picked");
        playSeq(out, c.outcome);
      });
      bar.appendChild(b);
    });
    if (config.preselect != null) {
      if (reduced) { bar.children[config.preselect].classList.add("picked"); playSeq(out, config.choices[config.preselect].outcome); }
      else {
        var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { bar.children[config.preselect].click(); io.unobserve(root); } }); }, { threshold: 0.3 });
        io.observe(root);
      }
    }
  };

  /* ---------- sorter (retrievable vs must-ask) ----------
     config: { items: [{label, bucket: 'sys'|'ask', why}], bucketLabels: {sys, ask} } */
  SM.sorter = function (root, config) {
    var body = root.querySelector(".inst-body");
    var bar = el("div", "choices");
    var buckets = el("div", "buckets");
    var sysB = el("div", "bucket sys", "<h4>" + esc(config.bucketLabels.sys) + "</h4>");
    var askB = el("div", "bucket ask", "<h4>" + esc(config.bucketLabels.ask) + "</h4>");
    var verdict = el("div", "verdict");
    buckets.appendChild(sysB); buckets.appendChild(askB);
    body.appendChild(el("p", "msg sys in", esc(config.prompt || "Where does each data point come from? Click to sort.")));
    body.appendChild(bar); body.appendChild(buckets); body.appendChild(verdict);
    var done = 0;
    config.items.forEach(function (it) {
      var b = el("button", "choice", esc(it.label));
      b.addEventListener("click", function () {
        b.remove();
        var chip = el("span", "chipped", esc(it.label));
        chip.title = it.why || "";
        (it.bucket === "sys" ? sysB : askB).appendChild(chip);
        done++;
        if (done === config.items.length) {
          verdict.innerHTML = '<span class="vlabel">the point</span>' + esc(config.moral);
          verdict.classList.add("in");
        }
      });
      bar.appendChild(b);
    });
  };

  /* ---------- inspector (golden row + judge run) ----------
     config: { tabs: [{name, rows: [[k,v]...]}], gates: [{label, pass, detail}], failNote } */
  SM.inspector = function (root, config) {
    var body = root.querySelector(".inst-body");
    var tabbar = el("div", "inspector-tabs");
    var spec = el("div", "spec");
    var run = el("div", "judge-run");
    body.appendChild(tabbar); body.appendChild(spec); body.appendChild(run);
    function show(i) {
      tabbar.querySelectorAll("button").forEach(function (b, j) { b.classList.toggle("on", i === j); });
      spec.innerHTML = config.tabs[i].rows.map(function (r) {
        return '<div class="row2"><span class="k">' + esc(r[0]) + '</span><span class="v">' + r[1] + "</span></div>";
      }).join("");
    }
    config.tabs.forEach(function (t, i) {
      var b = el("button", null, esc(t.name));
      b.addEventListener("click", function () { show(i); });
      tabbar.appendChild(b);
    });
    show(0);
    var btn = el("button", "btn solid", config.runLabel || "Run the judge");
    btn.style.marginTop = "16px";
    var gates = el("div"); gates.style.marginTop = "10px";
    run.appendChild(btn); run.appendChild(gates);
    btn.addEventListener("click", function () {
      gates.innerHTML = "";
      config.gates.forEach(function (g, i) {
        var row = el("div", "gate " + (g.pass ? "pass" : "fail"),
          '<span class="mark">' + (g.pass ? "✓" : "✕") + "</span><span>" + esc(g.label) + (g.detail ? ' <span style="color:var(--faint)">· ' + esc(g.detail) + "</span>" : "") + "</span>");
        gates.appendChild(row);
        if (reduced) { row.classList.add("lit"); }
        else setTimeout(function () { row.classList.add("lit"); }, 350 * (i + 1));
      });
      if (config.failNote) {
        var note = el("div", "verdict fail");
        note.innerHTML = '<span class="vlabel">a gate catching something</span>' + esc(config.failNote);
        gates.appendChild(note);
        if (reduced) note.classList.add("in");
        else setTimeout(function () { note.classList.add("in"); }, 350 * (config.gates.length + 1));
      }
    });
    if (reduced) btn.click();
  };

  /* ---------- earned second (audio-shaped before/after) ----------
     config: { strips: [{who, seconds, hot, label}] } */
  SM.earned = function (root, config) {
    var body = root.querySelector(".inst-body");
    var wrap = el("div", "earned");
    config.strips.forEach(function (s) {
      var bars = "";
      var n = Math.max(12, Math.round(s.seconds * 1.6));
      for (var i = 0; i < n; i++) {
        var h = 20 + Math.abs(Math.sin(i * 1.7)) * 70;
        bars += '<i style="height:' + h.toFixed(0) + '%"' + (s.hot ? ' class="hot"' : "") + "></i>";
      }
      var strip = el("div", "strip", '<span class="who">' + esc(s.who) + '</span><span class="bars">' + bars + '</span><span class="len">' + esc(s.label) + "</span>");
      wrap.appendChild(strip);
    });
    body.appendChild(wrap);
  };

  /* ---------- generations line ---------- */
  SM.genline = function () {
    var line = document.querySelector(".gen-line");
    if (!line) return;
    if (reduced) { line.classList.add("drawn"); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (en) { if (en.isIntersecting) { line.classList.add("drawn"); io.unobserve(line); } }); }, { threshold: 0.5 });
    io.observe(line);
  };

  /* ---------- the agent (curated mode; live hook via SM.AGENT_ENDPOINT) ---------- */
  SM.AGENT_ENDPOINT = "";
  var KB = [
    { id: "who", chip: "Who is Simone?", match: ["who", "about", "background", "summary", "experience", "career", "story", "history"],
      a: "Simone is an AI experience designer and builder: ten years in language AI across Meta, Apple's Siri, Sam's Club, Intuit, and Credit Karma, with the last six and a half designing and building conversation and agentic systems. She has led the work and the people doing it, coaching designers and design technologists while staying in the craft herself.", src: "about + career timeline" },
    { id: "build", chip: "Can she actually build?", match: ["build", "built", "code", "technical", "engineer", "hands-on", "ship", "mcp", "yaml", "skill", "billing"],
      a: "In May 2026 she built a working agent skill in 5 days, solo: skill YAML, a billing lookup tool with three environment modes, local testing through a Streamlit harness, and a 108-case golden dataset with judge-checkable gating criteria. She builds AI-natively, pairing with Claude in Cursor.", src: "No. 01 · BillingSkill", link: { href: "billing-skill.html", label: "Read No. 01" } },
    { id: "eval", chip: "How does she think about quality?", match: ["quality", "eval", "golden", "dataset", "judge", "rubric", "measure", "test", "label"],
      a: "Her core belief: if you can't define what good looks like, you can't ship it. Golden datasets with ground truth and expected actions, LLM judges validated against human labels before anyone trusts them, multi-turn simulators, and quality scores as release gates rather than reports.", src: "No. 03 · The Quality Program", link: { href: "quality-program.html", label: "Read No. 03" } },
    { id: "voice", chip: "What about voice?", match: ["voice", "phone", "telephony", "ivr", "call", "speech", "audio"],
      a: "Voice is her home turf: five years on Intuit's telephony assistant, then one of Intuit's first GenAI voice experiences, a concept she prototyped in mid-2023 and co-shipped in December 2024. A 3.9-point containment lift, measured in production. Her rule: a screen can show detail; voice must earn every second.", src: "No. 04 · Voice Snippet", link: { href: "voice-snippet.html", label: "Read No. 04" } },
    { id: "fit", chip: "Designer, PM, or manager?", match: ["manager", "lead", " pm", "product", "role", "team", "fit", "hire", "hiring", "level", "designer"],
      a: "Yes, deliberately. She has managed a design team, authored PRDs, and stayed hands-on the whole time. She targets roles where that range is the point: agentic AI design, AI product, or the generalist seat on a team shipping AI that has to be measurably good.", src: "about + leadership record" },
    { id: "agent", chip: "How was this agent built?", match: ["this agent", "this bot", "how was this", "how do you work", "scripted", "real", "twin"],
      a: "Two layers. Live mode runs Claude behind a guardrailed system prompt Simone wrote, with a golden eval set (injection attempts included) it must pass before it ships. Curated mode, running now, answers from responses she wrote and tested, so it never improvises about her career.", src: "this site" }
  ];
  var FALLBACK = { a: "That's outside my scope. I speak to Simone's work, from the case studies on this site. Ask about her builds, her evals, or her voice work, or email her: [removed-private-contact].", src: "refusal boundary" };

  SM.agent = function () {
    var door = document.querySelector(".agent-door");
    if (!door) return;
    var live = !!SM.AGENT_ENDPOINT, history = [], asked = {}, greeted = false;
    var panel = el("div", "agent-panel");
    panel.setAttribute("role", "dialog"); panel.setAttribute("aria-label", "Simone's portfolio agent");
    panel.innerHTML =
      '<div class="inst-head"><span>simone’s agent · ' + (live ? "live" : "curated") + ' mode</span><button class="agent-chip" data-close style="border:0">close</button></div>' +
      '<div class="agent-log" aria-live="polite"></div>' +
      '<form class="agent-input"><label class="sr-only" for="smq" style="position:absolute;left:-9999px">Ask about Simone’s work</label><input id="smq" autocomplete="off" maxlength="300" placeholder="Ask about my work…" /><button type="submit" aria-label="Send">→</button></form>' +
      '<div class="agent-chips"></div>' +
      '<div class="agent-foot">' + (live ? "Live: Claude behind a guardrailed, eval-tested prompt I wrote, grounded in these case studies." : "Curated mode: retrieval over answers I wrote and tested. Scope, grounding, and refusal behavior are the craft.") + "</div>";
    document.body.appendChild(panel);
    var log = panel.querySelector(".agent-log"), chips = panel.querySelector(".agent-chips"),
        form = panel.querySelector("form"), input = panel.querySelector("input");

    function botSay(item, delay) {
      var t = el("div", "typing", "<i></i><i></i><i></i>"); log.appendChild(t); log.scrollTop = log.scrollHeight;
      setTimeout(function () {
        t.remove();
        var html = esc(item.a);
        if (item.link) html += ' <a href="' + item.link.href + '">' + esc(item.link.label) + " →</a>";
        if (item.src) html += '<span class="src">' + esc(item.src) + "</span>";
        log.appendChild(el("div", "msg bot in", html)); log.scrollTop = log.scrollHeight;
      }, reduced ? 40 : (delay || 650));
    }
    function renderChips() {
      chips.innerHTML = "";
      KB.filter(function (k) { return !asked[k.id]; }).forEach(function (k) {
        var b = el("button", "agent-chip", esc(k.chip)); b.type = "button";
        b.addEventListener("click", function () { ask(k.chip, k); }); chips.appendChild(b);
      });
    }
    function retrieve(q) {
      var text = q.toLowerCase(), best = null, score = 0;
      KB.forEach(function (k) { var s = 0; k.match.forEach(function (kw) { if (text.indexOf(kw) > -1) s += kw.length > 4 ? 2 : 1; }); if (s > score) { score = s; best = k; } });
      return score > 0 ? best : null;
    }
    function ask(q, kbItem) {
      log.appendChild(el("div", "msg user in", esc(q))); log.scrollTop = log.scrollHeight;
      if (live) {
        history.push({ role: "user", content: q });
        var t = el("div", "typing", "<i></i><i></i><i></i>"); log.appendChild(t);
        fetch(SM.AGENT_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.slice(-12) }) })
          .then(function (r) { if (!r.ok) throw 0; return r.json(); })
          .then(function (d) { t.remove(); if (!d.reply) throw 0; history.push({ role: "assistant", content: d.reply });
            log.appendChild(el("div", "msg bot in", esc(d.reply) + '<span class="src">live · guardrailed by Simone</span>')); log.scrollTop = log.scrollHeight; })
          .catch(function () { t.remove(); live = false; botSay({ a: "The live model is unreachable, so I've switched to curated mode: answers Simone wrote and tested.", src: "curated mode" }); var hit = kbItem || retrieve(q); botSay(hit || FALLBACK, 1300); });
      } else {
        var hit = kbItem || retrieve(q);
        if (hit) { asked[hit.id] = true; renderChips(); botSay(hit); } else botSay(FALLBACK);
      }
    }
    function open() {
      panel.classList.add("open");
      if (!greeted) { greeted = true; botSay({ a: live ? "Hi, I'm Simone's agent twin. She wrote my instructions, scoped what I can speak to, and eval-tested me before letting me talk to you. Ask me anything about her work." : "Hi, I'm Simone's portfolio agent. She designed my scope, wrote my responses, and decided what I should refuse. Ask me about her work.", src: "greeting" }, 400); renderChips(); }
      setTimeout(function () { input.focus(); }, 100);
    }
    door.addEventListener("click", function () { panel.classList.contains("open") ? panel.classList.remove("open") : open(); });
    panel.querySelector("[data-close]").addEventListener("click", function () { panel.classList.remove("open"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") panel.classList.remove("open"); });
    form.addEventListener("submit", function (e) { e.preventDefault(); var q = input.value.trim(); if (!q) return; input.value = ""; ask(q, null); });
    window.SMAgentOpen = open;
  };

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", function () {
    SM.reveal(); SM.counters(); SM.notes(); SM.genline(); SM.agent();
    document.querySelectorAll("[data-instrument]").forEach(function (root) {
      var cfgEl = document.getElementById(root.dataset.config);
      if (!cfgEl) return;
      var cfg = JSON.parse(cfgEl.textContent);
      var kind = root.dataset.instrument;
      if (kind === "replay") SM.replay(root, cfg);
      else if (kind === "choices") SM.choices(root, cfg);
      else if (kind === "sorter") SM.sorter(root, cfg);
      else if (kind === "inspector") SM.inspector(root, cfg);
      else if (kind === "earned") SM.earned(root, cfg);
    });
  });
})();
