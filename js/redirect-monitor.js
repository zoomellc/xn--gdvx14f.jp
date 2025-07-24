(function() {
  'use strict';

  const RedirectMonitor = {
    // リダイレクトチェーンを検出
    detectRedirectChain: function() {
      var that = this;
      
      // Performance Navigation APIを使用してリダイレクトを検出
      if ('PerformanceNavigationTiming' in window) {
        const navTiming = performance.getEntriesByType('navigation')[0];
        
        if (navTiming && navTiming.redirectCount > 0) {
          const redirectData = {
            redirectCount: navTiming.redirectCount,
            type: navTiming.type,
            finalUrl: window.location.href,
            timestamp: new Date().toISOString()
          };
          
          // リダイレクトが検出された場合、警告を記録
          if (navTiming.redirectCount > 1) {
            console.warn('Redirect chain detected:', redirectData);
            that.reportRedirectChain(redirectData);
          } else {
            console.log('Single redirect detected:', redirectData);
          }
          
          // パフォーマンスメトリクスに記録
          if (window.PerformanceMetrics) {
            window.PerformanceMetrics.saveMetrics({
              type: 'redirect',
              data: redirectData
            });
          }
        }
      }
    },

    // リダイレクトチェーンをレポート
    reportRedirectChain: function(data) {
      // Google Analyticsに送信
      if (window.gtag) {
        window.gtag('event', 'redirect_chain', {
          event_category: 'Performance',
          event_label: 'Redirect Chain Detected',
          value: data.redirectCount,
          custom_map: {
            redirect_count: data.redirectCount,
            final_url: data.finalUrl
          }
        });
      }
      
      // RUMシステムに記録
      if (window.RUM) {
        window.RUM.sendMetric('redirect_chain', data);
      }
    },

    // 一般的なリダイレクトパターンをチェック
    checkCommonPatterns: function() {
      const currentUrl = window.location.href;
      const warnings = [];
      
      // index.htmlで終わるURL
      if (currentUrl.endsWith('index.html')) {
        warnings.push({
          type: 'index_html_suffix',
          message: 'URL ends with index.html - should redirect to directory',
          url: currentUrl
        });
      }
      
      // 二重スラッシュ
      if (currentUrl.includes('//') && !currentUrl.includes('://')) {
        warnings.push({
          type: 'double_slash',
          message: 'URL contains double slashes',
          url: currentUrl
        });
      }
      
      // URLパラメータによる不要なリダイレクト
      const urlParams = new URLSearchParams(window.location.search);
      const suspiciousParams = ['utm_source', 'utm_medium', 'utm_campaign', 'fbclid', 'gclid'];
      const foundParams = [];
      
      suspiciousParams.forEach(function(param) {
        if (urlParams.has(param)) {
          foundParams.push(param);
        }
      });
      
      if (foundParams.length > 0) {
        warnings.push({
          type: 'tracking_params',
          message: 'URL contains tracking parameters that might cause unnecessary redirects',
          params: foundParams,
          url: currentUrl
        });
      }
      
      // 警告をコンソールに表示
      if (warnings.length > 0) {
        console.warn('Potential redirect issues detected:', warnings);
      }
      
      return warnings;
    },

    // リファラーとの比較でリダイレクトを検出
    checkReferrerRedirect: function() {
      if (document.referrer) {
        try {
          const referrerUrl = new URL(document.referrer);
          const currentUrl = new URL(window.location.href);
          
          // 同一ドメイン内でのリダイレクトをチェック
          if (referrerUrl.hostname === currentUrl.hostname) {
            // パスが異なる場合、内部リダイレクトの可能性
            if (referrerUrl.pathname !== currentUrl.pathname) {
              console.log('Internal navigation detected:', {
                from: referrerUrl.pathname,
                to: currentUrl.pathname
              });
              
              // 一般的なリダイレクトパターンをチェック
              const patterns = [
                { from: /\/index\.html$/, to: /\/$/ },
                { from: /([^\/])$/, to: /\1\/$/ }, // trailing slash追加
                { from: /\/+$/, to: /\/$/ } // 複数のtrailing slashを1つに
              ];
              
              patterns.forEach(function(pattern) {
                if (pattern.from.test(referrerUrl.pathname) && 
                    pattern.to.test(currentUrl.pathname)) {
                  console.warn('Common redirect pattern detected:', {
                    pattern: pattern.from.toString(),
                    from: referrerUrl.pathname,
                    to: currentUrl.pathname
                  });
                }
              });
            }
          }
        } catch (e) {
          // 無効なリファラーURLの場合は無視
        }
      }
    },

    // 初期化
    init: function() {
      var that = this;
      
      // ページ読み込み完了後にチェック
      if (document.readyState === 'complete') {
        that.detectRedirectChain();
        that.checkCommonPatterns();
        that.checkReferrerRedirect();
      } else {
        window.addEventListener('load', function() {
          that.detectRedirectChain();
          that.checkCommonPatterns();
          that.checkReferrerRedirect();
        });
      }
    }
  };

  // 開発環境でのみ有効化
  if (window.location.hostname === 'localhost' || 
      window.location.hostname.includes('deploy-preview') ||
      window.location.search.includes('debug=true')) {
    RedirectMonitor.init();
  }
  
  // グローバルに公開（デバッグ用）
  window.RedirectMonitor = RedirectMonitor;
})();