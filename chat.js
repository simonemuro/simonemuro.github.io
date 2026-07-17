/* ============================================================
   CHAT DRAWER · first-person portfolio agent (no dependencies)
   - Opens from any [data-chat-open]; closes on X / scrim / Esc.
   - Sends {messages:[...]} to the agent endpoint (meta[name=agent-endpoint])
     and renders {reply, sources}. On any failure it says so honestly and
     hands off to email. Never invents an answer.
   - Focus is trapped while open; the log announces new turns (aria-live).
   ============================================================ */
(function () {
  "use strict";

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function endpoint() {
    var m = document.querySelector('meta[name="agent-endpoint"]');
    var ep = m && m.getAttribute("content") ? m.getAttribute("content") : "";
    if (!ep || ep.indexOf("YOUR-SUBDOMAIN") !== -1) return "";
    return ep.replace(/\/$/, "");
  }

  /* ---- safe render: escape, then a tiny markdown subset (bold, bullets) ---- */
  function esc(s) {
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  function inline(s) {
    return esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  }
  function renderReply(container, text) {
    // drop the internal "consulted: ..." trace line; sources render separately
    var body = text.split(/\n+consulted:/i)[0].trim();
    var blocks = body.split(/\n{2,}/);
    blocks.forEach(function (block) {
      var lines = block.split(/\n/);
      var bullets = lines.filter(function (l) { return /^\s*[-*]\s+/.test(l); });
      if (bullets.length && bullets.length === lines.length) {
        var ul = document.createElement("ul");
        bullets.forEach(function (l) {
          var li = document.createElement("li");
          li.innerHTML = inline(l.replace(/^\s*[-*]\s+/, ""));
          ul.appendChild(li);
        });
        container.appendChild(ul);
      } else {
        var p = document.createElement("p");
        p.innerHTML = inline(block).replace(/\n/g, "<br>");
        container.appendChild(p);
      }
    });
  }

  ready(function () {
    var drawer = document.getElementById("chat-drawer");
    if (!drawer) return;
    var scrim = document.querySelector("[data-chat-scrim]");
    var fab = document.querySelector(".chat-fab");
    var log = drawer.querySelector("[data-chat-log]");
    var suggest = drawer.querySelector("[data-chat-suggest]");
    var form = drawer.querySelector("[data-chat-form]");
    var input = drawer.querySelector("[data-chat-input]");
    var sendBtn = drawer.querySelector("[data-chat-send]");
    var EP = endpoint();
    var CONTACT = "simonermuro@gmail.com";

    var history = [];   // {role, content} for the worker
    var live = !!EP;    // live until the first failure this session
    var pending = false;
    var lastFocus = null;

    /* ---------- open / close ----------
       Two modes:
       - DOCKED (wide viewports): the page gets padding-right and shifts
         left so all content stays visible and interactive. No scrim, no
         scroll lock, no focus trap: the drawer is a side panel, not a modal.
       - MODAL (narrow viewports): the original overlay/bottom-sheet with
         scrim, scroll lock, and focus trap. */
    var DOCK = window.matchMedia("(min-width: 1000px)");
    function open() {
      if (drawer.classList.contains("open")) return;
      lastFocus = document.activeElement;
      var dock = DOCK.matches;
      drawer.hidden = false;
      drawer.setAttribute("aria-modal", dock ? "false" : "true");
      if (dock) {
        document.body.classList.add("chat-docked");
      } else {
        scrim.hidden = false;
        document.body.style.overflow = "hidden";
      }
      requestAnimationFrame(function () {
        if (!DOCK.matches) scrim.classList.add("open");
        drawer.classList.add("open");
      });
      setTimeout(function () { input && input.focus(); }, 120);
    }
    function close() {
      scrim.classList.remove("open"); drawer.classList.remove("open");
      document.body.classList.remove("chat-docked");
      document.body.style.overflow = "";
      setTimeout(function () { scrim.hidden = true; drawer.hidden = true; }, 340);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    document.querySelectorAll("[data-chat-open]").forEach(function (b) {
      b.addEventListener("click", function (e) { e.preventDefault(); open(); });
    });
    drawer.querySelectorAll("[data-chat-close]").forEach(function (b) {
      b.addEventListener("click", close);
    });
    scrim.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && drawer.classList.contains("open")) close();
    });

    /* focus trap while open — modal mode only; a docked panel must not
       trap focus, the rest of the page stays usable beside it */
    drawer.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !drawer.classList.contains("open")) return;
      if (drawer.getAttribute("aria-modal") !== "true") return;
      var f = drawer.querySelectorAll('button, [href], input, [tabindex]:not([tabindex="-1"])');
      f = Array.prototype.filter.call(f, function (el) { return !el.disabled && el.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });

    /* fab appears once the hero is scrolled past */
    if (fab) {
      var hero = document.getElementById("about");
      if ("IntersectionObserver" in window && hero) {
        new IntersectionObserver(function (ents) {
          fab.classList.toggle("show", !ents[0].isIntersecting);
        }, { threshold: 0 }).observe(hero);
      } else { fab.classList.add("show"); }
    }

    /* ---------- turns ---------- */
    function addUser(text) {
      var m = document.createElement("div"); m.className = "msg user";
      var r = document.createElement("span"); r.className = "role"; r.textContent = "you";
      var b = document.createElement("div"); b.className = "bubble"; b.textContent = text;
      m.appendChild(r); m.appendChild(b); log.appendChild(m);
      log.scrollTop = log.scrollHeight;
    }
    function agentShell() {
      var m = document.createElement("div"); m.className = "msg agent";
      var r = document.createElement("span"); r.className = "role"; r.textContent = "Simone";
      var b = document.createElement("div"); b.className = "bubble";
      m.appendChild(r); m.appendChild(b); log.appendChild(m);
      log.scrollTop = log.scrollHeight;
      return { msg: m, bubble: b };
    }
    function addThinking() {
      var s = agentShell();
      s.bubble.classList.add("thinking");
      s.bubble.innerHTML = "<i></i><i></i><i></i>";
      return s;
    }
    function fillSources(msg, sources) {
      if (!sources || !sources.length) return;
      var seen = {}, wrap = document.createElement("p"); wrap.className = "sources";
      var label = document.createElement("b"); label.textContent = "grounded in"; wrap.appendChild(label);
      sources.forEach(function (s) {
        if (!s || !s.page || seen[s.page]) return; seen[s.page] = 1;
        var a = document.createElement("a"); a.href = s.page; a.textContent = s.page;
        if (s.title) a.title = s.title; wrap.appendChild(a);
      });
      msg.appendChild(wrap);
    }

    /* ---------- send ---------- */
    function ask(q) {
      if (!q || pending) return;
      if (suggest) suggest.hidden = true;
      addUser(q);
      if (!live || !EP) { honestFail(); return; }
      pending = true; sendBtn.disabled = true;
      history.push({ role: "user", content: q });
      if (history.length > 12) history = history.slice(-12);
      var thinking = addThinking();
      fetch(EP + "/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      })
        .then(function (r) { if (!r.ok) throw new Error("status " + r.status); return r.json(); })
        .then(function (data) {
          if (!data || typeof data.reply !== "string") throw new Error("bad payload");
          thinking.bubble.classList.remove("thinking"); thinking.bubble.innerHTML = "";
          renderReply(thinking.bubble, data.reply);
          fillSources(thinking.msg, data.sources);
          history.push({ role: "assistant", content: data.reply });
          pending = false; sendBtn.disabled = false;
          log.scrollTop = log.scrollHeight;
          input.focus();
        })
        .catch(function () {
          if (thinking.msg.parentNode === log) log.removeChild(thinking.msg);
          live = false; history = []; pending = false; sendBtn.disabled = false;
          honestFail();
        });
    }
    function honestFail() {
      var s = agentShell();
      var p = document.createElement("p");
      p.innerHTML = "I cannot reach my live brain right now, so I do not want to guess. " +
        "The real me is fast on email: <a href=\"mailto:" + CONTACT + "\">" + CONTACT + "</a>.";
      s.bubble.appendChild(p);
      log.scrollTop = log.scrollHeight;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var q = input.value.trim();
      input.value = "";
      ask(q);
    });

    /* suggestion chips */
    if (suggest) {
      suggest.querySelectorAll(".chip").forEach(function (chip) {
        chip.addEventListener("click", function () { ask(chip.textContent.trim()); });
      });
    }

    /* clear */
    drawer.querySelectorAll("[data-chat-clear]").forEach(function (b) {
      b.addEventListener("click", function () {
        history = []; live = !!EP;
        log.querySelectorAll(".msg").forEach(function (m) {
          if (!m.hasAttribute("data-keep")) m.remove();
        });
        if (suggest) suggest.hidden = false;
        input.focus();
      });
    });
  });
})();
