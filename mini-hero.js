/* Aavira mini hero banner: auto-sliding secondary banner under the main hero.
   Data sources, in order: window.getMiniBannersData() -> window.MINI_BANNERS ->
   main banners (window.getBannersData) filtered to items marked mini -> luxury defaults.
   To update from the admin side, expose mini banners through any of those sources. */
(function () {
  var DEFAULTS = [
    { title: 'The Festive Edit', sub: 'Handcrafted blouses for every celebration', link: 'categories', bg: 'linear-gradient(120deg,#161616,#3A2A1C)' },
    { title: 'New Arrivals', sub: 'Fresh designs, added weekly', link: 'categories', bg: 'linear-gradient(120deg,#22182B,#161616)' },
    { title: 'Aavira Signature', sub: 'Premium ethnic elegance', link: 'categories', bg: 'linear-gradient(120deg,#101010,#2A2118)' }
  ];
  function okUrl(u) { u = String(u || ''); return /^(https?:\/\/|\/|\.)/.test(u) ? u : ''; }
  function waitFor(fn, ms) {
    return new Promise(function (res) {
      var t = 0;
      (function poll() {
        if (typeof fn() !== 'undefined') return res(fn());
        if (t >= ms) return res(null);
        t += 150; setTimeout(poll, 150);
      })();
    });
  }
  async function loadItems() {
    try {
      var g = await waitFor(function () { return window.getMiniBannersData; }, 1200);
      if (typeof g === 'function') { var d = await g(); if (Array.isArray(d) && d.length) return d; }
      if (Array.isArray(window.MINI_BANNERS) && window.MINI_BANNERS.length) return window.MINI_BANNERS;
      var gb = await waitFor(function () { return window.getBannersData; }, 1200);
      if (typeof gb === 'function') {
        var all = await gb().catch(function () { return []; });
        var mini = (Array.isArray(all) ? all : []).filter(function (b) { return b && /mini/i.test(String(b.type || b.position || b.slot || '')); });
        if (mini.length) return mini;
      }
    } catch (e) { /* fall through to defaults */ }
    return DEFAULTS;
  }
  async function init() {
    var track = document.getElementById('miniTrack');
    var dots = document.getElementById('miniDots');
    var sec = document.getElementById('miniHeroSection');
    if (!track || !dots || !sec) return;
    var items = await loadItems();
    items.forEach(function (b) {
      var img = okUrl(b.imageUrl || b.image || b.url);
      var link = okUrl(b.link);
      var el = document.createElement(link ? 'a' : 'div');
      el.className = 'mini-slide' + (img ? ' has-img' : '');
      if (link) el.href = link;
      if (!img && b.bg) el.style.background = String(b.bg);
      if (img) {
        var im = document.createElement('img');
        im.src = img; im.alt = ''; im.loading = 'lazy';
        im.onerror = function () { im.remove(); el.classList.remove('has-img'); };
        el.appendChild(im);
      }
      if (b.title) {
        var cap = document.createElement('span'); cap.className = 'mini-cap';
        var t = document.createElement('b'); t.textContent = String(b.title); cap.appendChild(t);
        if (b.sub) { var sm = document.createElement('small'); sm.textContent = String(b.sub); cap.appendChild(sm); }
        el.appendChild(cap);
      }
      track.appendChild(el);
    });
    var idx = 0, timer = null;
    items.forEach(function (_, i) {
      var d = document.createElement('span');
      d.className = 'mini-dot' + (i === 0 ? ' is-active' : '');
      d.addEventListener('click', function () { stop(); go(i); play(); });
      dots.appendChild(d);
    });
    function go(i) {
      idx = (i + items.length) % items.length;
      track.style.transform = 'translateX(-' + idx * 100 + '%)';
      Array.prototype.forEach.call(dots.children, function (d, j) { d.classList.toggle('is-active', j === idx); });
    }
    function play() { if (items.length > 1 && !timer) timer = setInterval(function () { go(idx + 1); }, 3200); }
    function stop() { clearInterval(timer); timer = null; }
    sec.addEventListener('pointerdown', stop);
    play();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
