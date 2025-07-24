(function() {
  'use strict';

  const FAB = {
    button: null,
    isVisible: true,
    lastScrollTop: 0,
    scrollThreshold: 100,
    
    init() {
      if (window.innerWidth >= 768) return; // モバイルのみ
      
      this.create();
      this.setupScrollBehavior();
      this.setupPageSpecificBehavior();
    },
    
    create() {
      // FABコンテナの作成
      const fabContainer = document.createElement('div');
      fabContainer.className = 'fab-container';
      
      // メインFABボタン
      this.button = document.createElement('button');
      this.button.className = 'fab fab-main';
      this.button.setAttribute('aria-label', 'アクション');
      
      fabContainer.appendChild(this.button);
      document.body.appendChild(fabContainer);
      
      this.updateIcon();
      
      // 初期状態では非表示
      this.isVisible = false;
    },
    
    updateIcon() {
      const path = window.location.pathname;
      let icon = '';
      let label = '';
      
      if (path === '/' || path.includes('/page/')) {
        // ホームページや記事一覧：検索アイコン
        icon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.35-4.35"></path>
                </svg>`;
        label = '検索';
        this.button.onclick = () => this.triggerSearch();
      } else if (path.includes('/categories/') || path.includes('/tags/')) {
        // カテゴリー・タグページ：フィルターアイコン
        icon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                </svg>`;
        label = 'フィルター';
        this.button.onclick = () => this.showFilterOptions();
      } else {
        // 個別記事ページ：目次/トップへ戻るアイコン
        const hasToC = document.querySelector('.toc, #TableOfContents');
        if (hasToC) {
          icon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="8" y1="6" x2="21" y2="6"></line>
                    <line x1="8" y1="12" x2="21" y2="12"></line>
                    <line x1="8" y1="18" x2="21" y2="18"></line>
                    <line x1="3" y1="6" x2="3.01" y2="6"></line>
                    <line x1="3" y1="12" x2="3.01" y2="12"></line>
                    <line x1="3" y1="18" x2="3.01" y2="18"></line>
                  </svg>`;
          label = '目次';
          this.button.onclick = () => this.showTableOfContents();
        } else {
          icon = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                  </svg>`;
          label = 'トップへ';
          this.button.onclick = () => this.scrollToTop();
        }
      }
      
      this.button.innerHTML = icon;
      this.button.setAttribute('aria-label', label);
    },
    
    setupScrollBehavior() {
      let scrollTimer;
      
      window.addEventListener('scroll', () => {
        clearTimeout(scrollTimer);
        
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // スクロール中はFABを隠す
        if (Math.abs(currentScrollTop - this.lastScrollTop) > 5) {
          this.hide();
        }
        
        // スクロールが止まったら表示
        scrollTimer = setTimeout(() => {
          if (currentScrollTop > this.scrollThreshold) {
            this.show();
          } else if (currentScrollTop <= this.scrollThreshold) {
            // ページ上部では目次ボタンの代わりにトップへ戻るボタンを非表示
            const path = window.location.pathname;
            if (!path.includes('/categories/') && !path.includes('/tags/') && path !== '/') {
              this.hide();
            }
          }
          this.lastScrollTop = currentScrollTop;
        }, 150);
      });
    },
    
    setupPageSpecificBehavior() {
      // ページ遷移を検知（SPAの場合）
      const observer = new MutationObserver(() => {
        this.updateIcon();
      });
      
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    },
    
    show() {
      if (this.button && !this.isVisible) {
        this.button.classList.add('fab-visible');
        this.isVisible = true;
      }
    },
    
    hide() {
      if (this.button && this.isVisible) {
        this.button.classList.remove('fab-visible');
        this.isVisible = false;
      }
    },
    
    triggerSearch() {
      // 検索モーダルを開く
      const searchModal = document.querySelector('.search-modal');
      if (searchModal) {
        searchModal.classList.add('active');
      } else {
        // モバイルボトムナビゲーションの検索ボタンをトリガー
        const searchBtn = document.querySelector('.mobile-bottom-nav .search-trigger');
        if (searchBtn) {
          searchBtn.click();
        }
      }
    },
    
    showTableOfContents() {
      // 目次モーダルの作成
      const existingModal = document.querySelector('.toc-modal');
      if (existingModal) {
        existingModal.remove();
        return;
      }
      
      const toc = document.querySelector('.toc, #TableOfContents');
      if (!toc) return;
      
      const modal = document.createElement('div');
      modal.className = 'toc-modal';
      modal.innerHTML = `
        <div class="toc-backdrop"></div>
        <div class="toc-content">
          <div class="toc-header">
            <h3>目次</h3>
            <button class="toc-close" aria-label="閉じる">×</button>
          </div>
          <div class="toc-body">
            ${toc.innerHTML}
          </div>
        </div>
      `;
      
      document.body.appendChild(modal);
      
      // 閉じる処理
      const closeBtn = modal.querySelector('.toc-close');
      const backdrop = modal.querySelector('.toc-backdrop');
      
      const closeModal = () => {
        modal.remove();
      };
      
      closeBtn.addEventListener('click', closeModal);
      backdrop.addEventListener('click', closeModal);
      
      // 目次項目クリックで自動的に閉じる
      modal.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
          setTimeout(closeModal, 300);
        });
      });
    },
    
    showFilterOptions() {
      // フィルターオプションの実装
      console.log('Filter options - to be implemented');
    },
    
    scrollToTop() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };
  
  // 初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => FAB.init());
  } else {
    FAB.init();
  }
  
  // ウィンドウリサイズ時の処理
  window.addEventListener('resize', () => {
    if (window.innerWidth >= 768 && FAB.button) {
      FAB.button.remove();
      FAB.button = null;
    } else if (window.innerWidth < 768 && !FAB.button) {
      FAB.init();
    }
  });
  
  // グローバルに公開
  window.FAB = FAB;
})();