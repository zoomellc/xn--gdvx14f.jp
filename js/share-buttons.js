(function() {
  'use strict';

  const ShareButtons = {
    init: function() {
      this.setupShareButtons();
    },

    setupShareButtons: function() {
      const shareContainer = document.getElementById('share-buttons');
      if (!shareContainer) return;

      const url = encodeURIComponent(window.location.href);
      const title = encodeURIComponent(document.title);

      // Web Share APIが利用可能かチェック
      if (navigator.share) {
        // ネイティブシェアボタンを追加
        const nativeShareBtn = document.getElementById('native-share-btn');
        if (nativeShareBtn) {
          nativeShareBtn.style.display = 'inline-flex';
          nativeShareBtn.addEventListener('click', async function() {
            try {
              await navigator.share({
                title: document.title,
                text: document.querySelector('meta[name="description"]')?.content || '',
                url: window.location.href
              });
            } catch (err) {
              console.log('Share failed:', err);
            }
          });
        }
      }

      // Twitter シェアボタン
      const twitterBtn = document.getElementById('twitter-share-btn');
      if (twitterBtn) {
        twitterBtn.href = `https://twitter.com/intent/tweet?url=${url}&text=${title}`;
      }

      // Facebook シェアボタン
      const facebookBtn = document.getElementById('facebook-share-btn');
      if (facebookBtn) {
        facebookBtn.href = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
      }

      // LINE シェアボタン
      const lineBtn = document.getElementById('line-share-btn');
      if (lineBtn) {
        lineBtn.href = `https://social-plugins.line.me/lineit/share?url=${url}`;
      }

      // はてなブックマーク
      const hatenaBtn = document.getElementById('hatena-share-btn');
      if (hatenaBtn) {
        hatenaBtn.href = `https://b.hatena.ne.jp/entry/${window.location.href}`;
      }

      // コピーボタン
      const copyBtn = document.getElementById('copy-link-btn');
      if (copyBtn) {
        copyBtn.addEventListener('click', async function() {
          try {
            await navigator.clipboard.writeText(window.location.href);
            const originalText = this.querySelector('.copy-text').textContent;
            this.querySelector('.copy-text').textContent = 'コピーしました！';
            this.classList.add('copied');
            
            setTimeout(() => {
              this.querySelector('.copy-text').textContent = originalText;
              this.classList.remove('copied');
            }, 2000);
          } catch (err) {
            console.error('Failed to copy:', err);
          }
        });
      }
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      ShareButtons.init();
    });
  } else {
    ShareButtons.init();
  }

  window.ShareButtons = ShareButtons;
})();