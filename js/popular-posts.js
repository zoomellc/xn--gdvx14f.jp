(function() {
  'use strict';

  const PopularPosts = {
    storageKey: 'popularPostsData',
    maxEntries: 50,
    
    init: function() {
      this.trackPageView();
      this.cleanupOldData();
    },
    
    trackPageView: function() {
      if (window.location.pathname === '/' || 
          window.location.pathname.includes('/categories/') || 
          window.location.pathname.includes('/tags/')) {
        return;
      }
      
      const pageData = {
        path: window.location.pathname,
        title: document.title,
        timestamp: Date.now()
      };
      
      this.updatePageViews(pageData);
    },
    
    updatePageViews: function(pageData) {
      let data = this.getStoredData();
      
      const existingIndex = data.findIndex(item => item.path === pageData.path);
      
      if (existingIndex !== -1) {
        data[existingIndex].views = (data[existingIndex].views || 0) + 1;
        data[existingIndex].lastViewed = pageData.timestamp;
        data[existingIndex].title = pageData.title;
      } else {
        data.push({
          path: pageData.path,
          title: pageData.title,
          views: 1,
          firstViewed: pageData.timestamp,
          lastViewed: pageData.timestamp
        });
      }
      
      data.sort((a, b) => b.views - a.views);
      
      if (data.length > this.maxEntries) {
        data = data.slice(0, this.maxEntries);
      }
      
      this.saveData(data);
    },
    
    getStoredData: function() {
      try {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
      } catch (e) {
        console.error('Failed to parse popular posts data:', e);
        return [];
      }
    },
    
    saveData: function(data) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
      } catch (e) {
        console.error('Failed to save popular posts data:', e);
      }
    },
    
    cleanupOldData: function() {
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      let data = this.getStoredData();
      
      data = data.filter(item => item.lastViewed > thirtyDaysAgo);
      
      this.saveData(data);
    },
    
    getPopularPosts: function(limit = 5) {
      const data = this.getStoredData();
      return data.slice(0, limit);
    },
    
    resetData: function() {
      localStorage.removeItem(this.storageKey);
      console.log('Popular posts data has been reset');
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      PopularPosts.init();
    });
  } else {
    PopularPosts.init();
  }
  
  window.PopularPosts = PopularPosts;
})();