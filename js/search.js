(function() {
  'use strict';

  const Search = {
    // 設定
    config: {
      minSearchLength: 2,
      maxResults: 20,
      highlightClass: 'search-highlight',
      searchDelay: 300,
      cacheExpiry: 3600000, // 1時間
      storageKey: 'searchIndex',
      popularKey: 'popularSearches'
    },

    // 検索インデックス
    searchIndex: null,
    searchTimeout: null,
    searchHistory: [],
    popularSearches: [],

    // 初期化
    init: function() {
      this.loadSearchIndex();
      this.loadSearchHistory();
      this.loadPopularSearches();
      this.createSearchForm();
      this.setupSearchListeners();
      this.setupKeyboardShortcuts();
    },

    // 検索フォームの作成
    createSearchForm: function() {
      const searchWrapper = document.getElementById('searchWrapper');
      if (!searchWrapper || searchWrapper.querySelector('.search-form')) return;

      const searchForm = document.createElement('div');
      searchForm.className = 'search-form';
      searchForm.innerHTML = `
        <form role="search" class="relative">
          <input type="search" 
                 name="q" 
                 placeholder="記事を検索..." 
                 class="search-input w-full px-4 py-3 pr-12 text-gray-700 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 focus:bg-white"
                 autocomplete="off"
                 aria-label="サイト内検索">
          <button type="submit" 
                  class="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label="検索">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </button>
        </form>
        <div class="search-suggestions mt-2 hidden"></div>
        <div class="search-results mt-4"></div>
      `;

      searchWrapper.appendChild(searchForm);

      // フォーム送信を防ぐ
      const form = searchForm.querySelector('form');
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = form.querySelector('input[type="search"]');
        const query = input.value.trim();
        if (query.length >= this.config.minSearchLength) {
          this.performSearch(query, input);
        }
      });
    },

    // 検索インデックスの読み込み
    loadSearchIndex: async function() {
      try {
        // キャッシュから読み込み
        const cached = this.getCachedIndex();
        if (cached) {
          this.searchIndex = cached;
          return;
        }

        // インデックスファイルを読み込み
        const response = await fetch('/index.json');
        if (!response.ok) throw new Error('Failed to load search index');
        
        const data = await response.json();
        this.searchIndex = this.processIndexData(data);
        
        // キャッシュに保存
        this.setCachedIndex(this.searchIndex);
      } catch (error) {
        console.error('Error loading search index:', error);
        // フォールバック: ページ内のコンテンツから動的に生成
        this.generateIndexFromDOM();
      }
    },

    // キャッシュからインデックスを取得
    getCachedIndex: function() {
      try {
        const cached = localStorage.getItem(this.config.storageKey);
        if (!cached) return null;
        
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp > this.config.cacheExpiry) {
          localStorage.removeItem(this.config.storageKey);
          return null;
        }
        
        return data.index;
      } catch (e) {
        return null;
      }
    },

    // インデックスをキャッシュに保存
    setCachedIndex: function(index) {
      try {
        const data = {
          index: index,
          timestamp: Date.now()
        };
        localStorage.setItem(this.config.storageKey, JSON.stringify(data));
      } catch (e) {
        console.warn('Failed to cache search index:', e);
      }
    },

    // インデックスデータの処理
    processIndexData: function(data) {
      return data.map(item => ({
        title: item.title || '',
        content: item.content || '',
        summary: item.summary || '',
        permalink: item.permalink || '',
        categories: item.categories || [],
        tags: item.tags || [],
        date: item.date || '',
        searchableText: this.createSearchableText(item)
      }));
    },

    // 検索可能なテキストを生成
    createSearchableText: function(item) {
      const parts = [
        item.title,
        item.content,
        item.summary,
        (item.categories || []).join(' '),
        (item.tags || []).join(' ')
      ];
      
      return parts.filter(Boolean).join(' ').toLowerCase();
    },

    // DOMから動的にインデックスを生成
    generateIndexFromDOM: function() {
      const articles = document.querySelectorAll('article, .post, .content');
      this.searchIndex = Array.from(articles).map(article => {
        const title = article.querySelector('h1, h2, .title')?.textContent || '';
        const content = article.textContent || '';
        const link = article.querySelector('a')?.href || '';
        
        return {
          title: title.trim(),
          content: content.trim(),
          permalink: link,
          searchableText: (title + ' ' + content).toLowerCase()
        };
      });
    },

    // 検索履歴の読み込み
    loadSearchHistory: function() {
      try {
        const history = localStorage.getItem('searchHistory');
        this.searchHistory = history ? JSON.parse(history) : [];
      } catch (e) {
        this.searchHistory = [];
      }
    },

    // 検索履歴の保存
    saveSearchHistory: function(query) {
      if (!query || query.length < this.config.minSearchLength) return;
      
      // 重複を削除
      this.searchHistory = this.searchHistory.filter(q => q !== query);
      
      // 最新の検索を先頭に追加
      this.searchHistory.unshift(query);
      
      // 最大10件まで保持
      this.searchHistory = this.searchHistory.slice(0, 10);
      
      try {
        localStorage.setItem('searchHistory', JSON.stringify(this.searchHistory));
      } catch (e) {
        console.warn('Failed to save search history:', e);
      }
      
      // 人気検索キーワードを更新
      this.updatePopularSearches(query);
    },

    // 人気検索キーワードの読み込み
    loadPopularSearches: function() {
      try {
        const popular = localStorage.getItem(this.config.popularKey);
        this.popularSearches = popular ? JSON.parse(popular) : [];
      } catch (e) {
        this.popularSearches = [];
      }
    },

    // 人気検索キーワードの更新
    updatePopularSearches: function(query) {
      const existing = this.popularSearches.find(p => p.term === query);
      
      if (existing) {
        existing.count++;
      } else {
        this.popularSearches.push({ term: query, count: 1 });
      }
      
      // カウント順でソート
      this.popularSearches.sort((a, b) => b.count - a.count);
      
      // 上位10件のみ保持
      this.popularSearches = this.popularSearches.slice(0, 10);
      
      try {
        localStorage.setItem(this.config.popularKey, JSON.stringify(this.popularSearches));
      } catch (e) {
        console.warn('Failed to save popular searches:', e);
      }
    },

    // 検索リスナーの設定
    setupSearchListeners: function() {
      const searchInputs = document.querySelectorAll('input[type="search"], input[name="q"], .search-input');
      
      searchInputs.forEach(input => {
        // リアルタイム検索
        input.addEventListener('input', (e) => {
          clearTimeout(this.searchTimeout);
          
          const query = e.target.value.trim();
          
          if (query.length < this.config.minSearchLength) {
            this.hideSearchResults();
            this.showSearchSuggestions(e.target);
            return;
          }
          
          this.searchTimeout = setTimeout(() => {
            this.performSearch(query, e.target);
          }, this.config.searchDelay);
        });
        
        // フォーカス時に提案を表示
        input.addEventListener('focus', (e) => {
          if (!e.target.value.trim()) {
            this.showSearchSuggestions(e.target);
          }
        });
        
        // フォーカスが外れたら結果を隠す
        input.addEventListener('blur', (e) => {
          setTimeout(() => {
            this.hideSearchResults();
          }, 200);
        });
        
        // Enterキーで検索実行
        input.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            const query = e.target.value.trim();
            if (query) {
              this.saveSearchHistory(query);
              this.performFullSearch(query);
            }
          }
        });
      });
      
      // 検索フォームのサブミットを防ぐ
      const searchForms = document.querySelectorAll('.widget-search__form, .search-form');
      searchForms.forEach(form => {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = form.querySelector('input[type="search"], input[name="q"]');
          if (input && input.value.trim()) {
            this.saveSearchHistory(input.value.trim());
            this.performFullSearch(input.value.trim());
          }
        });
      });
    },

    // キーボードショートカットの設定
    setupKeyboardShortcuts: function() {
      document.addEventListener('keydown', (e) => {
        // Ctrl/Cmd + K で検索フォーカス
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
          e.preventDefault();
          const searchInput = document.querySelector('input[type="search"], input[name="q"]');
          if (searchInput) {
            searchInput.focus();
            searchInput.select();
          }
        }
        
        // Escapeで検索結果を閉じる
        if (e.key === 'Escape') {
          this.hideSearchResults();
        }
      });
    },

    // 検索提案を表示
    showSearchSuggestions: function(input) {
      const container = this.getOrCreateResultsContainer(input);
      container.innerHTML = '';
      
      // 人気検索キーワード
      if (this.popularSearches.length > 0) {
        const popularSection = document.createElement('div');
        popularSection.className = 'search-suggestions-section';
        popularSection.innerHTML = '<h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">人気の検索キーワード</h4>';
        
        const popularList = document.createElement('ul');
        popularList.className = 'space-y-1';
        
        this.popularSearches.slice(0, 5).forEach(item => {
          const li = document.createElement('li');
          li.innerHTML = `
            <button class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors" data-search-term="${item.term}">
              <span class="text-gray-700 dark:text-gray-300">${item.term}</span>
              <span class="text-xs text-gray-500 dark:text-gray-500 ml-2">(${item.count}回)</span>
            </button>
          `;
          li.querySelector('button').addEventListener('click', () => {
            input.value = item.term;
            this.performSearch(item.term, input);
          });
          popularList.appendChild(li);
        });
        
        popularSection.appendChild(popularList);
        container.appendChild(popularSection);
      }
      
      // 検索履歴
      if (this.searchHistory.length > 0) {
        const historySection = document.createElement('div');
        historySection.className = 'search-suggestions-section mt-4';
        historySection.innerHTML = '<h4 class="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">最近の検索</h4>';
        
        const historyList = document.createElement('ul');
        historyList.className = 'space-y-1';
        
        this.searchHistory.slice(0, 5).forEach(query => {
          const li = document.createElement('li');
          li.innerHTML = `
            <button class="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors flex items-center justify-between" data-search-term="${query}">
              <span class="text-gray-700 dark:text-gray-300">${query}</span>
              <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </button>
          `;
          li.querySelector('button').addEventListener('click', () => {
            input.value = query;
            this.performSearch(query, input);
          });
          historyList.appendChild(li);
        });
        
        historySection.appendChild(historyList);
        container.appendChild(historySection);
      }
      
      container.style.display = 'block';
    },

    // 検索を実行
    performSearch: function(query, input) {
      if (!this.searchIndex) {
        console.warn('Search index not loaded');
        return;
      }
      
      const results = this.searchInIndex(query);
      this.displaySearchResults(results, query, input);
    },

    // インデックス内を検索
    searchInIndex: function(query) {
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(/\s+/).filter(Boolean);
      
      const results = this.searchIndex.map(item => {
        let score = 0;
        
        // タイトルの完全一致
        if (item.title.toLowerCase() === queryLower) {
          score += 100;
        }
        
        // タイトルの部分一致
        if (item.title.toLowerCase().includes(queryLower)) {
          score += 50;
        }
        
        // 各単語でのマッチング
        queryWords.forEach(word => {
          // タイトルに含まれる
          if (item.title.toLowerCase().includes(word)) {
            score += 20;
          }
          
          // コンテンツに含まれる
          if (item.searchableText.includes(word)) {
            score += 10;
          }
          
          // カテゴリーに含まれる
          if (item.categories.some(cat => cat.toLowerCase().includes(word))) {
            score += 15;
          }
          
          // タグに含まれる
          if (item.tags.some(tag => tag.toLowerCase().includes(word))) {
            score += 15;
          }
        });
        
        return { ...item, score };
      });
      
      // スコアでソートし、上位結果のみ返す
      return results
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, this.config.maxResults);
    },

    // 検索結果を表示
    displaySearchResults: function(results, query, input) {
      const container = this.getOrCreateResultsContainer(input);
      container.innerHTML = '';
      
      if (results.length === 0) {
        container.innerHTML = `
          <div class="p-4 text-center text-gray-500 dark:text-gray-400">
            「${query}」に一致する結果が見つかりませんでした
          </div>
        `;
        container.style.display = 'block';
        return;
      }
      
      const resultsHeader = document.createElement('div');
      resultsHeader.className = 'p-3 border-b border-gray-200 dark:border-gray-700';
      resultsHeader.innerHTML = `
        <span class="text-sm text-gray-600 dark:text-gray-400">
          ${results.length}件の結果が見つかりました
        </span>
      `;
      container.appendChild(resultsHeader);
      
      const resultsList = document.createElement('ul');
      resultsList.className = 'divide-y divide-gray-200 dark:divide-gray-700';
      
      results.forEach(result => {
        const li = document.createElement('li');
        li.className = 'hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors';
        
        const highlightedTitle = this.highlightText(result.title, query);
        const snippet = this.createSnippet(result.content || result.summary, query);
        
        li.innerHTML = `
          <a href="${result.permalink}" class="block p-3">
            <h4 class="font-medium text-gray-900 dark:text-gray-100 mb-1">
              ${highlightedTitle}
            </h4>
            ${snippet ? `<p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">${snippet}</p>` : ''}
            ${result.categories.length > 0 ? `
              <div class="mt-1 flex flex-wrap gap-1">
                ${result.categories.map(cat => `
                  <span class="text-xs px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                    ${cat}
                  </span>
                `).join('')}
              </div>
            ` : ''}
          </a>
        `;
        
        resultsList.appendChild(li);
      });
      
      container.appendChild(resultsList);
      container.style.display = 'block';
    },

    // テキストをハイライト
    highlightText: function(text, query) {
      if (!text || !query) return text;
      
      const regex = new RegExp(`(${query.split(/\s+/).join('|')})`, 'gi');
      return text.replace(regex, '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>');
    },

    // スニペットを作成
    createSnippet: function(text, query) {
      if (!text || !query) return '';
      
      const queryLower = query.toLowerCase();
      const textLower = text.toLowerCase();
      const index = textLower.indexOf(queryLower);
      
      if (index === -1) {
        // クエリの最初の単語で検索
        const firstWord = query.split(/\s+/)[0].toLowerCase();
        const wordIndex = textLower.indexOf(firstWord);
        if (wordIndex !== -1) {
          const start = Math.max(0, wordIndex - 50);
          const end = Math.min(text.length, wordIndex + 100);
          return '...' + this.highlightText(text.substring(start, end), query) + '...';
        }
        return text.substring(0, 150) + '...';
      }
      
      const start = Math.max(0, index - 50);
      const end = Math.min(text.length, index + 100);
      const snippet = text.substring(start, end);
      
      return (start > 0 ? '...' : '') + 
             this.highlightText(snippet, query) + 
             (end < text.length ? '...' : '');
    },

    // 結果コンテナを取得または作成
    getOrCreateResultsContainer: function(input) {
      let container = input.parentElement.querySelector('.search-results-container');
      
      if (!container) {
        container = document.createElement('div');
        container.className = 'search-results-container absolute z-50 w-full mt-1 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto';
        container.style.display = 'none';
        
        // 親要素をrelativeに
        input.parentElement.style.position = 'relative';
        input.parentElement.appendChild(container);
      }
      
      return container;
    },

    // 検索結果を隠す
    hideSearchResults: function() {
      const containers = document.querySelectorAll('.search-results-container');
      containers.forEach(container => {
        container.style.display = 'none';
      });
    },

    // フルページ検索を実行
    performFullSearch: function(query) {
      // 検索結果ページへ遷移するか、モーダルで表示
      window.location.href = `/search?q=${encodeURIComponent(query)}`;
    },

    // インデックスを手動で更新
    refreshIndex: async function() {
      localStorage.removeItem(this.config.storageKey);
      await this.loadSearchIndex();
    }
  };

  // DOMContentLoadedで初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      Search.init();
    });
  } else {
    Search.init();
  }

  // グローバルに公開
  window.Search = Search;
  window.SiteSearch = Search; // 後方互換性のため
})();