(function() {
  'use strict';

  const MobileBottomNav = {
    initialized: false,
    nav: null,
    
    init() {
      if (this.initialized || !this.isMobile()) return;
      
      this.createNav();
      this.setupEventListeners();
      this.setupScrollBehavior();
      this.highlightCurrentPage();
      this.initialized = true;
    },
    
    isMobile() {
      return window.innerWidth < 768;
    },
    
    createNav() {
      // ナビゲーション要素の作成
      this.nav = document.createElement('nav');
      this.nav.className = 'mobile-bottom-nav';
      this.nav.setAttribute('role', 'navigation');
      this.nav.setAttribute('aria-label', 'モバイルナビゲーション');
      
      this.nav.innerHTML = `
        <a href="/" class="nav-item" aria-label="ホーム" data-page="home">
          <svg class="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
            <polyline points="9 22 9 12 15 12 15 22"></polyline>
          </svg>
          <span class="nav-label">ホーム</span>
        </a>
        
        <button class="nav-item search-trigger" aria-label="検索" data-page="search">
          <svg class="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <span class="nav-label">検索</span>
        </button>
        
        <button class="nav-item tools-trigger" aria-label="学習ツール" data-page="tools">
          <svg class="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5"></path>
            <path d="M2 12l10 5 10-5"></path>
          </svg>
          <span class="nav-label">学習</span>
        </button>
        
        <a href="/categories/" class="nav-item" aria-label="カテゴリー" data-page="categories">
          <svg class="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <span class="nav-label">カテゴリー</span>
        </a>
        
        <button class="nav-item menu-trigger" aria-label="メニュー" data-page="menu">
          <svg class="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
          <span class="nav-label">メニュー</span>
        </button>
      `;
      
      document.body.appendChild(this.nav);
      
      // メインコンテンツにパディングを追加
      const main = document.querySelector('main');
      if (main) {
        main.style.paddingBottom = '72px';
      }
    },
    
    setupEventListeners() {
      // 検索ボタンのクリック
      const searchBtn = this.nav.querySelector('.search-trigger');
      searchBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.triggerSearch();
      });
      
      // 学習ツールボタンのクリック
      const toolsBtn = this.nav.querySelector('.tools-trigger');
      toolsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.showToolsMenu();
      });
      
      // メニューボタンのクリック
      const menuBtn = this.nav.querySelector('.menu-trigger');
      menuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.toggleMobileMenu();
      });
      
      // ウィンドウリサイズ時の処理
      window.addEventListener('resize', () => {
        if (!this.isMobile() && this.nav) {
          this.nav.style.display = 'none';
        } else if (this.isMobile() && this.nav) {
          this.nav.style.display = 'flex';
        }
      });
    },
    
    setupScrollBehavior() {
      let lastScrollTop = 0;
      let scrollTimer;
      
      window.addEventListener('scroll', () => {
        if (!this.isMobile()) return;
        
        clearTimeout(scrollTimer);
        
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // スクロール停止後の処理
        scrollTimer = setTimeout(() => {
          if (currentScrollTop > lastScrollTop && currentScrollTop > 100) {
            // 下スクロール時に隠す
            this.nav.classList.add('nav-hidden');
          } else {
            // 上スクロール時に表示
            this.nav.classList.remove('nav-hidden');
          }
          
          lastScrollTop = currentScrollTop;
        }, 100);
      });
    },
    
    highlightCurrentPage() {
      const currentPath = window.location.pathname;
      const navItems = this.nav.querySelectorAll('.nav-item');
      
      navItems.forEach(item => {
        item.classList.remove('nav-active');
        
        const href = item.getAttribute('href');
        if (href) {
          if (currentPath === href || (href === '/' && currentPath === '/')) {
            item.classList.add('nav-active');
          } else if (href !== '/' && currentPath.startsWith(href)) {
            item.classList.add('nav-active');
          }
        }
      });
    },
    
    triggerSearch() {
      // toggleSearch関数を呼び出す（header.htmlで定義）
      if (typeof toggleSearch === 'function') {
        toggleSearch();
      } else {
        // フォールバック：検索ページへ遷移
        window.location.href = '/search/';
      }
    },
    
    showToolsMenu() {
      // 学習ツールメニューモーダルを表示
      const existingModal = document.querySelector('.tools-menu-modal');
      if (existingModal) {
        existingModal.remove();
        return;
      }
      
      const modal = document.createElement('div');
      modal.className = 'tools-menu-modal fixed inset-0 bg-black bg-opacity-75 z-50 flex items-end';
      modal.innerHTML = `
        <div class="tools-menu-content bg-white w-full rounded-t-lg p-4 animate-slide-up">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold">学習ツール</h3>
            <button class="close-btn text-gray-500 hover:text-gray-700" aria-label="閉じる">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          <div class="grid grid-cols-1 gap-3">
            <a href="/tools/quiz/" class="tool-item flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
              <svg class="w-8 h-8 mr-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
              <div>
                <h4 class="font-medium">敬語クイズ</h4>
                <p class="text-sm text-gray-600">レベル別の敬語問題に挑戦</p>
              </div>
            </a>
            <a href="/tools/converter/" class="tool-item flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
              <svg class="w-8 h-8 mr-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"></path>
              </svg>
              <div>
                <h4 class="font-medium">敬語変換ツール</h4>
                <p class="text-sm text-gray-600">日常語を敬語に変換</p>
              </div>
            </a>
            <a href="/tools/examples/" class="tool-item flex items-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
              <svg class="w-8 h-8 mr-3 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
              <div>
                <h4 class="font-medium">例文集</h4>
                <p class="text-sm text-gray-600">シーン別の敬語例文</p>
              </div>
            </a>
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // クローズボタンのイベント
      modal.querySelector('.close-btn').addEventListener('click', () => modal.remove());
      
      // 背景クリックで閉じる
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
      });
    },
    
    toggleMobileMenu() {
      // ハンバーガーメニューのトグル
      const hamburgerBtn = document.getElementById('hamburgerbtn');
      if (hamburgerBtn) {
        hamburgerBtn.click();
      } else {
        // フォールバック：独自のメニューモーダルを作成
        this.createMenuModal();
      }
    },
    
    createMenuModal() {
      const existingModal = document.querySelector('.mobile-menu-modal');
      if (existingModal) {
        existingModal.remove();
        return;
      }
      
      const modal = document.createElement('div');
      modal.className = 'mobile-menu-modal';
      modal.innerHTML = `
        <div class="menu-backdrop"></div>
        <div class="menu-content">
          <button class="menu-close" aria-label="メニューを閉じる">×</button>
          <nav class="menu-nav">
            <a href="/">ホーム</a>
            <a href="/概要/">敬語.jpについて</a>
            <a href="/categories/">カテゴリー</a>
            <a href="/tags/">タグ</a>
            <a href="/お問い合わせ/">お問い合わせ</a>
          </nav>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // 閉じる処理
      const closeBtn = modal.querySelector('.menu-close');
      const backdrop = modal.querySelector('.menu-backdrop');
      
      const closeModal = () => {
        modal.remove();
      };
      
      closeBtn.addEventListener('click', closeModal);
      backdrop.addEventListener('click', closeModal);
      
      // ESCキーで閉じる
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal) {
          closeModal();
        }
      });
    }
  };
  
  // 初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MobileBottomNav.init());
  } else {
    MobileBottomNav.init();
  }
  
  // グローバルに公開
  window.MobileBottomNav = MobileBottomNav;
})();