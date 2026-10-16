/* ============================================================
   Aavira Cookie Consent v1.0 — self-contained, ultra professional
   One script tag deploys the whole system on any page:
     <script src="/cookie-consent.js" defer></script>
   - Floating consent banner (Accept / Reject / Customise)
   - Preferences sheet with granular category toggles
   - Consent stored locally (never sent anywhere)
   - Script gating: AaviraConsent.loadScript(src, category)
   - Re-open anytime: AaviraConsent.openPrefs()
   ============================================================ */
(function () {
  'use strict';

  var KEY = 'aavira_cookie_consent_v1';
  var CONSENT_VERSION = 1;

  var CATS = [
    { id: 'necessary', name: 'Necessary', desc: 'Required for the cart, checkout, sign-in and security. The store cannot work without these, so they are always on.', locked: true },
    { id: 'preferences', name: 'Preferences', desc: 'Remembers your choices, such as recently viewed items, filters and display settings.' },
    { id: 'analytics', name: 'Analytics', desc: 'Helps us understand how visitors use the store (anonymous statistics) so we can improve it.' },
    { id: 'marketing', name: 'Marketing', desc: 'Used to show you relevant offers and measure how our campaigns perform.' }
  ];

  /* ---------------- CSS (injected, brand-matched) ---------------- */
  var CSS = ''
    + '.avck-banner{position:fixed;z-index:12000;left:12px;right:12px;bottom:calc(98px + env(safe-area-inset-bottom,0px));margin:0 auto;max-width:440px;'
    + 'background:#FFFDF8;border:1px solid #EDE4D3;border-radius:20px;box-shadow:0 24px 48px -16px rgba(30,25,20,.35);'
    + 'transform:translateY(24px);opacity:0;pointer-events:none;transition:transform .45s cubic-bezier(.22,1,.36,1),opacity .35s}'
    + '.avck-banner.avck-show{transform:none;opacity:1;pointer-events:auto}'
    + '.avck-binner{display:flex;gap:12px;padding:16px;align-items:flex-start}'
    + '.avck-bicon{flex:0 0 auto;width:40px;height:40px;border-radius:50%;background:#161616;color:#EFD281;display:flex;align-items:center;justify-content:center;font-size:20px}'
    + '.avck-btext{flex:1;min-width:0}'
    + '.avck-btext b{font-size:14px;color:#1c1a12;display:block;margin-bottom:4px}'
    + '.avck-btext p{font-size:12.5px;line-height:1.55;color:#6b6257;margin:0 0 12px}'
    + '.avck-bactions{display:flex;gap:8px;align-items:center;flex-wrap:wrap}'
    + '.avck-btn{border:0;cursor:pointer;font-weight:700;font-size:13px;padding:11px 18px;border-radius:999px;transition:transform .15s,box-shadow .2s}'
    + '.avck-btn:active{transform:scale(.97)}'
    + '.avck-primary{background:#161616;color:#fff;box-shadow:0 10px 20px -10px rgba(0,0,0,.5)}'
    + '.avck-ghost{background:transparent;color:#1c1a12;border:1px solid #D8CDB8}'
    + '.avck-link{background:none;border:0;cursor:pointer;font-size:12.5px;font-weight:600;color:#8a7a4a;text-decoration:underline;text-underline-offset:3px;padding:8px 4px}'
    + '.avck-modal{position:fixed;inset:0;z-index:12100;display:flex;align-items:flex-end;justify-content:center}'
    + '.avck-modal[hidden]{display:none}'
    + '.avck-scrim{position:absolute;inset:0;background:rgba(20,16,12,.55);backdrop-filter:blur(2px)}'
    + '.avck-sheet{position:relative;width:100%;max-width:440px;max-height:86vh;overflow-y:auto;background:#FFFDF8;border-radius:24px 24px 0 0;padding:20px 18px calc(20px + env(safe-area-inset-bottom,0px));'
    + 'transform:translateY(30px);opacity:0;transition:transform .4s cubic-bezier(.22,1,.36,1),opacity .3s}'
    + '.avck-modal.avck-show .avck-sheet{transform:none;opacity:1}'
    + '.avck-shead{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}'
    + '.avck-shead h2{font-size:19px;margin:0;color:#1c1a12;font-family:"Playfair Display",Georgia,serif}'
    + '.avck-x{border:0;background:#F3EDE0;width:34px;height:34px;border-radius:50%;cursor:pointer;font-size:15px;color:#1c1a12}'
    + '.avck-sdesc{font-size:12.5px;line-height:1.6;color:#6b6257;margin:0 0 14px}'
    + '.avck-cat{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:13px 4px;border-top:1px solid #F0E8D8}'
    + '.avck-cat:last-of-type{border-bottom:1px solid #F0E8D8}'
    + '.avck-cat b{font-size:13.5px;color:#1c1a12;display:block;margin-bottom:3px}'
    + '.avck-cat p{font-size:12px;line-height:1.55;color:#8a8072;margin:0}'
    + '.avck-lock{flex:0 0 auto;font-size:11px;font-weight:700;color:#8a7a4a;background:#F7F0DF;border-radius:999px;padding:6px 12px;white-space:nowrap}'
    + '.avck-toggle{flex:0 0 auto;position:relative;width:48px;height:28px;border-radius:999px;border:0;cursor:pointer;background:#D8D0BE;transition:background .2s;padding:0}'
    + '.avck-toggle span{position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.25);transition:left .2s}'
    + '.avck-toggle[aria-checked="true"]{background:#161616}'
    + '.avck-toggle[aria-checked="true"] span{left:23px}'
    + '.avck-sactions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:16px}'
    + '.avck-sactions .avck-btn{padding:14px 10px;font-size:13.5px}'
    + '.avck-note{font-size:11px;color:#a89c86;text-align:center;margin:12px 0 0;line-height:1.5}'
    + '.avck-footerlink{background:none;border:0;padding:0;display:block;font-size:13px;color:#B5ADB2;line-height:2;cursor:pointer;text-align:left;font-family:inherit}'
    + '.avck-footerlink:hover{color:#EFD281}'
    + '@media(min-width:480px){.avck-modal{align-items:center;padding:20px}.avck-sheet{border-radius:24px}}';

  function injectCSS() {
    if (document.getElementById('avck-style')) return;
    var s = document.createElement('style');
    s.id = 'avck-style';
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  /* ---------------- State ---------------- */
  function read() {
    try {
      var s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.v === CONSENT_VERSION && s.cats) return s;
    } catch (e) {}
    return null;
  }
  function has(cat) {
    if (cat === 'necessary') return true;
    var s = read();
    return !!(s && s.cats && s.cats[cat]);
  }
  function decided() { return !!read(); }

  var pendingScripts = [];
  function flushPending() {
    pendingScripts = pendingScripts.filter(function (p) {
      if (has(p.cat)) { insertScript(p.src, p.attrs); return false; }
      return true;
    });
  }
  function insertScript(src, attrs) {
    var s = document.createElement('script');
    s.src = src;
    s.async = true;
    if (attrs) for (var k in attrs) s.setAttribute(k, attrs[k]);
    document.head.appendChild(s);
  }

  function save(cats) {
    var state = {
      v: CONSENT_VERSION,
      ts: Date.now(),
      cats: {
        necessary: true,
        preferences: !!cats.preferences,
        analytics: !!cats.analytics,
        marketing: !!cats.marketing
      }
    };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
    flushPending();
    try { document.dispatchEvent(new CustomEvent('aavira:consent', { detail: state })); } catch (e) {}
    return state;
  }

  /* ---------------- DOM ---------------- */
  function el(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d.firstChild;
  }

  function buildBanner() {
    if (document.getElementById('avCkBanner')) return;
    var b = el(
      '<div id="avCkBanner" class="avck-banner" role="dialog" aria-label="Cookie consent" hidden>'
      + '<div class="avck-binner">'
      + '<div class="avck-bicon">🍪</div>'
      + '<div class="avck-btext"><b>We value your privacy</b>'
      + '<p>We use cookies to improve your shopping experience, analyse traffic and personalise offers. Accept all, or customise your choices.</p>'
      + '<div class="avck-bactions">'
      + '<button type="button" class="avck-btn avck-primary" data-avck="accept">Accept all</button>'
      + '<button type="button" class="avck-btn avck-ghost" data-avck="reject">Reject</button>'
      + '<button type="button" class="avck-link" data-avck="custom">Customise</button>'
      + '</div></div></div></div>'
    );
    document.body.appendChild(b);
  }

  function buildModal() {
    if (document.getElementById('avCkModal')) return;
    var rows = CATS.map(function (c) {
      if (c.locked) {
        return '<div class="avck-cat"><div><b>' + c.name + '</b><p>' + c.desc + '</p></div>'
          + '<span class="avck-lock">Always on</span></div>';
      }
      return '<div class="avck-cat"><div><b>' + c.name + '</b><p>' + c.desc + '</p></div>'
        + '<button type="button" class="avck-toggle" role="switch" aria-checked="false" data-cat="' + c.id + '" aria-label="' + c.name + ' cookies"><span></span></button></div>';
    }).join('');
    var m = el(
      '<div id="avCkModal" class="avck-modal" hidden>'
      + '<div class="avck-scrim" data-avck="close"></div>'
      + '<div class="avck-sheet" role="dialog" aria-modal="true" aria-label="Cookie preferences">'
      + '<div class="avck-shead"><h2>Cookie preferences</h2>'
      + '<button type="button" class="avck-x" data-avck="close" aria-label="Close">✕</button></div>'
      + '<p class="avck-sdesc">Choose which cookies Aavira Fashion may use. Your choice is stored only on this device and you can change it anytime from the footer.</p>'
      + '<div class="avck-cats">' + rows + '</div>'
      + '<div class="avck-sactions">'
      + '<button type="button" class="avck-btn avck-primary" data-avck="save">Save preferences</button>'
      + '<button type="button" class="avck-btn avck-ghost" data-avck="accept">Accept all</button>'
      + '</div>'
      + '<p class="avck-note">Read our Privacy Policy to learn how we handle your data.</p>'
      + '</div></div>'
    );
    document.body.appendChild(m);
  }

  function showBanner() {
    var b = document.getElementById('avCkBanner');
    if (!b) return;
    b.hidden = false;
    requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add('avck-show'); }); });
  }
  function hideBanner() {
    var b = document.getElementById('avCkBanner');
    if (!b) return;
    b.classList.remove('avck-show');
    setTimeout(function () { b.hidden = true; }, 400);
  }

  function syncToggles() {
    var s = read();
    document.querySelectorAll('#avCkModal .avck-toggle').forEach(function (t) {
      var on = !!(s && s.cats && s.cats[t.dataset.cat]);
      t.setAttribute('aria-checked', on ? 'true' : 'false');
    });
  }
  function openPrefs() {
    buildModal();
    syncToggles();
    var m = document.getElementById('avCkModal');
    m.hidden = false;
    requestAnimationFrame(function () { m.classList.add('avck-show'); });
    if (document.body) document.body.style.overflow = 'hidden';
  }
  function closePrefs() {
    var m = document.getElementById('avCkModal');
    if (!m) return;
    m.classList.remove('avck-show');
    setTimeout(function () { m.hidden = true; }, 350);
    if (document.body) document.body.style.overflow = '';
  }

  function acceptAll() {
    save({ preferences: true, analytics: true, marketing: true });
    hideBanner(); closePrefs();
  }
  function rejectAll() {
    save({ preferences: false, analytics: false, marketing: false });
    hideBanner(); closePrefs();
  }
  function savePrefs() {
    var cats = {};
    document.querySelectorAll('#avCkModal .avck-toggle').forEach(function (t) {
      cats[t.dataset.cat] = t.getAttribute('aria-checked') === 'true';
    });
    save(cats);
    hideBanner(); closePrefs();
  }

  /* ---------------- Events ---------------- */
  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-avck]');
    if (t) {
      var a = t.dataset.avck;
      if (a === 'accept') acceptAll();
      else if (a === 'reject') rejectAll();
      else if (a === 'save') savePrefs();
      else if (a === 'custom') { hideBanner(); openPrefs(); }
      else if (a === 'close') closePrefs();
      return;
    }
    var tg = e.target.closest('.avck-toggle');
    if (tg) {
      var on = tg.getAttribute('aria-checked') === 'true';
      tg.setAttribute('aria-checked', on ? 'false' : 'true');
      try { if (navigator.vibrate) navigator.vibrate(15); } catch (err) {}
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePrefs();
  });

  /* ---------------- Public API ---------------- */
  window.AaviraConsent = {
    has: has,
    decided: decided,
    get: read,
    acceptAll: acceptAll,
    rejectAll: rejectAll,
    openPrefs: openPrefs,
    closePrefs: closePrefs,
    savePrefs: savePrefs,
    loadScript: function (src, cat, attrs) {
      cat = cat || 'analytics';
      if (has(cat)) insertScript(src, attrs);
      else pendingScripts.push({ src: src, cat: cat, attrs: attrs });
    },
    onChange: function (fn) {
      document.addEventListener('aavira:consent', function (e) { fn(e.detail); });
    }
  };

  /* ---------------- Init ---------------- */
  function init() {
    injectCSS();
    buildBanner();
    if (!decided()) {
      setTimeout(showBanner, 900);
    } else {
      flushPending();
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
