(function (global) {
  var utils = global.ColorPractice.utils;
  var generateScheme = utils.generateScheme;
  var SCHEME_INFO = utils.SCHEME_INFO;
  var randomHex = utils.randomHex;
  var randomSchemeType = utils.randomSchemeType;
  var shuffle = utils.shuffle;
  var contrastRatio = utils.contrastRatio;
  var hexToHsl = utils.hexToHsl;
  var hslToHex = utils.hslToHex;

  var SCHEME_NAMES = {};
  Object.keys(SCHEME_INFO).forEach(function (k) {
    SCHEME_NAMES[k] = SCHEME_INFO[k].name;
  });

  function initQuiz(store) {
    var content = document.getElementById('quiz-content');
    var feedback = document.getElementById('quiz-feedback');
    var nextBtn = document.getElementById('quiz-next');
    var scoreEl = document.getElementById('quiz-score');
    var streakEl = document.getElementById('quiz-streak');
    var titleEl = document.getElementById('quiz-title');

    var quizType = 'identify';
    var currentQuestion = null;
    var answered = false;

    var titles = {
      identify: '识别配色类型',
      pick: '选出和谐色',
      'contrast-guess': '对比度判断',
    };

    function updateStats() {
      scoreEl.textContent = (store.data && store.data.score) || 0;
      streakEl.textContent = (store.data && store.data.streak) || 0;
    }

    function showFeedback(correct, message) {
      feedback.classList.remove('hidden', 'success', 'error');
      feedback.classList.add(correct ? 'success' : 'error');
      feedback.textContent = message;
      nextBtn.classList.remove('hidden');
    }

    function buildIdentifyQuestion() {
      var schemeKey = randomSchemeType();
      var base = randomHex();
      var colors = generateScheme(base, schemeKey);
      var wrongKeys = shuffle(Object.keys(SCHEME_INFO).filter(function (k) { return k !== schemeKey; })).slice(0, 3);
      var options = shuffle([schemeKey].concat(wrongKeys));
      return { type: 'identify', data: { colors: colors, schemeKey: schemeKey, options: options } };
    }

    function buildPickQuestion() {
      var schemeKey = randomSchemeType();
      if (schemeKey === 'monochromatic') return buildPickQuestion();

      var base = randomHex();
      var correctColors = generateScheme(base, schemeKey);
      var correct = correctColors[1] || correctColors[0];
      var hsl = hexToHsl(base);
      var distractors = [
        hslToHex((hsl.h + 60) % 360, hsl.s, hsl.l),
        hslToHex((hsl.h + 200) % 360, hsl.s, hsl.l),
        hslToHex(hsl.h, Math.max(10, hsl.s - 40), hsl.l),
      ].filter(function (c) { return c !== correct; });
      var options = shuffle([correct].concat(distractors.slice(0, 3)));
      return { type: 'pick', data: { base: base, schemeKey: schemeKey, correct: correct, options: options } };
    }

    function buildContrastQuestion() {
      var wantPass = Math.random() < 0.5;
      var fg, bg, ratio, passAA;
      var attempts = 0;

      do {
        fg = randomHex();
        bg = randomHex();
        ratio = contrastRatio(fg, bg);
        passAA = ratio >= 4.5;
        attempts++;
      } while (
        attempts < 50 &&
        ((wantPass && !passAA) || (!wantPass && passAA) || ratio < 1.8 || ratio > 14)
      );

      if (attempts >= 50) {
        fg = wantPass ? '#ffffff' : '#94a3b8';
        bg = wantPass ? '#1e293b' : '#64748b';
        ratio = contrastRatio(fg, bg);
        passAA = ratio >= 4.5;
      }

      return {
        type: 'contrast-guess',
        data: {
          fg: fg,
          bg: bg,
          ratio: ratio,
          passAA: passAA,
          options: shuffle([
            { label: '通过 AA（≥ 4.5:1）', value: true },
            { label: '未通过 AA（< 4.5:1）', value: false },
          ]),
        },
      };
    }

    function renderQuestion() {
      answered = false;
      feedback.classList.add('hidden');
      nextBtn.classList.add('hidden');
      titleEl.textContent = titles[quizType];

      if (quizType === 'identify') {
        currentQuestion = buildIdentifyQuestion();
        var colors = currentQuestion.data.colors;
        var options = currentQuestion.data.options;
        content.innerHTML =
          '<p>这组颜色属于哪种配色方案？</p>' +
          '<div class="quiz-palette">' + colors.map(function (c) {
            return '<div class="swatch" style="background:' + c + '"></div>';
          }).join('') + '</div>' +
          '<div class="quiz-options">' + options.map(function (key) {
            return '<button class="quiz-option" data-answer="' + key + '">' + SCHEME_NAMES[key] + '</button>';
          }).join('') + '</div>';
      } else if (quizType === 'pick') {
        currentQuestion = buildPickQuestion();
        var base = currentQuestion.data.base;
        var schemeKey = currentQuestion.data.schemeKey;
        var pickOptions = currentQuestion.data.options;
        content.innerHTML =
          '<p>主色如下，哪种是 <strong>' + SCHEME_NAMES[schemeKey] + '</strong> 中的和谐色？</p>' +
          '<div class="quiz-palette"><div class="swatch" style="background:' + base + '"></div></div>' +
          '<div class="color-options">' + pickOptions.map(function (c) {
            return '<button class="color-option" style="background:' + c + '" data-answer="' + c + '" aria-label="' + c + '"></button>';
          }).join('') + '</div>';
      } else {
        currentQuestion = buildContrastQuestion();
        var fg = currentQuestion.data.fg;
        var bg = currentQuestion.data.bg;
        var contrastOptions = currentQuestion.data.options;
        content.innerHTML =
          '<p>以下文字与背景的组合，是否满足 WCAG AA 正文对比度（≥ 4.5:1）？</p>' +
          '<div class="contrast-preview" style="background:' + bg + '; color:' + fg + '">' +
          '<p class="preview-text">可读性测试 Aa</p></div>' +
          '<div class="quiz-options">' + contrastOptions.map(function (opt) {
            return '<button class="quiz-option" data-answer="' + opt.value + '">' + opt.label + '</button>';
          }).join('') + '</div>';
      }

      bindAnswerHandlers();
    }

    function bindAnswerHandlers() {
      content.querySelectorAll('[data-answer]').forEach(function (btn) {
        btn.addEventListener('click', function () { handleAnswer(btn); });
      });
    }

    function handleAnswer(btn) {
      if (answered) return;
      answered = true;

      var buttons = content.querySelectorAll('[data-answer]');
      buttons.forEach(function (b) { b.disabled = true; });

      var correct = false;
      var detail = '';

      if (quizType === 'identify') {
        var answer = btn.dataset.answer;
        correct = answer === currentQuestion.data.schemeKey;
        detail = SCHEME_NAMES[currentQuestion.data.schemeKey];
        buttons.forEach(function (b) {
          if (b.dataset.answer === currentQuestion.data.schemeKey) b.classList.add('correct');
          else if (b === btn && !correct) b.classList.add('wrong');
        });
        showFeedback(correct, correct ? '正确！这是' + detail + '配色。' : '不对，正确答案是「' + detail + '」。');
      } else if (quizType === 'pick') {
        answer = btn.dataset.answer;
        correct = answer === currentQuestion.data.correct;
        detail = currentQuestion.data.correct;
        buttons.forEach(function (b) {
          if (b.dataset.answer === currentQuestion.data.correct) b.classList.add('correct');
          else if (b === btn && !correct) b.classList.add('wrong');
        });
        showFeedback(correct, correct ? '正确！' : '不对，和谐色是 ' + currentQuestion.data.correct + '。');
      } else {
        var boolAnswer = btn.dataset.answer === 'true';
        correct = boolAnswer === currentQuestion.data.passAA;
        detail = currentQuestion.data.ratio.toFixed(2) + ':1';
        buttons.forEach(function (b) {
          var val = b.dataset.answer === 'true';
          if (val === currentQuestion.data.passAA) b.classList.add('correct');
          else if (b === btn && !correct) b.classList.add('wrong');
        });
        showFeedback(correct,
          correct
            ? '正确！实际对比度 ' + detail + '。'
            : '不对。实际对比度 ' + detail + '，' + (currentQuestion.data.passAA ? '已通过' : '未通过') + ' AA。');
      }

      store.recordAnswer({ quizType: quizType, correct: correct, detail: detail }).then(updateStats);
    }

    document.querySelectorAll('.quiz-type-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.quiz-type-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        quizType = btn.dataset.quiz;
        renderQuestion();
      });
    });

    nextBtn.addEventListener('click', renderQuestion);
    updateStats();
    renderQuestion();

    return { refreshStats: updateStats };
  }

  global.ColorPractice = global.ColorPractice || {};
  global.ColorPractice.initQuiz = initQuiz;
})(window);
