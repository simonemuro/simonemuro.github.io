/* v5-proto.js · the target-state prototype player on charge-lookup.html.
   Adapted from the Thinking Panel hero card (Demo Billing Agent) that
   shipped on the v3 homepage. The static markup in the page is the
   complete conversation; this script only adds an optional animated
   replay of the same run. Pre-scripted, mock data, no live model. */
(function () {
  'use strict';

  var body = document.getElementById('proto-body');
  var ctl = document.getElementById('proto-ctl');
  var btn = document.getElementById('proto-play');
  var lab = document.getElementById('proto-play-lab');
  var proto = document.getElementById('proto');
  if (!body || !ctl || !btn || !lab) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return; /* the static conversation is already complete */

  ctl.hidden = false;

  var timers = [];
  var running = false;

  function wait(ms) {
    return new Promise(function (resolve) {
      timers.push(window.setTimeout(resolve, ms));
    });
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  function show(node) {
    node.classList.add('pa');
    window.requestAnimationFrame(function () { node.classList.add('in'); });
    return node;
  }

  function stream(node, text, speed) {
    return new Promise(function (resolve) {
      var caret = el('span', 'proto-caret');
      node.appendChild(caret);
      var words = text.split(/(\s+)/);
      var i = 0;
      function step() {
        if (i >= words.length) { caret.remove(); resolve(); return; }
        node.insertBefore(document.createTextNode(words[i]), caret);
        i += 1;
        timers.push(window.setTimeout(step, speed + Math.random() * speed));
      }
      step();
    });
  }

  async function runSteps(rail, steps) {
    for (var i = 0; i < steps.length; i += 1) {
      var s = steps[i];
      var row = el('div', 'proto-step busy',
        '<span class="pnode" aria-hidden="true"></span>' +
        '<span class="pact"></span><span class="pres"></span>');
      rail.appendChild(row);
      show(row);
      await stream(row.querySelector('.pact'), s.act, 10);
      await wait(s.dwell || 760);
      row.querySelector('.pres').innerHTML = s.res;
      row.classList.remove('busy');
      row.classList.add('ok');
      await wait(220);
    }
  }

  var explainOnly = proto && proto.getAttribute('data-proto-mode') === 'explain-only';

  var PLAN = explainOnly ?
    'Let me confirm a few things before I open your billing, trace why this month looks different, and verify whether it was a duplicate charge.' :
    'Let me confirm a few things before I open your billing, trace why this cycle looks different, and check whether any of it can be eased for you.';

  var WORK_STEPS = explainOnly ? [
    { act: 'Verifying account access', res: 'account owner · verified', dwell: 720 },
    { act: 'Reading your plan', res: 'QuickBooks Online Plus · Payroll Core', dwell: 780 },
    { act: 'Pulling this month’s charges', res: '$224.00 · $50 more than last month', dwell: 880 },
    { act: 'Finding what changed', res: 'QuickBooks Time added <span class="em">+$50</span> · 3 users', dwell: 900 },
    { act: 'Verifying billing logic', res: 'base plan unchanged · not a duplicate charge', dwell: 920 }
  ] : [
    { act: 'Verifying account access', res: 'account owner · verified', dwell: 720 },
    { act: 'Reading your plan', res: 'Plus plan · Payroll · Payments', dwell: 780 },
    { act: 'Counting your team', res: '16 active · 2 added this cycle', dwell: 800 },
    { act: 'Pulling this cycle’s charges', res: '$288.00 · $60 more than last month', dwell: 880 },
    { act: 'Finding what changed', res: 'welcome rate ended <span class="em">+$48</span> · 2 seats +$12', dwell: 900 },
    { act: 'Checking what could ease the increase', res: 'welcome rate may extend · annual billing available', dwell: 920 }
  ];

  var LEAD = explainOnly ?
    'That $224.00 is this month’s subscription charge. Here’s what’s behind it.' :
    'Here is what is behind the $288.00 this cycle.';
  var SAY = explainOnly ?
    'It’s $50.00 more than last month’s $174.00 for one reason: QuickBooks Time was added to the account with three users. Your base plan price didn’t change, and you weren’t billed twice.' :
    'Two things changed it. First, you added 2 team members at $6 each, which adds $12 and covers their payroll tax filings automatically. Second, your 6-month welcome rate finished this cycle, which had been taking $48 off your bill. Together those bring your monthly total from $228 to $288, an increase of $60. Everything else is the same plan you already had.';

  var ROWS_HTML = explainOnly ?
    '<div class="m-row" role="row"><span class="rlab" role="cell"><b>QuickBooks Online Plus</b><span class="rsub">base subscription, monthly</span></span><span class="ramt" role="cell">$99.00</span></div>' +
    '<div class="m-row" role="row"><span class="rlab" role="cell"><b>Payroll Core</b><span class="rsub">$45.00 base, 5 employees at $6.00</span></span><span class="ramt" role="cell">$75.00</span></div>' +
    '<div class="m-row" role="row"><span class="rlab" role="cell"><b>QuickBooks Time Premium</b><span class="rsub">$20.00 base, 3 users at $10.00</span></span><span class="ramt" role="cell">$50.00</span></div>' +
    '<div class="m-row total" role="row"><span class="rlab" role="cell">Total this month</span><span class="ramt" role="cell">$224.00</span></div>' :
    '<div class="m-row" role="row"><span class="rlab" role="cell"><b>Plus plan</b><span class="rsub">base subscription, monthly</span></span><span class="ramt" role="cell">$99.00</span></div>' +
    '<div class="m-row" role="row"><span class="rlab" role="cell"><b>Payroll</b><span class="rsub">monthly subscription</span></span><span class="ramt" role="cell">$50.00</span></div>' +
    '<div class="m-row" role="row"><span class="rlab" role="cell"><b>Team members</b><span class="rsub">16 active, $6.00 each</span></span><span class="ramt" role="cell">$96.00</span></div>' +
    '<div class="m-row" role="row"><span class="rlab" role="cell"><b>Payments processing</b><span class="rsub">card fees this month</span></span><span class="ramt" role="cell">$43.00</span></div>' +
    '<div class="m-row total" role="row"><span class="rlab" role="cell">Total this cycle</span><span class="ramt" role="cell">$288.00</span></div>';

  var CHANGE_HTML = explainOnly ?
    '<div class="pch-head"><span>Changed this month</span><span class="pch-amt">+$50.00</span></div>' +
    '<div class="pch-row"><span>QuickBooks Time added, 3 users</span><span class="pch-amt">+$50.00</span></div>' :
    '<div class="pch-head"><span>Changed this cycle</span><span class="pch-amt">+$60.00</span></div>' +
    '<div class="pch-row"><span>2 team members added</span><span class="pch-amt">+$12.00</span></div>' +
    '<div class="pch-row"><span>6-month welcome rate ended</span><span class="pch-amt">+$48.00</span></div>';

  var OFFER = 'One more thing I noticed while reviewing your account. The welcome rate that just ended was the largest part of this change, so I checked whether it could continue. You may qualify to extend it, and I can request that for you now.';

  var ACT_STEPS = [
    { act: 'Extending your welcome rate', res: 'extended through September', dwell: 760 },
    { act: 'Crediting your card', res: '$48.00 refunded · card ending 4417', dwell: 780 },
    { act: 'Setting your reminder', res: 'an email before the rate returns', dwell: 720 }
  ];

  var SUMMARY_HTML =
    '<div class="psec"><p class="psec-h">What I did</p>' +
    '<div class="prow"><span>Refund to your card ending 4417</span><span class="pv">$48.00</span></div>' +
    '<div class="prow"><span>Welcome rate extended</span><span class="pv">through September</span></div></div>' +
    '<div class="psec"><p class="psec-h">What to expect · each cycle</p>' +
    '<div class="prow"><span>Subscription through September</span><span class="pv">$197.00</span></div>' +
    '<div class="prow"><span>Subscription from October</span><span class="pv">$245.00</span></div>' +
    '<div class="prow"><span>Payments processing</span><span class="pv">varies · was $43.00</span></div></div>' +
    '<p class="pfoot">Mock data</p>';

  var NOTE = 'So about $240 a month while the discount holds, a little more or less with your payments. The extra $12 is your two new team members. I will email you before the rate returns in October.';

  async function run() {
    if (running) return;
    running = true;
    btn.disabled = true;
    lab.textContent = 'Playing';
    body.innerHTML = '';

    var user1 = el('div', 'm-user', explainOnly ?
      'I see a $224 charge from Intuit I don’t recognize. What is it?' :
      'I see a $288 charge on my card I do not recognize. Can you help me understand it?');
    body.appendChild(user1);
    show(user1);
    await wait(800);

    var agent1 = el('div', 'm-agent');
    body.appendChild(agent1);

    var work = el('details', 'm-work proto-work',
      '<summary><span class="chev" aria-hidden="true">&#8250;</span><span class="wlab">Working</span></summary>' +
      '<div class="proto-workbody"><p class="proto-plan"></p><div class="proto-steps"></div></div>');
    work.open = true;
    agent1.appendChild(work);
    show(work);
    await stream(work.querySelector('.proto-plan'), PLAN, 12);
    await wait(420);
    await runSteps(work.querySelector('.proto-steps'), WORK_STEPS);
    work.querySelector('.wlab').textContent = 'Work done';
    await wait(620);
    work.open = false;
    await wait(420);

    var lead = el('p', 'proto-lead');
    agent1.appendChild(lead);
    show(lead);
    await stream(lead, LEAD, 13);
    var say = el('p');
    agent1.appendChild(say);
    show(say);
    await stream(say, SAY, 11);

    var rows = el('div', 'm-rows', ROWS_HTML);
    rows.setAttribute('role', 'table');
    rows.setAttribute('aria-label', 'Charge breakdown, this cycle');
    agent1.appendChild(rows);
    show(rows);
    await wait(520);

    var change = el('div', 'proto-change', CHANGE_HTML);
    agent1.appendChild(change);
    show(change);
    await wait(700);

    if (explainOnly) {
      var explainChips = el('div', 'proto-chips');
      ['View billing history', 'Review invoice details'].forEach(function (t) {
        explainChips.appendChild(el('span', 'proto-chip', t));
      });
      agent1.appendChild(explainChips);
      show(explainChips);
      await wait(720);
      running = false;
      btn.disabled = false;
      lab.textContent = 'Replay the prototype';
      return;
    }

    var offer = el('p');
    agent1.appendChild(offer);
    show(offer);
    await stream(offer, OFFER, 11);

    var chips = el('div', 'proto-chips');
    ['Yes, extend my welcome rate', 'Other ways to save', 'No thanks, all set'].forEach(function (t) {
      chips.appendChild(el('span', 'proto-chip', t));
    });
    agent1.appendChild(chips);
    show(chips);
    await wait(1100);

    chips.remove();
    var user2 = el('div', 'm-user', 'Yes, extend my welcome rate.');
    body.appendChild(user2);
    show(user2);
    await wait(620);

    var agent2 = el('div', 'm-agent');
    body.appendChild(agent2);
    var rail2 = el('div', 'proto-steps');
    agent2.appendChild(rail2);
    show(rail2);
    await runSteps(rail2, ACT_STEPS);
    await wait(360);

    var conf = el('p');
    agent2.appendChild(conf);
    show(conf);
    await stream(conf, 'Done. Here is what I changed and what to expect.', 13);

    var summary = el('div', 'proto-summary', SUMMARY_HTML);
    agent2.appendChild(summary);
    show(summary);
    await wait(560);

    var note = el('p');
    agent2.appendChild(note);
    show(note);
    await stream(note, NOTE, 11);
    await wait(720);

    var user3 = el('div', 'm-user', 'That is exactly what I was hoping for. Thank you.');
    body.appendChild(user3);
    show(user3);
    await wait(620);

    var agent3 = el('div', 'm-agent');
    body.appendChild(agent3);
    var bye = el('p');
    agent3.appendChild(bye);
    show(bye);
    await stream(bye, 'Happy to help. You are all set.', 13);

    running = false;
    btn.disabled = false;
    lab.textContent = 'Replay the prototype';
  }

  btn.addEventListener('click', function () { run(); });
})();
