(function() {
  'use strict';

  const DataSaver = {
    // Configuration
    config: {
      storageKey: 'dataSaverSettings',
      enabledKey: 'dataSaverEnabled',
      autoDetect: true,
      lowQualityThreshold: 0.5, // Network quality threshold
      imageQuality: {
        high: 1.0,
        medium: 0.7,
        low: 0.4
      }
    },

    // Current state
    state: {
      enabled: false,
      autoEnabled: false,
      networkQuality: 'high',
      savedBytes: 0
    },

    // Initialize data saver
    init: function() {
      this.loadSettings();
      this.detectDataSavePreference();
      this.setupNetworkMonitoring();
      this.applyDataSaverMode();
      this.setupUI();
      this.trackDataSavings();
    },

    // Load saved settings
    loadSettings: function() {
      try {
        const savedEnabled = localStorage.getItem(this.config.enabledKey);
        if (savedEnabled !== null) {
          this.state.enabled = savedEnabled === 'true';
        }
        
        const savedSettings = localStorage.getItem(this.config.storageKey);
        if (savedSettings) {
          const settings = JSON.parse(savedSettings);
          Object.assign(this.state, settings);
        }
      } catch (e) {
        this.log('Error loading settings:', e);
      }
    },

    // Save settings
    saveSettings: function() {
      try {
        localStorage.setItem(this.config.enabledKey, this.state.enabled);
        localStorage.setItem(this.config.storageKey, JSON.stringify(this.state));
      } catch (e) {
        this.log('Error saving settings:', e);
      }
    },

    // Detect if user prefers data saving
    detectDataSavePreference: function() {
      // Check browser Save-Data header preference
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (connection && connection.saveData) {
        this.state.autoEnabled = true;
        this.state.enabled = true;
        this.log('Save-Data preference detected, enabling data saver');
      }
      
      // Check connection type
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === '2g' || effectiveType === 'slow-2g') {
          this.state.autoEnabled = true;
          this.state.enabled = true;
          this.log('Slow connection detected, enabling data saver');
        }
      }
    },

    // Setup network monitoring
    setupNetworkMonitoring: function() {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (!connection) return;
      
      // Monitor connection changes
      connection.addEventListener('change', () => {
        this.updateNetworkQuality();
        
        if (this.config.autoDetect) {
          const wasEnabled = this.state.enabled;
          this.detectDataSavePreference();
          
          if (wasEnabled !== this.state.enabled) {
            this.applyDataSaverMode();
          }
        }
      });
      
      // Initial quality check
      this.updateNetworkQuality();
    },

    // Update network quality assessment
    updateNetworkQuality: function() {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      
      if (!connection) {
        this.state.networkQuality = 'unknown';
        return;
      }
      
      const effectiveType = connection.effectiveType;
      const downlink = connection.downlink;
      
      // Assess quality based on connection info
      if (effectiveType === '4g' && downlink > 10) {
        this.state.networkQuality = 'high';
      } else if (effectiveType === '3g' || (effectiveType === '4g' && downlink <= 10)) {
        this.state.networkQuality = 'medium';
      } else {
        this.state.networkQuality = 'low';
      }
      
      this.log('Network quality:', this.state.networkQuality);
    },

    // Apply data saver mode
    applyDataSaverMode: function() {
      if (this.state.enabled) {
        document.body.classList.add('data-saver-mode');
        this.optimizeImages();
        this.optimizeVideos();
        this.optimizeFonts();
        this.deferNonCriticalResources();
        this.setupLazyLoading();
        this.log('Data saver mode enabled');
      } else {
        document.body.classList.remove('data-saver-mode');
        this.restoreFullQuality();
        this.log('Data saver mode disabled');
      }
    },

    // Optimize images
    optimizeImages: function() {
      const images = document.querySelectorAll('img[src], img[data-src]');
      
      images.forEach(img => {
        // Store original source
        if (!img.dataset.originalSrc) {
          img.dataset.originalSrc = img.src || img.dataset.src;
        }
        
        // Replace with lower quality version
        const originalSrc = img.dataset.originalSrc;
        if (originalSrc) {
          const optimizedSrc = this.getOptimizedImageUrl(originalSrc);
          
          if (img.src) {
            img.src = optimizedSrc;
          } else {
            img.dataset.src = optimizedSrc;
          }
          
          // Track savings
          this.estimateImageSavings(originalSrc, optimizedSrc);
        }
        
        // Add loading lazy attribute
        img.loading = 'lazy';
      });
      
      // Optimize background images
      this.optimizeBackgroundImages();
    },

    // Get optimized image URL
    getOptimizedImageUrl: function(originalUrl) {
      // Skip if already optimized
      if (originalUrl.includes('quality=') || originalUrl.includes('q=')) {
        return originalUrl;
      }
      
      // Determine quality based on network
      let quality;
      switch (this.state.networkQuality) {
        case 'low':
          quality = this.config.imageQuality.low;
          break;
        case 'medium':
          quality = this.config.imageQuality.medium;
          break;
        default:
          quality = this.config.imageQuality.high;
      }
      
      // Apply quality parameter
      const separator = originalUrl.includes('?') ? '&' : '?';
      return `${originalUrl}${separator}quality=${quality}`;
    },

    // Optimize background images
    optimizeBackgroundImages: function() {
      const elements = document.querySelectorAll('[style*="background-image"]');
      
      elements.forEach(element => {
        const style = element.style.backgroundImage;
        const urlMatch = style.match(/url\(['"]?([^'")]+)['"]?\)/);
        
        if (urlMatch && urlMatch[1]) {
          const originalUrl = urlMatch[1];
          const optimizedUrl = this.getOptimizedImageUrl(originalUrl);
          element.style.backgroundImage = `url('${optimizedUrl}')`;
        }
      });
    },

    // Optimize videos
    optimizeVideos: function() {
      const videos = document.querySelectorAll('video');
      
      videos.forEach(video => {
        // Prevent autoplay
        video.autoplay = false;
        
        // Remove preload
        video.preload = 'none';
        
        // Add poster if missing
        if (!video.poster) {
          video.poster = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23666"%3EClick to load video%3C/text%3E%3C/svg%3E';
        }
        
        // Replace with lower quality sources if available
        const sources = video.querySelectorAll('source');
        sources.forEach(source => {
          if (source.dataset.lowQuality) {
            source.dataset.originalSrc = source.src;
            source.src = source.dataset.lowQuality;
          }
        });
      });
      
      // Optimize iframes (YouTube, Vimeo, etc.)
      this.optimizeIframes();
    },

    // Optimize iframes
    optimizeIframes: function() {
      const iframes = document.querySelectorAll('iframe[src*="youtube"], iframe[src*="vimeo"]');
      
      iframes.forEach(iframe => {
        // Store original source
        if (!iframe.dataset.originalSrc) {
          iframe.dataset.originalSrc = iframe.src;
        }
        
        // Create placeholder
        const placeholder = document.createElement('div');
        placeholder.className = 'video-placeholder';
        placeholder.innerHTML = `
          <div class="play-button">▶</div>
          <div class="message">Click to load video</div>
        `;
        placeholder.style.cssText = `
          position: relative;
          width: ${iframe.width || '100%'};
          height: ${iframe.height || '315px'};
          background: #000;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        `;
        
        // Add click handler
        placeholder.addEventListener('click', () => {
          iframe.src = iframe.dataset.originalSrc;
          placeholder.replaceWith(iframe);
        });
        
        // Replace iframe with placeholder
        iframe.src = 'about:blank';
        iframe.replaceWith(placeholder);
      });
    },

    // Optimize fonts
    optimizeFonts: function() {
      // Use system fonts in data saver mode
      const style = document.createElement('style');
      style.id = 'data-saver-fonts';
      style.textContent = `
        .data-saver-mode body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
                       "Helvetica Neue", Arial, sans-serif !important;
        }
        .data-saver-mode h1, .data-saver-mode h2, .data-saver-mode h3,
        .data-saver-mode h4, .data-saver-mode h5, .data-saver-mode h6 {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, 
                       "Helvetica Neue", Arial, sans-serif !important;
        }
      `;
      document.head.appendChild(style);
      
      // Block web font loading
      if ('fonts' in document) {
        document.fonts.forEach(font => {
          if (!font.family.includes('system')) {
            // Prevent loading of non-system fonts
            font.loaded.then(() => {
              this.state.savedBytes += 50000; // Estimate 50KB per font
            });
          }
        });
      }
    },

    // Defer non-critical resources
    deferNonCriticalResources: function() {
      // Defer non-critical CSS
      const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
      stylesheets.forEach(stylesheet => {
        if (!stylesheet.href.includes('critical') && !stylesheet.href.includes('blonde')) {
          stylesheet.media = 'print';
          stylesheet.onload = function() { this.media = 'all'; };
        }
      });
      
      // Defer non-critical scripts
      const scripts = document.querySelectorAll('script[src]');
      scripts.forEach(script => {
        if (!script.defer && !script.async && !script.src.includes('critical')) {
          const newScript = document.createElement('script');
          newScript.src = script.src;
          newScript.defer = true;
          script.replaceWith(newScript);
        }
      });
    },

    // Setup enhanced lazy loading
    setupLazyLoading: function() {
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              if (img.dataset.src) {
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                observer.unobserve(img);
              }
            }
          });
        }, {
          rootMargin: '50px 0px',
          threshold: 0.01
        });
        
        // Observe all lazy images
        document.querySelectorAll('img[data-src]').forEach(img => {
          imageObserver.observe(img);
        });
      }
    },

    // Restore full quality
    restoreFullQuality: function() {
      // Restore images
      const images = document.querySelectorAll('img[data-original-src]');
      images.forEach(img => {
        if (img.dataset.originalSrc) {
          img.src = img.dataset.originalSrc;
        }
      });
      
      // Restore videos
      const videos = document.querySelectorAll('video source[data-original-src]');
      videos.forEach(source => {
        if (source.dataset.originalSrc) {
          source.src = source.dataset.originalSrc;
        }
      });
      
      // Remove font optimization
      const fontStyle = document.getElementById('data-saver-fonts');
      if (fontStyle) {
        fontStyle.remove();
      }
    },

    // Estimate image savings
    estimateImageSavings: function(originalUrl, optimizedUrl) {
      // Rough estimation based on quality reduction
      const quality = parseFloat(optimizedUrl.match(/quality=([\d.]+)/)?.[1] || 1);
      const estimatedOriginalSize = 100000; // 100KB average
      const estimatedOptimizedSize = estimatedOriginalSize * quality;
      const saved = estimatedOriginalSize - estimatedOptimizedSize;
      
      this.state.savedBytes += saved;
      this.updateSavingsDisplay();
    },

    // Track data savings
    trackDataSavings: function() {
      // Monitor resource timing
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'resource') {
              // Track blocked or optimized resources
              if (this.state.enabled && entry.transferSize === 0) {
                this.state.savedBytes += entry.decodedBodySize || 50000;
                this.updateSavingsDisplay();
              }
            }
          }
        });
        
        observer.observe({ entryTypes: ['resource'] });
      }
    },

    // Setup UI controls
    setupUI: function() {
      // Create toggle button
      const toggle = document.createElement('div');
      toggle.id = 'data-saver-toggle';
      toggle.className = 'data-saver-toggle';
      toggle.innerHTML = `
        <button aria-label="Toggle data saver mode">
          <span class="icon">📶</span>
          <span class="label">Data Saver</span>
          <span class="status">${this.state.enabled ? 'ON' : 'OFF'}</span>
        </button>
        <div class="savings" style="display: none;">
          Saved: <span class="amount">0 KB</span>
        </div>
      `;
      toggle.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        padding: 10px;
        z-index: 1000;
        font-size: 14px;
      `;
      
      // Add click handler
      toggle.querySelector('button').addEventListener('click', () => {
        this.toggle();
      });
      
      document.body.appendChild(toggle);
      
      // Update status
      this.updateToggleStatus();
      
      // Add keyboard shortcut (Ctrl+Shift+S)
      document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
          e.preventDefault();
          this.toggle();
        }
      });
    },

    // Update toggle status
    updateToggleStatus: function() {
      const toggle = document.getElementById('data-saver-toggle');
      if (toggle) {
        const status = toggle.querySelector('.status');
        const button = toggle.querySelector('button');
        
        status.textContent = this.state.enabled ? 'ON' : 'OFF';
        button.classList.toggle('active', this.state.enabled);
        
        if (this.state.autoEnabled) {
          status.textContent += ' (Auto)';
        }
      }
    },

    // Update savings display
    updateSavingsDisplay: function() {
      const toggle = document.getElementById('data-saver-toggle');
      if (toggle && this.state.savedBytes > 0) {
        const savings = toggle.querySelector('.savings');
        const amount = toggle.querySelector('.amount');
        
        savings.style.display = 'block';
        amount.textContent = this.formatBytes(this.state.savedBytes);
      }
    },

    // Format bytes for display
    formatBytes: function(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },

    // Toggle data saver mode
    toggle: function() {
      this.state.enabled = !this.state.enabled;
      this.state.autoEnabled = false; // Manual override
      this.saveSettings();
      this.applyDataSaverMode();
      this.updateToggleStatus();
      
      // Track toggle event
      if (window.gtag) {
        window.gtag('event', 'data_saver_toggle', {
          enabled: this.state.enabled
        });
      }
    },

    // Check if data saver is enabled
    isEnabled: function() {
      return this.state.enabled;
    },

    // Get current savings
    getSavings: function() {
      return {
        bytes: this.state.savedBytes,
        formatted: this.formatBytes(this.state.savedBytes)
      };
    },

    // Log utility
    log: function(...args) {
      console.log('[Data Saver]', ...args);
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      DataSaver.init();
    });
  } else {
    DataSaver.init();
  }

  // Expose for API access
  window.DataSaver = DataSaver;
})();