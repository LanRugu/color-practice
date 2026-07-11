/** 界面文案与 Tab 配置（单一数据源） */
(function (global) {
  var QUIZ_TYPES = [
    { id: 'identify', label: '识别类型', title: '识别配色类型', progressLabel: '识别类型' },
    { id: 'pick', label: '选出和谐色', title: '选出和谐色', progressLabel: '选和谐色',
      intro: '和谐色是与主色按配色方案规则搭配、在色轮上形成协调关系的颜色。例如互补色中，与主色相对 180° 的颜色；相似色中，与主色相邻的颜色。请根据下方配色类型，选出与主色构成和谐关系的那一种。' },
    { id: 'contrast-guess', label: '对比度判断', title: '对比度判断', progressLabel: '对比度' },
  ];

  function findQuizType(id) {
    for (var i = 0; i < QUIZ_TYPES.length; i++) {
      if (QUIZ_TYPES[i].id === id) return QUIZ_TYPES[i];
    }
    return null;
  }

  function quizField(id, field, fallback) {
    var item = findQuizType(id);
    return item ? item[field] : fallback;
  }

  global.ColorPractice = global.ColorPractice || {};
  global.ColorPractice.config = {
    QUIZ_TYPES: QUIZ_TYPES,
    getQuizType: findQuizType,
    getQuizTypeLabel: function (id) { return quizField(id, 'label', id); },
    getQuizTypeTitle: function (id) { return quizField(id, 'title', id); },
    getQuizProgressLabel: function (id) { return quizField(id, 'progressLabel', id); },
    getQuizTypeIntro: function (id) { return quizField(id, 'intro', ''); },
  };
})(window);
