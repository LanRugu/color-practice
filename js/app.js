(function (global) {
  var createStorage = global.ColorPractice.storage.createStorage;
  var ProgressStore = global.ColorPractice.storage.ProgressStore;
  var initHarmony = global.ColorPractice.initHarmony;
  var initQuiz = global.ColorPractice.initQuiz;
  var contrastRatio = global.ColorPractice.utils.contrastRatio;

  function initTabs() {
    document.querySelectorAll('.nav-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.nav-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        document.querySelectorAll('.tab-panel').forEach(function (p) { p.classList.remove('active'); });
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
      });
    });
  }

  function initContrast() {
    var fgInput = document.getElementById('fg-color');
    var bgInput = document.getElementById('bg-color');
    var fgHex = document.getElementById('fg-hex');
    var bgHex = document.getElementById('bg-hex');
    var preview = document.getElementById('contrast-preview');
    var results = document.getElementById('contrast-results');

    function update() {
      var fg = fgInput.value;
      var bg = bgInput.value;
      fgHex.textContent = fg.toUpperCase();
      bgHex.textContent = bg.toUpperCase();
      preview.style.background = bg;
      preview.style.color = fg;

      var ratio = contrastRatio(fg, bg);
      var checks = [
        { label: 'WCAG AA 正文（≥ 4.5:1）', threshold: 4.5 },
        { label: 'WCAG AA 大文字（≥ 3:1）', threshold: 3 },
        { label: 'WCAG AAA 正文（≥ 7:1）', threshold: 7 },
      ];

      results.innerHTML =
        '<div class="contrast-row"><span>对比度比值</span><strong>' + ratio.toFixed(2) + ' : 1</strong></div>' +
        checks.map(function (c) {
          return '<div class="contrast-row"><span>' + c.label + '</span>' +
            '<span class="' + (ratio >= c.threshold ? 'pass' : 'fail') + '">' +
            (ratio >= c.threshold ? '通过' : '未通过') + '</span></div>';
        }).join('');
    }

    fgInput.addEventListener('input', update);
    bgInput.addEventListener('input', update);
    update();
  }

  function renderProgress(store) {
    var statsEl = document.getElementById('progress-stats');
    var historyEl = document.getElementById('progress-history');
    var d = store.data;

    statsEl.innerHTML =
      '<div class="stat-box"><div class="stat-value">' + d.score + '</div><div class="stat-label">总得分</div></div>' +
      '<div class="stat-box"><div class="stat-value">' + d.totalCorrect + '</div><div class="stat-label">答对题数</div></div>' +
      '<div class="stat-box"><div class="stat-value">' + d.totalAnswered + '</div><div class="stat-label">总答题数</div></div>' +
      '<div class="stat-box"><div class="stat-value">' + (d.totalAnswered ? Math.round(d.totalCorrect / d.totalAnswered * 100) : 0) + '%</div><div class="stat-label">正确率</div></div>' +
      '<div class="stat-box"><div class="stat-value">' + d.streak + '</div><div class="stat-label">当前连对</div></div>';

    var typeLabels = { identify: '识别类型', pick: '选和谐色', 'contrast-guess': '对比度' };

    if (d.history.length === 0) {
      historyEl.innerHTML = '<p class="hint">还没有练习记录，去「互动练习」试试吧。</p>';
    } else {
      historyEl.innerHTML =
        '<h3>最近记录</h3><ul class="history-list">' +
        d.history.slice(0, 30).map(function (h) {
          var time = new Date(h.time).toLocaleString('zh-CN');
          return '<li><span>' + time + ' · ' + (typeLabels[h.quizType] || h.quizType) + '</span>' +
            '<span class="' + (h.correct ? 'result-correct' : 'result-wrong') + '">' +
            (h.correct ? '正确' : '错误') + '</span></li>';
        }).join('') + '</ul>';
    }
  }

  function initProgress(store, quiz) {
    document.querySelector('[data-tab="progress"]').addEventListener('click', function () {
      renderProgress(store);
    });
    renderProgress(store);
  }

  function main() {
    var storage = createStorage(false);
    var store = new ProgressStore(storage);

    store.init().then(function () {
      document.getElementById('storage-mode').textContent =
        '存储：' + (store.mode === 'localStorage' ? 'localStorage（本地）' : 'API（云端）');

      initTabs();
      initHarmony(store);
      var quiz = initQuiz(store);
      initContrast();
      initProgress(store, quiz);

      document.getElementById('clear-progress').addEventListener('click', function () {
        if (confirm('确定清空所有本地学习进度？此操作不可恢复。')) {
          store.clearAll().then(function () {
            quiz.refreshStats();
            renderProgress(store);
          });
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', main);
  } else {
    main();
  }
})(window);
