/**
 * 存储抽象层 — 当前使用 localStorage，以后可切换为 API / 数据库。
 * 切换方式：在 app.js 中将 createStorage(false) 改为 createStorage(true)。
 */
(function (global) {
  var STORAGE_KEY = 'color-practice-data';
  var API_BASE = '/api';

  function defaultData() {
    return {
      score: 0,
      streak: 0,
      totalAnswered: 0,
      totalCorrect: 0,
      history: [],
      preferences: {
        lastBaseColor: '#3b82f6',
        lastScheme: 'complementary',
      },
      favorites: [],
    };
  }

  function LocalStorageAdapter() {
    this.mode = 'localStorage';
  }

  LocalStorageAdapter.prototype.load = function () {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultData();
      var parsed = JSON.parse(raw);
      var base = defaultData();
      return Object.assign(base, parsed, {
        preferences: Object.assign({}, base.preferences, parsed.preferences || {}),
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : [],
      });
    } catch (e) {
      return defaultData();
    }
  };

  LocalStorageAdapter.prototype.save = function (data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return Promise.resolve(data);
  };

  LocalStorageAdapter.prototype.clear = function () {
    localStorage.removeItem(STORAGE_KEY);
    return Promise.resolve();
  };

  function ApiStorageAdapter(baseUrl) {
    this.mode = 'api';
    this.baseUrl = baseUrl || API_BASE;
  }

  ApiStorageAdapter.prototype.load = function () {
    return fetch(this.baseUrl + '/progress', { credentials: 'include' })
      .then(function (res) {
        if (!res.ok) return defaultData();
        return res.json().then(function (json) {
          return Object.assign(defaultData(), json);
        });
      })
      .catch(function () { return defaultData(); });
  };

  ApiStorageAdapter.prototype.save = function (data) {
    return fetch(this.baseUrl + '/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(data),
    }).then(function () { return data; });
  };

  ApiStorageAdapter.prototype.clear = function () {
    return fetch(this.baseUrl + '/progress', {
      method: 'DELETE',
      credentials: 'include',
    });
  };

  function createStorage(useApi) {
    return useApi ? new ApiStorageAdapter() : new LocalStorageAdapter();
  }

  function ProgressStore(adapter) {
    this.adapter = adapter;
    this.data = null;
  }

  ProgressStore.prototype.init = function () {
    var self = this;
    return Promise.resolve(this.adapter.load()).then(function (data) {
      self.data = data;
      return data;
    });
  };

  Object.defineProperty(ProgressStore.prototype, 'mode', {
    get: function () { return this.adapter.mode; },
  });

  ProgressStore.prototype.persist = function () {
    if (this.data) return this.adapter.save(this.data);
    return Promise.resolve();
  };

  ProgressStore.prototype.recordAnswer = function (payload) {
    var self = this;
    var quizType = payload.quizType;
    var correct = payload.correct;
    var detail = payload.detail;

    return this.init().then(function () {
      self.data.totalAnswered += 1;
      if (correct) {
        self.data.totalCorrect += 1;
        self.data.score += 10;
        self.data.streak += 1;
      } else {
        self.data.streak = 0;
      }
      self.data.history.unshift({
        time: new Date().toISOString(),
        quizType: quizType,
        correct: correct,
        detail: detail,
      });
      if (self.data.history.length > 100) {
        self.data.history = self.data.history.slice(0, 100);
      }
      return self.persist();
    });
  };

  ProgressStore.prototype.updatePreferences = function (prefs) {
    var self = this;
    return this.init().then(function () {
      self.data.preferences = Object.assign({}, self.data.preferences, prefs);
      return self.persist();
    });
  };

  ProgressStore.prototype.addFavorite = function (item) {
    var self = this;
    return this.init().then(function () {
      if (!self.data.favorites) self.data.favorites = [];
      var entry = Object.assign({}, item, {
        id: item.id || ('fav-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7)),
        savedAt: item.savedAt || new Date().toISOString(),
      });
      self.data.favorites.unshift(entry);
      if (self.data.favorites.length > 50) {
        self.data.favorites = self.data.favorites.slice(0, 50);
      }
      return self.persist().then(function () { return entry; });
    });
  };

  ProgressStore.prototype.removeFavorite = function (id) {
    var self = this;
    return this.init().then(function () {
      if (!self.data.favorites) self.data.favorites = [];
      self.data.favorites = self.data.favorites.filter(function (f) { return f.id !== id; });
      return self.persist();
    });
  };

  ProgressStore.prototype.clearQuizProgress = function () {
    var self = this;
    return this.init().then(function () {
      self.data.score = 0;
      self.data.streak = 0;
      self.data.totalAnswered = 0;
      self.data.totalCorrect = 0;
      self.data.history = [];
      return self.persist();
    });
  };

  global.ColorPractice = global.ColorPractice || {};
  global.ColorPractice.storage = {
    createStorage: createStorage,
    ProgressStore: ProgressStore,
  };
})(window);
