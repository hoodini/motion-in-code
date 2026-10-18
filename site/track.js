/* Motion pages: first-party reading analytics.
 * One small script for both homes of the pages. The exporter sets SITE:
 *   'news' -> news.yuv.ai   POST /api/track             (the newsroom's own tracker format, same visitor id: yuv_vid)
 *   'yuv'  -> yuv.ai        POST /api/analytics/events  (yuv.ai's own tracker format, same ids: yuv-visitor-id / yuv-session-id)
 * What it measures, so the dashboards can answer "how many came, and how many actually read":
 *   page view · every section a reader reached (section_view) · scroll depth · engaged time (only while the tab is visible)
 *   · clicks and outbound links · every prompt copy (prompt_copy, with the prompt's id)
 * No cookies, no fingerprinting, no third-party calls here (GA is loaded only where the site already uses it). */
(function () {
  'use strict';
  var SITE = '__SITE__', GA = '__GA__', FB = '__FB__';
  if (window.__motionTrack) return; window.__motionTrack = 1;
  if (/bot|crawl|spider|headless|lighthouse/i.test(navigator.userAgent)) return;

  var path = location.pathname.replace(/\/index\.html$/, '').replace(/(.)\/$/, '$1');
  var lang = document.documentElement.lang || '';
  var mem = {};
  function store(kind, k, v) {
    try { var s = window[kind]; if (v === undefined) return s.getItem(k); s.setItem(k, v); }
    catch (e) { if (v === undefined) return mem[kind + k] || null; mem[kind + k] = v; }
    return v;
  }
  function uid() { return (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 11); }

  /* ---------- reading signals (shared) ---------- */
  var maxScroll = 0, engaged = 0, visibleSince = document.visibilityState === 'visible' ? Date.now() : 0, seen = {}, queue = [];
  function scrollPct() { var h = document.documentElement; return Math.min(100, Math.round((h.scrollTop + h.clientHeight) / Math.max(h.scrollHeight, 1) * 100)); }
  function engagedMs() { return engaged + (visibleSince ? Date.now() - visibleSince : 0); }
  function label(el) { return (el && el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80); }
  function promptId(btn) {
    var pre = btn.parentElement && btn.parentElement.querySelector('pre');
    var host = btn.closest('article[id], section[id]');
    return [host && host.id, pre && (pre.id || pre.getAttribute('data-prompt'))].filter(Boolean).join(':') || 'prompt';
  }

  /* ---------- per-site transport ---------- */
  var T;
  if (SITE === 'news') {
    var vid = store('localStorage', 'yuv_vid') || store('localStorage', 'yuvai-vid') || uid(); store('localStorage', 'yuv_vid', vid);
    var sid = function () {
      var now = Date.now(), s = store('sessionStorage', 'yuv_sid'), last = +(store('sessionStorage', 'yuv_sid_t') || 0);
      if (!s || now - last > 30 * 60 * 1000) { s = uid(); store('sessionStorage', 'yuv_sid', s); }
      store('sessionStorage', 'yuv_sid_t', String(now)); return s;
    };
    var utm = function () { var p = new URLSearchParams(location.search), o = {}; ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content'].forEach(function (k) { var v = p.get(k); if (v) o[k] = v; }); return o; };
    T = {
      pageview: function () { return { type: 'pageview', path: path }; },
      section: function (id) { return { type: 'custom', path: path, elementText: id, meta: { name: 'section_view', id: id, lang: lang } }; },
      milestone: function () { return null; },
      click: function (e, el, href, out) { return { type: out ? 'outbound' : 'click', path: path, href: href || undefined, elementText: label(el) || undefined,
        x: +(e.pageX / Math.max(document.documentElement.scrollWidth, 1)).toFixed(4), y: +(e.pageY / Math.max(document.documentElement.scrollHeight, 1)).toFixed(4) }; },
      copy: function (id, text) { return { type: 'custom', path: path, elementText: text, meta: { name: 'prompt_copy', id: id, lang: lang } }; },
      exit: function () { return { type: 'scroll', path: path, scrollPct: maxScroll, durationMs: engagedMs(), meta: { name: 'read', lang: lang } }; },
      send: function (evs, beacon) {
        var body = JSON.stringify({ vid: vid, sid: sid(), consent: store('localStorage', 'yuv_consent') === 'granted', ua: navigator.userAgent, ref: document.referrer, utm: utm(), events: evs });
        if (beacon && navigator.sendBeacon) navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
        else fetch('/api/track', { method: 'POST', body: body, headers: { 'Content-Type': 'application/json' }, keepalive: true }).catch(function () {});
      }
    };
  } else {
    var visitorId = store('localStorage', 'yuv-visitor-id') || uid(); store('localStorage', 'yuv-visitor-id', visitorId);
    var sessionId = store('sessionStorage', 'yuv-session-id'), fresh = !sessionId;
    if (fresh) { sessionId = uid(); store('sessionStorage', 'yuv-session-id', sessionId); }
    var now = function () { return new Date().toISOString(); };
    if (fresh) {
      var q = new URLSearchParams(location.search), w = innerWidth, ua = navigator.userAgent;
      fetch('/api/analytics/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, keepalive: true, body: JSON.stringify({ visitorId: visitorId, sessionId: sessionId, sessionData: {
        device: w < 768 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop',
        browser: /edg/i.test(ua) ? 'edge' : /chrome/i.test(ua) ? 'chrome' : /safari/i.test(ua) ? 'safari' : /firefox/i.test(ua) ? 'firefox' : 'other',
        os: /Win/.test(ua) ? 'windows' : /Mac/.test(ua) ? 'macos' : /Android/.test(ua) ? 'android' : /iPhone|iPad/.test(ua) ? 'ios' : /Linux/.test(ua) ? 'linux' : 'other',
        screenSize: innerWidth + 'x' + innerHeight, referrer: document.referrer || 'direct',
        utmSource: q.get('utm_source') || undefined, utmMedium: q.get('utm_medium') || undefined, utmCampaign: q.get('utm_campaign') || undefined, landingPage: path } }) }).catch(function () {});
    }
    T = {
      pageview: function () { return { eventType: 'page_view', page: path, timestamp: now(), data: { referrer: document.referrer, title: document.title, lang: lang } }; },
      section: function (id) { return { eventType: 'section_view', page: path, timestamp: now(), data: { id: id, lang: lang } }; },
      milestone: function (m) { return { eventType: 'scroll_milestone', page: path, timestamp: now(), scrollDepth: m }; },
      click: function (e, el, href, out) {
        var t = e.target, info = t.tagName.toLowerCase() + (t.id ? '#' + t.id : '') + (typeof t.className === 'string' && t.className ? '.' + t.className.split(' ').slice(0, 2).join('.') : '');
        return { eventType: 'click', page: path, timestamp: now(), positionX: Math.round(e.pageX / innerWidth * 100), positionY: Math.round(e.pageY / document.documentElement.scrollHeight * 100),
          data: { target: info, href: href || undefined, text: label(el) || undefined, outbound: out || undefined } };
      },
      copy: function (id, text) { return { eventType: 'prompt_copy', page: path, timestamp: now(), data: { id: id, label: text, lang: lang } }; },
      exit: function () { return { eventType: 'page_exit', page: path, timestamp: now(), timeOnPage: Math.round(engagedMs() / 1000), scrollDepth: maxScroll }; },
      send: function (evs, beacon) {
        var body = JSON.stringify({ visitorId: visitorId, sessionId: sessionId, events: evs, sessionUpdate: beacon ? { exitPage: path, isBounce: maxScroll < 25 } : undefined });
        if (beacon && navigator.sendBeacon) navigator.sendBeacon('/api/analytics/events', body);
        else fetch('/api/analytics/events', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true }).catch(function () {});
      }
    };
  }

  function push(ev) { if (ev) queue.push(ev); if (queue.length >= 8) flush(); }
  function flush(beacon) { if (queue.length) T.send(queue.splice(0, 50), beacon); }

  /* ---------- Google Analytics / Meta Pixel, only where the site already runs them ---------- */
  if (GA && GA.indexOf('__') !== 0) {
    var g = document.createElement('script'); g.async = true; g.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA; document.head.appendChild(g);
    window.dataLayer = window.dataLayer || []; window.gtag = window.gtag || function () { dataLayer.push(arguments); };
    gtag('js', new Date()); gtag('config', GA, { anonymize_ip: true });
  }
  if (FB && FB.indexOf('__') !== 0 && !window.fbq) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n;
      n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', FB); fbq('track', 'PageView');
  }
  function gaEvent(name, params) { try { if (window.gtag && GA.indexOf('__') !== 0) gtag('event', name, params); } catch (e) {} }

  /* ---------- wire it up ---------- */
  push(T.pageview()); setTimeout(flush, 800);
  maxScroll = scrollPct();

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var id = e.target.id;
        if (e.isIntersecting && !seen[id]) { seen[id] = 1; push(T.section(id)); io.unobserve(e.target); }
      });
    }, { threshold: 0.25 });
    var watch = function () { document.querySelectorAll('main section[id], main article.el[id]').forEach(function (el) { io.observe(el); }); };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
  }

  var marks = [25, 50, 75, 100];
  window.addEventListener('scroll', function () {
    var p = scrollPct(); if (p <= maxScroll) return; maxScroll = p;
    while (marks.length && p >= marks[0]) push(T.milestone(marks.shift()));
  }, { passive: true });

  document.addEventListener('click', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('a,button') : null;
    if (el && el.matches('.cp, .pb-cp')) {
      var id = promptId(el); push(T.copy(id, label(el.closest('article, section') && el.closest('article, section').querySelector('h2, h3')) || id)); flush();
      gaEvent('prompt_copy', { prompt_id: id, page_language: lang });
      return;
    }
    var href = el && el.getAttribute('href'), out = !!href && /^https?:\/\//.test(href) && href.indexOf(location.host) < 0;
    push(T.click(e, el, href, out));
  }, true);

  // news: a read event on every hide (its dashboard keeps the max, like the site's own tracker);
  // yuv: one page_exit per page view, on the real unload, so average time on page is not double counted
  var exited = false;
  function onHide(final) {
    if (visibleSince) { engaged += Date.now() - visibleSince; visibleSince = 0; }
    if (SITE === 'news' ? maxScroll > 0 : (final && !exited)) { exited = true; push(T.exit()); }
    flush(true);
  }
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') onHide(false); else visibleSince = Date.now();
  });
  window.addEventListener('pagehide', function () { onHide(true); });
  setInterval(function () { flush(); }, 8000);
})();
