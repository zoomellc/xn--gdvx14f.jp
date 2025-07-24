(function() {
  'use strict';

  const ReadingProgress = {
    progressBar: null,
    article: null,
    initialized: false,
    
    init() {
      // 記事ページでのみ実行
      if (!this.isArticlePage()) return;
      
      this.article = document.querySelector('.content, article, main');
      if (!this.article) return;
      
      this.createProgressBar();
      this.setupScrollListener();
      this.initialized = true;
    },
    
    isArticlePage() {
      // URLパスから記事ページかどうか判定
      const path = window.location.pathname;
      return path !== '/' && 
             !path.includes('/categories/') && 
             !path.includes('/tags/') && 
             !path.includes('/page/') &&
             !path.includes('/search/');
    },
    
    createProgressBar() {
      // プログレスバーコンテナの作成
      const container = document.createElement('div');
      container.className = 'reading-progress-container';
      
      // プログレスバー本体
      this.progressBar = document.createElement('div');
      this.progressBar.className = 'reading-progress-bar';
      this.progressBar.setAttribute('role', 'progressbar');
      this.progressBar.setAttribute('aria-label', '読み進め状況');
      this.progressBar.setAttribute('aria-valuemin', '0');
      this.progressBar.setAttribute('aria-valuemax', '100');
      this.progressBar.setAttribute('aria-valuenow', '0');
      
      container.appendChild(this.progressBar);
      
      // ヘッダーの下に配置
      const header = document.querySelector('header');
      if (header) {
        header.appendChild(container);
      } else {
        document.body.insertBefore(container, document.body.firstChild);
      }
      
      // 読了時間の推定表示
      this.addReadingTime();
    },
    
    setupScrollListener() {
      let ticking = false;
      
      const updateProgress = () => {
        const articleRect = this.article.getBoundingClientRect();
        const articleTop = articleRect.top + window.pageYOffset;
        const articleHeight = articleRect.height;
        const windowHeight = window.innerHeight;
        const scrolled = window.pageYOffset;
        
        // 記事の開始位置から終了位置までの進捗を計算
        const startOffset = articleTop;
        const endOffset = articleTop + articleHeight - windowHeight;
        const progress = Math.min(100, Math.max(0, 
          ((scrolled - startOffset) / (endOffset - startOffset)) * 100
        ));
        
        // プログレスバーの更新
        this.progressBar.style.width = progress + '%';
        this.progressBar.setAttribute('aria-valuenow', Math.round(progress));
        
        // 読了マークの表示
        if (progress >= 98) {
          this.markAsRead();
        }
        
        ticking = false;
      };
      
      window.addEventListener('scroll', () => {
        if (!ticking) {
          window.requestAnimationFrame(updateProgress);
          ticking = true;
        }
      });
      
      // 初回実行
      updateProgress();
    },
    
    addReadingTime() {
      // 記事のテキストから読了時間を推定
      const text = this.article.innerText || this.article.textContent;
      const wordsPerMinute = 400; // 日本語の平均読書速度（文字/分）
      const wordCount = text.length;
      const readingTime = Math.ceil(wordCount / wordsPerMinute);
      
      // 読了時間の表示要素を作成
      const timeElement = document.createElement('div');
      timeElement.className = 'reading-time-indicator';
      timeElement.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
        <span>約${readingTime}分で読めます</span>
      `;
      
      // 記事タイトルの下に挿入
      const title = document.querySelector('h1.title, .content h1, article h1');
      if (title) {
        title.parentNode.insertBefore(timeElement, title.nextSibling);
      }
    },
    
    markAsRead() {
      // 読了状態の保存
      const currentPath = window.location.pathname;
      const readArticles = JSON.parse(localStorage.getItem('readArticles') || '[]');
      
      if (!readArticles.includes(currentPath)) {
        readArticles.push(currentPath);
        localStorage.setItem('readArticles', JSON.stringify(readArticles));
        
        // 読了通知の表示
        this.showReadNotification();
      }
    },
    
    showReadNotification() {
      const notification = document.createElement('div');
      notification.className = 'read-notification';
      notification.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
          <polyline points="22 4 12 14.01 9 11.01"></polyline>
        </svg>
        <span>記事を読了しました！</span>
      `;
      
      document.body.appendChild(notification);
      
      // アニメーション後に削除
      setTimeout(() => {
        notification.classList.add('show');
      }, 100);
      
      setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
      }, 3000);
    },
    
    // 既読記事のマーキング（記事一覧ページ用）
    markReadArticles() {
      if (this.isArticlePage()) return;
      
      const readArticles = JSON.parse(localStorage.getItem('readArticles') || '[]');
      const articleLinks = document.querySelectorAll('a[href]');
      
      articleLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (readArticles.includes(href)) {
          link.classList.add('article-read');
          
          // 既読バッジの追加
          const badge = document.createElement('span');
          badge.className = 'read-badge';
          badge.innerHTML = '既読';
          
          const titleElement = link.querySelector('h2, h3, .title');
          if (titleElement && !link.querySelector('.read-badge')) {
            titleElement.appendChild(badge);
          }
        }
      });
    }
  };
  
  // 初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      ReadingProgress.init();
      ReadingProgress.markReadArticles();
    });
  } else {
    ReadingProgress.init();
    ReadingProgress.markReadArticles();
  }
  
  // ページ遷移時の再初期化（SPA対応）
  let lastPath = window.location.pathname;
  const checkForPageChange = () => {
    if (window.location.pathname !== lastPath) {
      lastPath = window.location.pathname;
      ReadingProgress.init();
      ReadingProgress.markReadArticles();
    }
  };
  
  // MutationObserverで監視
  const observer = new MutationObserver(checkForPageChange);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  // グローバルに公開
  window.ReadingProgress = ReadingProgress;
})();