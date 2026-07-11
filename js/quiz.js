(function (global) {
  var utils = global.ColorPractice.utils;
  var config = global.ColorPractice.config;
  var generateScheme = utils.generateScheme;
  var SCHEME_ORDER = utils.SCHEME_ORDER;
  var getSchemeName = utils.getSchemeName;
  var randomHex = utils.randomHex;
  var randomSchemeType = utils.randomSchemeType;
  var shuffle = utils.shuffle;
  var contrastRatio = utils.contrastRatio;
  var hexToHsl = utils.hexToHsl;
  var hslToHex = utils.hslToHex;
  var QUIZ_TYPES = config.QUIZ_TYPES;
  var getQuizTypeTitle = config.getQuizTypeTitle;
  var getQuizTypeIntro = config.getQuizTypeIntro;

  function schemeColorPair(base, schemeKey) {
    var colors = generateScheme(base, schemeKey);
    return [colors[0], colors[1]];
  }

  function renderQuizTypeTabs(container, activeType, onSelect) {
    container.innerHTML = QUIZ_TYPES.map(function (item) {
      var active = item.id === activeType ? ' active' : '';
      return '<button type="button" class="quiz-type-btn' + active + '" data-quiz="' + item.id + '">' +
        item.label + '</button>';
    }).join('');

    container.querySelectorAll('.quiz-type-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        container.querySelectorAll('.quiz-type-btn').forEach(function (b) {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        onSelect(btn.dataset.quiz);
      });
    });
  }

  function initQuiz(store) {
    var content = document.getElementById('quiz-content');
    var feedback = document.getElementById('quiz-feedback');
    var nextBtn = document.getElementById('quiz-next');
    var skipBtn = document.getElementById('quiz-skip');
    var scoreEl = document.getElementById('quiz-score');
    var streakEl = document.getElementById('quiz-streak');
    var titleEl = document.getElementById('quiz-title');
    var quizTypeTabs = document.getElementById('quiz-type-tabs');

    var quizType = QUIZ_TYPES[0].id;
    var currentQuestion = null;
    var answered = false;

    function updateStats() {
      scoreEl.textContent = (store.data && store.data.score) || 0;
      streakEl.textContent = (store.data && store.data.streak) || 0;
    }

    function showFeedback(correct, message) {
      feedback.classList.remove('hidden', 'success', 'error');
      feedback.classList.add(correct ? 'success' : 'error');
      feedback.textContent = message;
      skipBtn.classList.add('hidden');
      nextBtn.classList.remove('hidden');
    }

    function handleSkip() {
      if (answered) return;
      renderQuestion();
    }

    function buildIdentifyQuestion() {
      var schemeKey = randomSchemeType();
      var base = randomHex();
      var colors = schemeColorPair(base, schemeKey);
      var wrongKeys = shuffle(SCHEME_ORDER.filter(function (k) {
        return k !== schemeKey;
      })).slice(0, 3);
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
      var fg;
      var bg;
      var ratio;
      var passAA;
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
      skipBtn.classList.remove('hidden');
      titleEl.textContent = getQuizTypeTitle(quizType);

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
            return '<button type="button" class="quiz-option" data-answer="' + key + '">' +
              getSchemeName(key) + '</button>';
          }).join('') + '</div>';
      } else if (quizType === 'pick') {
        currentQuestion = buildPickQuestion();
        var base = currentQuestion.data.base;
        var schemeKey = currentQuestion.data.schemeKey;
        var pickOptions = currentQuestion.data.options;
        content.innerHTML =
          '<p class="quiz-intro hint">' + getQuizTypeIntro('pick') + '</p>' +
          '<p>主色如下，哪种是 <strong>' + getSchemeName(schemeKey) + '</strong> 中的和谐色？</p>' +
          '<div class="quiz-palette"><div class="swatch" style="background:' + base + '"></div></div>' +
          '<div class="color-options">' + pickOptions.map(function (c) {
            return '<button type="button" class="color-option" style="background:' + c + '" data-answer="' + c +
              '" aria-label="' + c + '"></button>';
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
            return '<button type="button" class="quiz-option" data-answer="' + opt.value + '">' +
              opt.label + '</button>';
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
      skipBtn.classList.add('hidden');

      var buttons = content.querySelectorAll('[data-answer]');
      buttons.forEach(function (b) { b.disabled = true; });

      var correct = false;
      var detail = '';
      var answer;

      if (quizType === 'identify') {
        answer = btn.dataset.answer;
        correct = answer === currentQuestion.data.schemeKey;
        detail = getSchemeName(currentQuestion.data.schemeKey);
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

    renderQuizTypeTabs(quizTypeTabs, quizType, function (type) {
      quizType = type;
      renderQuestion();
    });

    nextBtn.addEventListener('click', renderQuestion);
    skipBtn.addEventListener('click', handleSkip);
    updateStats();
    renderQuestion();

    return { refreshStats: updateStats };
  }

  global.ColorPractice = global.ColorPractice || {};
  global.ColorPractice.initQuiz = initQuiz;
})(window);
