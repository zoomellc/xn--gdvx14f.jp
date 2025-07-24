(function() {
  'use strict';

  const TableResponsive = {
    init() {
      this.setupTableScrollDetection();
      this.observeTables();
    },

    setupTableScrollDetection() {
      document.querySelectorAll('.table-wrapper').forEach(wrapper => {
        const scrollContainer = wrapper.querySelector('.overflow-x-auto');
        const scrollIndicator = wrapper.querySelector('.table-scroll-indicator');
        const scrollHint = wrapper.querySelector('.table-scroll-hint');
        
        if (!scrollContainer) return;

        // スクロール可能かチェック
        const checkScrollable = () => {
          const isScrollable = scrollContainer.scrollWidth > scrollContainer.clientWidth;
          
          if (isScrollable) {
            // スクロール位置に応じてインジケーターを表示
            const scrollLeft = scrollContainer.scrollLeft;
            const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
            
            // 右端にスクロール可能な場合、インジケーターを表示
            if (scrollIndicator) {
              scrollIndicator.style.opacity = scrollLeft < maxScroll - 5 ? '1' : '0';
            }
            
            // 初回表示時のみヒントを表示
            if (scrollHint && !wrapper.dataset.hintShown) {
              scrollHint.style.opacity = '1';
              wrapper.dataset.hintShown = 'true';
              
              // 3秒後にヒントを非表示
              setTimeout(() => {
                scrollHint.style.opacity = '0';
              }, 3000);
            }
          } else {
            // スクロール不要な場合は非表示
            if (scrollIndicator) scrollIndicator.style.opacity = '0';
            if (scrollHint) scrollHint.style.opacity = '0';
          }
        };

        // 初期チェック
        checkScrollable();

        // スクロールイベント
        scrollContainer.addEventListener('scroll', checkScrollable);
        
        // リサイズイベント
        window.addEventListener('resize', checkScrollable);

        // タッチデバイスでのスムーズスクロール
        if ('ontouchstart' in window) {
          scrollContainer.style.webkitOverflowScrolling = 'touch';
          scrollContainer.style.scrollBehavior = 'smooth';
        }
      });
    },

    observeTables() {
      // 動的に追加されるテーブルを監視
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList?.contains('table-wrapper')) {
              this.setupTableScrollDetection();
            }
          });
        });
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    }
  };

  // DOMContentLoadedで初期化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => TableResponsive.init());
  } else {
    TableResponsive.init();
  }

  // グローバルに公開
  window.TableResponsive = TableResponsive;
})();