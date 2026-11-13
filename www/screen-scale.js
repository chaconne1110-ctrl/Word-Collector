// Screen-size scaling: the app is designed at about 390 CSS px wide. Smaller
// phones render slightly smaller and larger phones/tablets slightly larger,
// so text and buttons keep the same proportion on every device.
//
// It works by setting the viewport width (the browser then scales the whole
// page uniformly), which keeps vh/dvh layouts such as the flashcard deck and
// the fixed bottom navigation exact. Loaded synchronously right after the
// <meta name="viewport"> tag, before the first layout.
//
// Android: needs WebSettings.setUseWideViewPort(true) (MainActivity), otherwise
// the WebView ignores the width and the page simply stays at scale 1.
(function () {
  var meta = document.querySelector('meta[name="viewport"]');
  if (!meta || !window.screen) return;
  var BASE_WIDTH = 390;  // design width
  var MIN_SCALE = 0.94;  // small phones (360 px) -> about 94 %
  var MAX_SCALE = 1.2;   // tablets -> at most 120 %
  var userScalable = /user-scalable=no/.test(meta.getAttribute('content') || '');

  function apply() {
    var shortSide = Math.min(screen.width, screen.height);
    var longSide = Math.max(screen.width, screen.height);
    if (!shortSide || shortSide < 200) return; // unknown screen: keep default
    var landscape = window.matchMedia && window.matchMedia('(orientation: landscape)').matches;
    var device = landscape ? longSide : shortSide;
    // The scale follows the phone's short side so rotating does not resize text.
    var scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, shortSide / BASE_WIDTH));
    var width = Math.round(device / scale);
    var initial = (device / width).toFixed(4);
    meta.setAttribute('content', 'width=' + width + ', initial-scale=' + initial +
      (userScalable ? ', maximum-scale=' + initial + ', user-scalable=no' : '') + ', viewport-fit=cover');
    document.documentElement.style.setProperty('--wc-screen-scale', initial);
  }

  apply();
  window.addEventListener('orientationchange', function () { setTimeout(apply, 60); });
})();
