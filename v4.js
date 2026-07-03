/* ============================================================
   PORTFOLIO V4 · shared behavior · no dependencies
   Components auto-init on DOM ready:
     .io / .rule-io          scroll reveals (reduced motion: complete)
     #progress               reading progress hairline
     [data-trace]            runtime trace with replay (pre-rendered)
     [data-refusal]          scoped question box (KB JSON inside)
   Public API:
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

  function readConfig(root, sel) {
    var node = root.querySelector(sel);
    if (!node) return null;
    try { return JSON.parse(node.textContent); } catch (e) { return null; }
  }

  ready(function () {
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

    /* ---------- runtime traces ---------- */
    document.querySelectorAll("[data-trace]").forEach(initTrace);

    /* ---------- refusal widgets ---------- */
    document.querySelectorAll("[data-refusal]").forEach(initRefusal);
  });

  /* ============ runtime trace ============
     Rows are pre-rendered in the HTML; replay hides then
     re-reveals them in sequence. Hidden entirely for
     reduced motion (the trace is already complete). */
  function initTrace(t) {
    var btn = t.querySelector("[data-trace-replay]");
    var state = t.querySelector("[data-trace-state]");
    var rows = t.querySelectorAll(".t-row");
    var running = false;
    if (!btn || PRM) return;

    btn.addEventListener("click", function () {
      if (running) return;
      running = true;
      btn.disabled = true;
      if (state) state.textContent = "replaying";
      t.classList.add("replaying");
      rows.forEach(function (r) { r.classList.remove("t-in"); });
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
         "still out of scope. the handoff stands: {email}"
       ],
       "entries": [
         { "match": ["resume", "cv"],
           "reply": "one page, same system: resume.html.",
           "href": "resume.html", "link": "resume.html" }
       ]
     }
     Two modes:
     - CURATED (default, no backend): every in-scope reply is labeled
       curated; everything else is refused and handed off. Nothing
       leaves the tab.
     - LIVE: if window.SM_AGENT_ENDPOINT is set (read from a
       <meta name="agent-endpoint"> tag, see index.html), the widget
       becomes a real chat: input → POST {messages} to the Cloudflare
       Worker → render {reply, sources}. On any fetch failure it
       degrades back to curated mode and says so honestly. */

  /* live-mode endpoint: meta tag wins, then a pre-set global */
  function agentEndpoint() {
    var meta = document.querySelector('meta[name="agent-endpoint"]');
    if (meta && meta.getAttribute("content")) {
      window.SM_AGENT_ENDPOINT = meta.getAttribute("content");
    }
    return window.SM_AGENT_ENDPOINT || "";
  }

  function initRefusal(w) {
    var kb = readConfig(w, "[data-refusal-kb]") || {};
    var form = w.querySelector("form");
    var input = w.querySelector("input");
    var log = w.querySelector("[data-refusal-log]");
    if (!form || !input || !log) return;
    var email = kb.handoff || "";
    var refusals = kb.refusals || ["out of scope. that one belongs to a human: {email}"];
    var refusedCount = 0;

    var endpoint = agentEndpoint();
    var live = !!endpoint;      // live until the first failure
    var history = [];           // {role, content} turns for the worker
    var pending = false;

    /* live mode announces itself in the widget header */
    if (live) {
      var hd = w.querySelector(".refusal-hd span:last-child");
      if (hd) hd.textContent = "scope: Simone's work · live agent · grounded in her public pages";
      var foot = w.querySelector(".refusal-foot");
      if (foot) foot.textContent = "live mode: your question goes to her agent endpoint, is answered from her public pages, and is not logged";
    }

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

    function addTurn(q, tagText, refused, replyText, href, linkText, sources) {
      var turn = document.createElement("div");
      turn.className = "rf-turn";
      if (q !== null) {
        var you = document.createElement("p");
        you.className = "rf-you";
        you.textContent = q;
        turn.appendChild(you);
      }
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
      if (sources && sources.length) {
        page.appendChild(document.createElement("br"));
        page.appendChild(document.createTextNode("sources: "));
        for (var i = 0; i < sources.length; i++) {
          if (i > 0) page.appendChild(document.createTextNode(" · "));
          var s = document.createElement("a");
          s.href = sources[i].page;
          s.textContent = sources[i].page;
          s.title = sources[i].title || "";
          page.appendChild(s);
        }
      }
      turn.appendChild(page);
      log.appendChild(turn);
      while (log.children.length > 8) log.removeChild(log.firstChild);
      return turn;
    }

    /* curated path: the designed no-backend behavior (and the fallback) */
    function curatedAnswer(q) {
      var hit = match(q);
      if (hit) {
        addTurn(q, "curated, designed response · no live model", false, hit.reply, hit.href, hit.link);
      } else {
        var line = refusals[Math.min(refusedCount, refusals.length - 1)].split("{email}").join("").replace(/\s+$/, "");
        refusedCount += 1;
        addTurn(q, "refused: out of scope", true, line, email ? "mailto:" + email : "", email);
      }
    }

    /* live path: POST to the worker; on any failure, honest notice +
       permanent degradation to curated mode (K5). */
    function liveAsk(q) {
      pending = true;
      history.push({ role: "user", content: q });
      if (history.length > 12) history = history.slice(-12);
      var thinking = addTurn(q, "live agent", false, "…", "", "");
      fetch(endpoint.replace(/\/$/, "") + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      })
        .then(function (r) {
          if (!r.ok) throw new Error("status " + r.status);
          return r.json();
        })
        .then(function (data) {
          pending = false;
          if (!data || typeof data.reply !== "string") throw new Error("bad payload");
          log.removeChild(thinking);
          history.push({ role: "assistant", content: data.reply });
          addTurn(q, "live agent · answered from her public pages", false, data.reply, "", "", data.sources || []);
        })
        .catch(function () {
          pending = false;
          live = false;
          history = [];
          if (thinking.parentNode === log) log.removeChild(thinking);
          addTurn(null, "notice", true,
            "The live agent is unreachable right now, so this box just downgraded itself to curated replies. " +
            "Same honesty, smaller brain. A human is always reachable:",
            email ? "mailto:" + email : "", email);
          curatedAnswer(q);
        });
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim();
      if (!q || pending) return;
      input.value = "";
      if (live) {
        liveAsk(q);
      } else {
        curatedAnswer(q);
      }
      input.focus();
    });
  }
})();
