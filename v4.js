/* ============================================================
   PORTFOLIO V4 · shared behavior · no dependencies
   Components auto-init on DOM ready:
     [data-state]            masthead ticker section states
     .io / .rule-io          scroll reveals (reduced motion: complete)
     [data-decision]         sealed decision spread (config JSON inside)
     [data-trace]            runtime trace with replay (pre-rendered)
     [data-refusal]          scoped refusal widget (KB JSON inside)
   Public API:
     V4.tick(msg)            push a reader-action state to the ticker
     V4.reducedMotion        boolean
   ============================================================ */
(function () {
  "use strict";

  var V4 = (window.V4 = window.V4 || {});
  var PRM = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  V4.reducedMotion = PRM;

  function ready(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

  function readConfig(root, sel) {
    var node = root.querySelector(sel);
    if (!node) return null;
    try { return JSON.parse(node.textContent); } catch (e) { return null; }
  }

  /* ---------- masthead ticker ----------
     Scroll sets the ambient section state; reader actions
     (picked, revealed, refused, replayed) take priority and
     hold the ticker for a few seconds. */
  var tickEl = null;
  var tickHoldUntil = 0;
  var ambientState = "";

  function paintTick(msg) { if (tickEl) tickEl.textContent = msg; }

  V4.tick = function (msg) {
    tickHoldUntil = Date.now() + 4500;
    paintTick(msg);
    window.clearTimeout(V4.tick._t);
    V4.tick._t = window.setTimeout(function () {
      if (Date.now() >= tickHoldUntil && ambientState) paintTick(ambientState);
    }, 4600);
  };

  ready(function () {
    tickEl = document.querySelector("[data-ticker]");

    /* section states */
    if (tickEl && "IntersectionObserver" in window) {
      var stateWatch = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            ambientState = e.target.getAttribute("data-state") || ambientState;
            if (Date.now() >= tickHoldUntil) paintTick(ambientState);
          }
        });
      }, { rootMargin: "-35% 0px -55% 0px" });
      document.querySelectorAll("[data-state]").forEach(function (s) { stateWatch.observe(s); });
    }

    /* ---------- scroll reveals ---------- */
    var ioEls = document.querySelectorAll(".io,.rule-io");
    if (!PRM && "IntersectionObserver" in window) {
      var reveal = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { e.target.classList.add("in"); reveal.unobserve(e.target); }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
      ioEls.forEach(function (el) { reveal.observe(el); });
    } else {
      ioEls.forEach(function (el) { el.classList.add("in"); });
    }

    /* ---------- reading progress hairline ---------- */
    var bar = document.getElementById("progress");
    if (bar && !PRM) {
      var ticking = false;
      var paintBar = function () {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        var x = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
        bar.style.transform = "scaleX(" + x + ")";
        ticking = false;
      };
      window.addEventListener("scroll", function () {
        if (!ticking) { ticking = true; window.requestAnimationFrame(paintBar); }
      }, { passive: true });
      paintBar();
    }

    /* ---------- sealed decision spreads ---------- */
    document.querySelectorAll("[data-decision]").forEach(initDecision);

    /* ---------- runtime traces ---------- */
    document.querySelectorAll("[data-trace]").forEach(initTrace);

    /* ---------- refusal widgets ---------- */
    document.querySelectorAll("[data-refusal]").forEach(initRefusal);
  });

  /* ============ decision spread ============
     Config JSON (in <script type="application/json" data-decision-config>):
     {
       "her": "verify",
       "verdicts": {
         "match":  "{Her}. Same call.",
         "miss":   "You called {pick}. She called {her}. Her receipt is below.",
         "skip":   "Skipped. Her call is open below. Yours is still open too.",
         "repick": "Changed to {pick}. Her call stands: {her}.",
         "partial": { "ask": "Half of it. It does ask, once. After it reads." }
       },
       "name": "payroll"
     } */
  function initDecision(d) {
    var cfg = readConfig(d, "[data-decision-config]");
    if (!cfg || !cfg.her) return;
    var v = cfg.verdicts || {};
    var her = cfg.her;
    var name = cfg.name || "decision";
    var verdict = d.querySelector(".verdict");
    var verdictLine = d.querySelector(".verdict-line") || verdict;
    var callHead = d.querySelector(".call-h");
    var opts = d.querySelectorAll(".opt");
    var skip = d.querySelector(".skip-call");
    var repick = d.querySelector(".repick");
    var picked = false;

    function fill(t, pick) {
      return (t || "")
        .replace("{Her}", cap(her)).replace("{her}", her)
        .replace("{Pick}", cap(pick || "")).replace("{pick}", pick || "");
    }

    function setVerdict(text, isMatch) {
      if (!verdictLine) return;
      var span = document.createElement(isMatch ? "strong" : "span");
      if (isMatch) span.className = "match";
      span.textContent = text;
      verdictLine.textContent = "";
      verdictLine.appendChild(span);
    }

    function open(focusCall) {
      d.classList.add("revealed");
      /* .call flips from visibility:hidden 100ms after the reveal
         starts; focus only lands once it is visible. */
      if (focusCall && callHead) {
        window.setTimeout(function () { callHead.focus(); }, 160);
      }
    }

    opts.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var pick = btn.getAttribute("data-verb");
        opts.forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
        var again = picked;
        picked = true;
        if (again) {
          setVerdict(fill(pick === her ? (v.match || "{Her}. Same call.") : (v.repick || "Changed to {pick}. Her call stands: {her}."), pick), pick === her);
          V4.tick("changed call: " + pick);
          open(false);
          return;
        }
        if (pick === her) {
          setVerdict(fill(v.match || "{Her}. Same call.", pick), true);
        } else if (v.partial && v.partial[pick]) {
          setVerdict(fill(v.partial[pick], pick), false);
        } else {
          setVerdict(fill(v.miss || "You called {pick}. She called {her}. Her receipt is below.", pick), false);
        }
        V4.tick("picked: " + pick + " · revealed: her call");
        open(true);
      });
    });

    if (skip) {
      skip.addEventListener("click", function () {
        picked = true;
        setVerdict(fill(v.skip || "Skipped. Her call is open below. Yours is still open too."), false);
        V4.tick("revealed: her call (skipped)");
        open(true);
      });
    }

    if (repick) {
      repick.addEventListener("click", function () {
        setVerdict(fill(v.change || "Change it: pick another verb above. The seal stays open."), false);
        V4.tick("re-picking: " + name);
        if (opts.length) opts[0].focus();
      });
    }
  }

  /* ============ runtime trace ============
     Rows are pre-rendered in the HTML; replay hides then
     re-reveals them in sequence. Hidden entirely for
     reduced motion (the trace is already complete). */
  function initTrace(t) {
    var btn = t.querySelector("[data-trace-replay]");
    var state = t.querySelector("[data-trace-state]");
    var rows = t.querySelectorAll(".t-row");
    var name = t.getAttribute("data-trace") || "trace";
    var running = false;
    if (!btn || PRM) return;

    btn.addEventListener("click", function () {
      if (running) return;
      running = true;
      btn.disabled = true;
      if (state) state.textContent = "replaying";
      t.classList.add("replaying");
      rows.forEach(function (r) { r.classList.remove("t-in"); });
      V4.tick("replaying: " + name);
      var i = 0;
      function step() {
        if (i < rows.length) {
          rows[i].classList.add("t-in");
          var delay = parseInt(rows[i].getAttribute("data-d") || "420", 10);
          i += 1;
          window.setTimeout(step, delay);
        } else {
          t.classList.remove("replaying");
          if (state) state.textContent = "complete";
          btn.disabled = false;
          running = false;
          V4.tick("replayed: " + name);
        }
      }
      window.setTimeout(step, 120);
    });
  }

  /* ============ refusal widget ============
     KB JSON (in <script type="application/json" data-refusal-kb>):
     {
       "handoff": "simonermuro@gmail.com",
       "refusals": [
         "out of scope. that one belongs to a human: {email}",
         "still out of scope. the handoff stands: {email}",
         "persistence noted. she will like that. {email}"
       ],
       "entries": [
         { "match": ["resume", "cv"],
           "reply": "one page, same system: resume.html.",
           "href": "resume.html", "link": "resume.html" }
       ]
     }
     Every in-scope reply is labeled curated; everything else is
     refused and handed off. Nothing leaves the tab. */
  function initRefusal(w) {
    var kb = readConfig(w, "[data-refusal-kb]") || {};
    var form = w.querySelector("form");
    var input = w.querySelector("input");
    var log = w.querySelector("[data-refusal-log]");
    if (!form || !input || !log) return;
    var email = kb.handoff || "";
    var refusals = kb.refusals || ["out of scope. that one belongs to a human: {email}"];
    var refusedCount = 0;

    function match(q) {
      var text = q.toLowerCase();
      var entries = kb.entries || [];
      for (var i = 0; i < entries.length; i++) {
        var keys = entries[i].match || [];
        for (var k = 0; k < keys.length; k++) {
          if (text.indexOf(keys[k]) !== -1) return entries[i];
        }
      }
      return null;
    }

    function addTurn(q, tagText, refused, replyText, href, linkText) {
      var turn = document.createElement("div");
      turn.className = "rf-turn";
      var you = document.createElement("p");
      you.className = "rf-you";
      you.textContent = q;
      turn.appendChild(you);
      var page = document.createElement("p");
      page.className = "rf-page";
      var tag = document.createElement("span");
      tag.className = "rf-tag" + (refused ? " rf-refused" : "");
      tag.textContent = tagText;
      page.appendChild(tag);
      page.appendChild(document.createTextNode(replyText + " "));
      if (href) {
        var a = document.createElement("a");
        a.href = href;
        a.textContent = linkText || href;
        page.appendChild(a);
      }
      turn.appendChild(page);
      log.appendChild(turn);
      while (log.children.length > 6) log.removeChild(log.firstChild);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (!q) return;
      input.value = "";
      var hit = match(q);
      if (hit) {
        addTurn(q, "curated, designed response · no live model", false, hit.reply, hit.href, hit.link);
        V4.tick("answered: curated");
      } else {
        var line = refusals[Math.min(refusedCount, refusals.length - 1)].split("{email}").join("").replace(/\s+$/, "");
        refusedCount += 1;
        addTurn(q, "refused: out of scope", true, line, email ? "mailto:" + email : "", email);
        V4.tick("refused: out of scope");
      }
      input.focus();
    });
  }
})();
