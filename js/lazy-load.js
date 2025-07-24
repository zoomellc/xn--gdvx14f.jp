// 高度な画像遅延読み込み実装（LQIP対応）
(function() {
  'use strict';

  // loading="lazy"をサポートしないブラウザー向けのフォールバック
  if ('loading' in HTMLImageElement.prototype) {
    // ネイティブの遅延読み込みをサポート
    const images = document.querySelectorAll('img[loading="lazy"]');
    images.forEach(img => {
      // 必要に応じて追加の処理
    });
  } else {
    // Intersection Observer APIを使用した遅延読み込み
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          
          // data-srcから実際のsrcに変更
          if (img.dataset.src) {
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
          }
          
          // srcsetがある場合
          if (img.dataset.srcset) {
            img.srcset = img.dataset.srcset;
            img.removeAttribute('data-srcset');
          }
          
          // 読み込み完了後にクラスを追加
          img.addEventListener('load', () => {
            img.classList.add('lazy-loaded');
            // LQIPのblurを解除
            if (img.classList.contains('lqip')) {
              img.classList.remove('lqip');
            }
            // スケルトンオーバーレイを削除
            if (window.SkeletonLoader) {
              const overlay = img.parentElement?.querySelector('.skeleton-image-overlay');
              if (overlay) {
                overlay.classList.add('skeleton-fade-out');
                setTimeout(() => overlay.remove(), 300);
              }
            }
          });
          
          // 監視を停止
          imageObserver.unobserve(img);
        }
      });
    }, {
      // ルートマージンを設定（画像が表示される少し前に読み込み開始）
      rootMargin: '50px 0px',
      threshold: 0.01
    });

    // すべての遅延読み込み対象画像を監視
    const lazyImages = document.querySelectorAll('img[loading="lazy"]');
    lazyImages.forEach(img => {
      // ファーストビューの画像は除外
      const rect = img.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (!isInViewport) {
        // srcをdata-srcに移動
        if (img.src) {
          img.dataset.src = img.src;
          img.removeAttribute('src');
        }
        
        // srcsetをdata-srcsetに移動
        if (img.srcset) {
          img.dataset.srcset = img.srcset;
          img.removeAttribute('srcset');
        }
        
        // プレースホルダー画像を設定（LQIP対応）
        if (img.dataset.lqip) {
          img.src = img.dataset.lqip;
          img.classList.add('lqip');
        } else {
          img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"%3E%3C/svg%3E';
        }
        
        // 監視を開始
        imageObserver.observe(img);
      }
    });
  }

  // パフォーマンス測定（オプション）
  if ('PerformanceObserver' in window) {
    const perfObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'largest-contentful-paint') {
          // 本番環境ではコメントアウト
          // console.log('LCP:', entry.startTime);
        }
      }
    });
    
    perfObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  }
})();