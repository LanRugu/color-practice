(function (global) {
  var presets = global.ColorPractice.presets.PRESETS;
  var getSchemeName = global.ColorPractice.utils.getSchemeName;

  function copyColors(colors) {
    var text = colors.join('  ');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return Promise.reject(new Error('clipboard unavailable'));
  }

  function renderSwatches(colors) {
    return colors.map(function (c) {
      return '<span class="gallery-swatch" style="background:' + c + '" title="' + c + '"></span>';
    }).join('');
  }

  function renderTags(tags) {
    if (!tags || !tags.length) return '';
    return '<div class="gallery-tags">' + tags.map(function (t) {
      return '<span class="gallery-tag">' + t + '</span>';
    }).join('') + '</div>';
  }

  function renderPaletteMeta(item) {
    var base = (item.baseColor || item.colors[0]).toUpperCase();
    var others = item.colors
      .map(function (c) { return c.toUpperCase(); })
      .filter(function (c) { return c !== base; });
    var text = '主色 ' + base;
    if (others.length) text += ' · ' + others.join(' · ');
    return '<p class="gallery-meta">' + text + '</p>';
  }

  function renderCard(item, actionsHtml, opts) {
    opts = opts || {};
    var schemeLabel = item.scheme ? getSchemeName(item.scheme) : '';
    var showSchemeMeta = opts.showSchemeMeta !== false && schemeLabel && !opts.colorMetaOnly;
    var metaHtml = opts.colorMetaOnly
      ? renderPaletteMeta(item)
      : (showSchemeMeta ? '<p class="gallery-meta">主色 ' + item.baseColor + ' · ' + schemeLabel + '</p>' : '');
    return '<article class="gallery-card" data-id="' + item.id + '">' +
      '<div class="gallery-swatches">' + renderSwatches(item.colors) + '</div>' +
      '<h3 class="gallery-name">' + item.name + '</h3>' +
      '<p class="gallery-desc">' + item.desc + '</p>' +
      metaHtml +
      (opts.showTags !== false ? renderTags(item.tags) : '') +
      '<div class="gallery-actions">' + actionsHtml + '</div>' +
      '</article>';
  }

  function initGallery(store, harmony, switchTab) {
    var presetsEl = document.getElementById('gallery-presets');
    var favoritesEl = document.getElementById('gallery-favorites');
    var saveBtn = document.getElementById('save-current-palette');

    function applyItem(item) {
      harmony.applyPalette({
        baseColor: item.baseColor || item.colors[0],
        scheme: item.scheme,
      });
      switchTab('harmony');
    }

    function favoriteFromPreset(preset) {
      store.addFavorite({
        name: preset.name,
        desc: preset.desc,
        colors: preset.colors.slice(),
        baseColor: preset.baseColor,
        scheme: preset.scheme,
        tags: (preset.tags || []).slice(),
        source: 'preset',
      }).then(renderFavorites);
    }

    function bindCardActions(container) {
      container.querySelectorAll('[data-action]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var card = btn.closest('.gallery-card');
          var id = card.dataset.id;
          var action = btn.dataset.action;
          var section = card.closest('[data-section]');
          var sectionType = section ? section.dataset.section : '';

          if (action === 'apply') {
            if (sectionType === 'preset') {
              for (var i = 0; i < presets.length; i++) {
                if (presets[i].id === id) { applyItem(presets[i]); return; }
              }
            } else {
              var favs = store.data.favorites || [];
              for (var j = 0; j < favs.length; j++) {
                if (favs[j].id === id) { applyItem(favs[j]); return; }
              }
            }
          } else if (action === 'copy') {
            var colors = [];
            card.querySelectorAll('.gallery-swatch').forEach(function (sw) {
              colors.push(sw.getAttribute('title'));
            });
            copyColors(colors).then(function () {
              btn.textContent = '已复制';
              setTimeout(function () { btn.textContent = '复制色值'; }, 800);
            });
          } else if (action === 'favorite') {
            for (var k = 0; k < presets.length; k++) {
              if (presets[k].id === id) { favoriteFromPreset(presets[k]); return; }
            }
          } else if (action === 'remove') {
            if (confirm('确定删除这条收藏？')) {
              store.removeFavorite(id).then(renderFavorites);
            }
          }
        });
      });
    }

    function presetActions() {
      return '<button type="button" class="btn btn-sm btn-primary" data-action="apply">应用主色</button>' +
        '<button type="button" class="btn btn-sm" data-action="copy">复制色值</button>' +
        '<button type="button" class="btn btn-sm" data-action="favorite">加入收藏</button>';
    }

    function favoriteActions() {
      return '<button type="button" class="btn btn-sm btn-primary" data-action="apply">应用</button>' +
        '<button type="button" class="btn btn-sm" data-action="copy">复制色值</button>' +
        '<button type="button" class="btn btn-sm btn-danger-text" data-action="remove">删除</button>';
    }

    function renderPresets() {
      presetsEl.innerHTML = presets.map(function (p) {
        return renderCard(p, presetActions(), { showSchemeMeta: false, colorMetaOnly: true });
      }).join('');
      bindCardActions(presetsEl);
    }

    function renderFavorites() {
      var favs = (store.data && store.data.favorites) || [];
      if (favs.length === 0) {
        favoritesEl.innerHTML = '<p class="hint">还没有收藏。在「配色生成」中调好配色后点「收藏当前配色」，或从上方经典预设加入收藏。</p>';
        return;
      }
      favoritesEl.innerHTML = favs.map(function (f) {
        return renderCard(f, favoriteActions());
      }).join('');
      bindCardActions(favoritesEl);
    }

    saveBtn.addEventListener('click', function () {
      var palette = harmony.getCurrentPalette();
      var defaultName = getSchemeName(palette.scheme) + ' · ' + palette.baseColor.toUpperCase();
      var name = prompt('为这条配色起个名字：', defaultName);
      if (!name || !name.trim()) return;

      store.addFavorite({
        name: name.trim(),
        desc: '来自配色生成器',
        colors: palette.colors.slice(),
        baseColor: palette.baseColor,
        scheme: palette.scheme,
        tags: [getSchemeName(palette.scheme)],
        source: 'harmony',
      }).then(function () {
        renderFavorites();
        saveBtn.textContent = '已收藏！';
        setTimeout(function () { saveBtn.textContent = '收藏当前配色'; }, 1000);
      });
    });

    document.querySelector('[data-tab="gallery"]').addEventListener('click', function () {
      renderFavorites();
    });

    renderPresets();
    renderFavorites();

    return { refresh: renderFavorites };
  }

  global.ColorPractice = global.ColorPractice || {};
  global.ColorPractice.initGallery = initGallery;
})(window);
