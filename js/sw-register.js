if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Register service worker without timestamp to enable proper caching
    navigator.serviceWorker.register('/js/service-worker.js')
      .then((registration) => {
        console.log('ServiceWorker registration successful with scope: ', registration.scope);
        
        registration.addEventListener('updatefound', () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.addEventListener('statechange', () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  if (confirm('新しいバージョンが利用可能です。更新しますか？')) {
                    installingWorker.postMessage({ type: 'SKIP_WAITING' });
                    window.location.reload();
                  }
                } else {
                  console.log('Content is cached for offline use.');
                }
              }
            });
          }
        });
      })
      .catch((error) => {
        console.log('ServiceWorker registration failed: ', error);
      });
  });
}