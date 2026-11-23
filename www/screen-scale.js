// Screen-size scaling: the app is designed at about 390 CSS px wide. Smaller
// phones render slightly smaller, larger phones slightly larger, and tablets
// and laptops clearly larger, so text and buttons stay easy to read everywhere.
//
// Phones and tablets: it sets the viewport width (the browser then scales the
// whole page uniformly), which keeps vh/dvh layouts such as the flashcard deck
// and the fixed bottom navigation exact. Loaded synchronously right after the
// <meta name="viewport"> tag, before the first layout.
//
// Laptop/PC browsers ignore the viewport width, so there the page uses CSS zoom
// instead. Zoom also enlarges vh/vw lengths (100vh would become taller than the
// window), so every vh/vw value in the page's styles is divided by the zoom.
//
// Android: needs WebSettings.setUseWideViewPort(true) (MainActivity), otherwise
// the WebView ignores the width and the page simply stays at scale 1.
(function () {
  var meta = document.querySelector('meta[name="viewport"]');
  if (!meta || !window.screen) return;
  var BASE_WIDTH = 390;    // design width
  var MIN_SCALE = 0.94;    // small phones (360 px) -> about 94 %
  var MAX_SCALE = 1.2;     // large phones -> at most 120 %
  var TABLET_SIDE = 600;   // a short side of 600 CSS px or more is a tablet
  var TABLET_SCALE = 1.4;  // tablets -> 140 %
  var DESKTOP_ZOOM = 1.3;  // laptop/PC browser windows -> 130 %
  var userScalable = /user-scalable=no/.test(meta.getAttribute('content') || '');
  var root = document.documentElement;
  var ua = navigator.userAgent || '';
  // iPadOS reports a Mac user agent, but it has a touch screen.
  var desktop = !/Android|iPhone|iPad|iPod|Mobi/i.test(ua) &&
    !(/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

  function apply() {
    var shortSide = Math.min(screen.width, screen.height);
    var longSide = Math.max(screen.width, screen.height);
    if (!shortSide || shortSide < 200) return; // unknown screen: keep default
    var landscape = window.matchMedia && window.matchMedia('(orientation: landscape)').matches;
    var device = landscape ? longSide : shortSide;
    // The scale follows the device's short side so rotating does not resize text.
    var scale = shortSide >= TABLET_SIDE ? TABLET_SCALE :
      Math.min(MAX_SCALE, Math.max(MIN_SCALE, shortSide / BASE_WIDTH));
    var width = Math.round(device / scale);
    var initial = (device / width).toFixed(4);
    meta.setAttribute('content', 'width=' + width + ', initial-scale=' + initial +
      (userScalable ? ', maximum-scale=' + initial + ', user-scalable=no' : '') + ', viewport-fit=cover');
    root.style.setProperty('--wc-screen-scale', initial);
  }

  // ---- Laptop/PC browsers: CSS zoom ----
  var UNIT = /(-?\d*\.?\d+)(dvh|svh|lvh|vh|dvw|svw|lvw|vw|vmin|vmax)\b/g;
  function divideViewportUnits(rules) {
    for (var i = 0; i < rules.length; i++) {
      var rule = rules[i], style = rule.style;
      if (style) {
        for (var j = 0; j < style.length; j++) {
          var name = style[j], value = style.getPropertyValue(name);
          if (value && value.indexOf('--wc-zoom') < 0 && value.search(UNIT) >= 0) {
            style.setProperty(name, value.replace(UNIT, 'calc($1$2 / var(--wc-zoom, 1))'), style.getPropertyPriority(name));
          }
        }
      }
      if (rule.cssRules) divideViewportUnits(rule.cssRules);
    }
  }
  function desktopZoom() {
    // A small window (or a phone-sized one) keeps the normal size.
    return window.innerWidth >= 768 && window.innerHeight >= 500 ? DESKTOP_ZOOM : 1;
  }
  function setZoom() {
    var zoom = desktopZoom();
    root.style.setProperty('--wc-zoom', String(zoom));
    root.style.zoom = zoom === 1 ? '' : String(zoom);
    root.style.setProperty('--wc-screen-scale', String(zoom));
  }
  function startDesktopZoom() {
    for (var i = 0; i < document.styleSheets.length; i++) {
      try { divideViewportUnits(document.styleSheets[i].cssRules); } catch (error) { /* not readable */ }
    }
    setZoom();
    window.addEventListener('resize', setZoom);
  }

  if (desktop) {
    // The page's stylesheets are all in <head>, so they are ready here.
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', startDesktopZoom);
    else startDesktopZoom();
    return;
  }
  apply();
  window.addEventListener('orientationchange', function () { setTimeout(apply, 60); });
})();
