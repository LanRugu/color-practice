(function (global) {
  var utils = global.ColorPractice.utils;
  var hexToHsl = utils.hexToHsl;
  var hslToHex = utils.hslToHex;
  var generateScheme = utils.generateScheme;
  var SCHEME_INFO = utils.SCHEME_INFO;

  var currentScheme = 'complementary';

  function initHarmony(store) {
    var baseInput = document.getElementById('base-color');
    var baseHex = document.getElementById('base-hex');
    var baseHsl = document.getElementById('base-hsl');
    var satSlider = document.getElementById('sat-slider');
    var lightSlider = document.getElementById('light-slider');
    var satOut = document.getElementById('sat-out');
    var lightOut = document.getElementById('light-out');
    var canvas = document.getElementById('color-wheel');
    var schemeDesc = document.getElementById('scheme-desc');
    var palette = document.getElementById('palette');
    var paletteCodes = document.getElementById('palette-codes');

    if (store.data && store.data.preferences && store.data.preferences.lastBaseColor) {
      baseInput.value = store.data.preferences.lastBaseColor;
    }
    if (store.data && store.data.preferences && store.data.preferences.lastScheme) {
      currentScheme = store.data.preferences.lastScheme;
      document.querySelectorAll('.scheme-btn').forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.scheme === currentScheme);
      });
    }

    var wheelBase = null;
    var lastDrawnHue = null;
    var prefSaveTimer = null;
    var wheelResizeTimer = null;
    var wheelWrap = canvas.parentElement;

    function sizeWheelCanvas() {
      if (!wheelWrap) return;
      var size = Math.floor(wheelWrap.clientWidth);
      if (size < 1) size = 200;
      if (canvas.width !== size || canvas.height !== size) {
        canvas.width = size;
        canvas.height = size;
        wheelBase = null;
        lastDrawnHue = null;
      }
    }

    function debouncedSavePrefs(prefs) {
      clearTimeout(prefSaveTimer);
      prefSaveTimer = setTimeout(function () {
        store.updatePreferences(prefs);
      }, 400);
    }

    function getBaseHex() {
      return baseInput.value;
    }

    function syncFromHex(hex) {
      var hsl = hexToHsl(hex);
      var h = hsl.h, s = hsl.s, l = hsl.l;
      satSlider.value = Math.round(s);
      lightSlider.value = Math.round(l);
      satOut.textContent = Math.round(s);
      lightOut.textContent = Math.round(l);
      baseHex.textContent = hex.toUpperCase();
      baseHsl.textContent = 'HSL(' + Math.round(h) + ', ' + Math.round(s) + '%, ' + Math.round(l) + '%)';
      renderPalette();
      var roundedHue = Math.round(h);
      if (lastDrawnHue !== roundedHue) {
        lastDrawnHue = roundedHue;
        drawWheel(h);
      }
      debouncedSavePrefs({ lastBaseColor: hex, lastScheme: currentScheme });
    }

    function setBaseFromHsl(h, s, l) {
      var hex = hslToHex(h, s, l);
      baseInput.value = hex;
      syncFromHex(hex);
    }

    function renderPalette() {
      var hex = getBaseHex();
      var colors = generateScheme(hex, currentScheme);
      var info = SCHEME_INFO[currentScheme];
      schemeDesc.textContent = info.desc;

      palette.innerHTML = colors.map(function (c, i) {
        var label = i === 0 ? '主色' : '色 ' + (i + 1);
        return '<div class="swatch" style="background:' + c + '" title="' + c + '" data-hex="' + c + '">' +
          '<span class="swatch-label">' + label + '</span></div>';
      }).join('');

      paletteCodes.innerHTML = colors.map(function (c) {
        return '<span class="code-chip" data-hex="' + c + '" title="点击复制">' + c + '</span>';
      }).join('');

      paletteCodes.querySelectorAll('.code-chip').forEach(function (chip) {
        chip.addEventListener('click', function () {
          if (navigator.clipboard) navigator.clipboard.writeText(chip.dataset.hex);
          chip.textContent = '已复制!';
          setTimeout(function () { chip.textContent = chip.dataset.hex; }, 800);
        });
      });
    }

    function buildWheelBase() {
      sizeWheelCanvas();
      var off = document.createElement('canvas');
      off.width = canvas.width;
      off.height = canvas.height;
      var ctx = off.getContext('2d');
      var cx = off.width / 2;
      var cy = off.height / 2;
      var outerR = cx - 8;
      var innerR = outerR * 0.55;

      for (var angle = 0; angle < 360; angle++) {
        var start = (angle - 1) * Math.PI / 180;
        var end = (angle + 1) * Math.PI / 180;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, outerR, start, end);
        ctx.closePath();
        ctx.fillStyle = 'hsl(' + angle + ', 100%, 50%)';
        ctx.fill();
      }

      ctx.beginPath();
      ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
      ctx.fillStyle = '#1a2332';
      ctx.fill();

      return off;
    }

    function drawWheel(selectedHue) {
      if (selectedHue === undefined) selectedHue = 217;
      sizeWheelCanvas();
      if (!wheelBase) wheelBase = buildWheelBase();

      var ctx = canvas.getContext('2d');
      var cx = canvas.width / 2;
      var cy = canvas.height / 2;
      var outerR = cx - 8;
      var innerR = outerR * 0.55;
      var markerR = Math.max(5, canvas.width * 0.028);

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(wheelBase, 0, 0);

      var markerAngle = selectedHue * Math.PI / 180;
      var mx = cx + Math.cos(markerAngle) * (outerR + innerR) / 2;
      var my = cy + Math.sin(markerAngle) * (outerR + innerR) / 2;
      ctx.beginPath();
      ctx.arc(mx, my, markerR, 0, Math.PI * 2);
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    }

    function getWheelRadii() {
      var outerR = canvas.width / 2 - 8;
      return { outerR: outerR, innerR: outerR * 0.55 };
    }

    function getHueFromPointer(clientX, clientY, requireRing) {
      var rect = canvas.getBoundingClientRect();
      var scaleX = canvas.width / rect.width;
      var scaleY = canvas.height / rect.height;
      var x = (clientX - rect.left) * scaleX - canvas.width / 2;
      var y = (clientY - rect.top) * scaleY - canvas.height / 2;
      var dist = Math.sqrt(x * x + y * y);
      var radii = getWheelRadii();
      if (requireRing && (dist < radii.innerR || dist > radii.outerR)) return null;

      var angle = Math.atan2(y, x) * 180 / Math.PI;
      if (angle < 0) angle += 360;
      return angle;
    }

    function updateHueLive(h) {
      var s = parseInt(satSlider.value, 10);
      var l = parseInt(lightSlider.value, 10);
      var hex = hslToHex(h, s, l);
      baseInput.value = hex;
      baseHex.textContent = hex.toUpperCase();
      baseHsl.textContent = 'HSL(' + Math.round(h) + ', ' + s + '%, ' + l + '%)';
      var roundedHue = Math.round(h);
      if (lastDrawnHue !== roundedHue) {
        lastDrawnHue = roundedHue;
        drawWheel(h);
      }
    }

    var wheelDragging = false;

    function endWheelDrag(e) {
      if (!wheelDragging) return;
      wheelDragging = false;
      canvas.classList.remove('dragging');
      if (e && e.pointerId !== undefined) {
        try { canvas.releasePointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      }
      renderPalette();
      debouncedSavePrefs({ lastBaseColor: getBaseHex(), lastScheme: currentScheme });
    }

    canvas.addEventListener('pointerdown', function (e) {
      if (e.button !== 0 && e.pointerType === 'mouse') return;
      var hue = getHueFromPointer(e.clientX, e.clientY, true);
      if (hue === null) return;

      wheelDragging = true;
      canvas.classList.add('dragging');
      canvas.setPointerCapture(e.pointerId);
      updateHueLive(hue);
      e.preventDefault();
    });

    canvas.addEventListener('pointermove', function (e) {
      if (!wheelDragging) return;
      var hue = getHueFromPointer(e.clientX, e.clientY, false);
      if (hue !== null) updateHueLive(hue);
      e.preventDefault();
    });

    canvas.addEventListener('pointerup', endWheelDrag);
    canvas.addEventListener('pointercancel', endWheelDrag);

    window.addEventListener('resize', function () {
      clearTimeout(wheelResizeTimer);
      wheelResizeTimer = setTimeout(function () {
        wheelBase = null;
        lastDrawnHue = null;
        var hsl = hexToHsl(getBaseHex());
        drawWheel(hsl.h);
      }, 150);
    });

    baseInput.addEventListener('input', function () { syncFromHex(baseInput.value); });
    satSlider.addEventListener('input', function () {
      satOut.textContent = satSlider.value;
      var hsl = hexToHsl(getBaseHex());
      setBaseFromHsl(hsl.h, parseInt(satSlider.value, 10), hsl.l);
    });
    lightSlider.addEventListener('input', function () {
      lightOut.textContent = lightSlider.value;
      var hsl = hexToHsl(getBaseHex());
      setBaseFromHsl(hsl.h, hsl.s, parseInt(lightSlider.value, 10));
    });

    document.querySelectorAll('.scheme-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.scheme-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentScheme = btn.dataset.scheme;
        renderPalette();
        debouncedSavePrefs({ lastScheme: currentScheme, lastBaseColor: getBaseHex() });
      });
    });

    syncFromHex(getBaseHex());

    return {
      getBaseHex: getBaseHex,
      setScheme: function (key) { currentScheme = key; renderPalette(); },
    };
  }

  global.ColorPractice = global.ColorPractice || {};
  global.ColorPractice.initHarmony = initHarmony;
})(window);
