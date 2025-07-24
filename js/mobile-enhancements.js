(function() {
  'use strict';

  const MobileEnhancements = {
    config: {
      touchThreshold: 10,
      swipeThreshold: 50,
      doubleTapDelay: 300,
      longPressDelay: 500,
      viewportBreakpoint: 768
    },

    state: {
      isTouch: false,
      orientation: null,
      networkType: null,
      batteryLevel: null,
      reducedMotion: false
    },

    init() {
      if (!this.isMobile()) return;

      this.detectCapabilities();
      this.setupViewportOptimizations();
      this.enhanceTouchInteractions();
      this.optimizePerformance();
      this.setupOrientationHandling();
      this.improveAccessibility();
      this.setupNetworkAwareFeatures();
    },

    isMobile() {
      return window.innerWidth < this.config.viewportBreakpoint || 
             'ontouchstart' in window || 
             navigator.maxTouchPoints > 0;
    },

    detectCapabilities() {
      // Touch capability
      this.state.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Reduced motion preference
      this.state.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      
      // Network information
      if ('connection' in navigator) {
        this.state.networkType = navigator.connection.effectiveType;
      }
      
      // Battery level
      if ('getBattery' in navigator) {
        navigator.getBattery().then(battery => {
          this.state.batteryLevel = battery.level;
          battery.addEventListener('levelchange', () => {
            this.state.batteryLevel = battery.level;
            this.adjustPerformanceSettings();
          });
        });
      }
    },

    setupViewportOptimizations() {
      // Prevent double-tap zoom
      let lastTouchEnd = 0;
      document.addEventListener('touchend', (e) => {
        const now = Date.now();
        if (now - lastTouchEnd <= this.config.doubleTapDelay) {
          e.preventDefault();
        }
        lastTouchEnd = now;
      }, { passive: false });

      // Fix viewport height on iOS
      this.fixViewportHeight();
      window.addEventListener('resize', this.debounce(() => this.fixViewportHeight(), 100));
      window.addEventListener('orientationchange', () => this.fixViewportHeight());
    },

    fixViewportHeight() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
      
      // Add class for viewport detection
      if (window.innerHeight < 500) {
        document.body.classList.add('short-viewport');
      } else {
        document.body.classList.remove('short-viewport');
      }
    },

    enhanceTouchInteractions() {
      // Enhanced touch feedback
      document.addEventListener('touchstart', (e) => {
        const target = e.target.closest('a, button, .touchable');
        if (target) {
          target.classList.add('touch-active');
          
          // Haptic feedback if available
          if ('vibrate' in navigator && !this.state.reducedMotion) {
            navigator.vibrate(10);
          }
        }
      }, { passive: true });

      document.addEventListener('touchend', (e) => {
        const target = e.target.closest('a, button, .touchable');
        if (target) {
          setTimeout(() => {
            target.classList.remove('touch-active');
          }, 100);
        }
      }, { passive: true });

      // Pull to refresh
      this.setupPullToRefresh();
      
      // Swipe navigation
      this.setupSwipeNavigation();
    },

    setupPullToRefresh() {
      let startY = 0;
      let currentY = 0;
      let pulling = false;
      const threshold = 80;
      
      const pullContainer = document.createElement('div');
      pullContainer.className = 'pull-to-refresh';
      pullContainer.innerHTML = `
        <div class="pull-to-refresh-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M21 12a9 9 0 11-6.219-8.56" stroke-width="2" stroke-linecap="round"/>
            <polyline points="21 4 21 12 13 12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
      `;
      document.body.prepend(pullContainer);

      document.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
          startY = e.touches[0].pageY;
          pulling = true;
        }
      }, { passive: true });

      document.addEventListener('touchmove', (e) => {
        if (!pulling) return;
        
        currentY = e.touches[0].pageY;
        const pullDistance = currentY - startY;
        
        if (pullDistance > 0 && window.scrollY === 0) {
          e.preventDefault();
          const opacity = Math.min(pullDistance / threshold, 1);
          const scale = 0.5 + (0.5 * opacity);
          
          pullContainer.style.opacity = opacity;
          pullContainer.style.transform = `translateY(${Math.min(pullDistance * 0.5, 50)}px) scale(${scale})`;
          
          if (pullDistance > threshold) {
            pullContainer.classList.add('ready');
          } else {
            pullContainer.classList.remove('ready');
          }
        }
      }, { passive: false });

      document.addEventListener('touchend', () => {
        if (pulling && currentY - startY > threshold) {
          pullContainer.classList.add('refreshing');
          setTimeout(() => {
            window.location.reload();
          }, 500);
        } else {
          pullContainer.style.opacity = '0';
          pullContainer.style.transform = 'translateY(0) scale(0.5)';
          pullContainer.classList.remove('ready');
        }
        pulling = false;
      }, { passive: true });
    },

    setupSwipeNavigation() {
      let touchStartX = 0;
      let touchStartY = 0;
      const swipeArea = 20; // Edge swipe area in pixels

      document.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      document.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        const deltaX = touchEndX - touchStartX;
        const deltaY = touchEndY - touchStartY;
        
        // Check if it's a horizontal swipe
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > this.config.swipeThreshold) {
          // Right swipe from left edge - go back
          if (deltaX > 0 && touchStartX < swipeArea) {
            if (window.history.length > 1) {
              window.history.back();
            }
          }
          // Left swipe from right edge - go forward
          else if (deltaX < 0 && touchStartX > window.innerWidth - swipeArea) {
            window.history.forward();
          }
        }
      }, { passive: true });
    },

    optimizePerformance() {
      // Lazy load images with Intersection Observer
      this.setupLazyLoading();
      
      // Debounce scroll events
      this.optimizeScrollEvents();
      
      // Reduce animations based on battery/network
      this.adjustPerformanceSettings();
      
      // Preload critical resources
      this.preloadCriticalResources();
    },

    setupLazyLoading() {
      const images = document.querySelectorAll('img[data-src]');
      
      if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              const img = entry.target;
              img.src = img.dataset.src;
              img.classList.add('lazy-loaded');
              observer.unobserve(img);
            }
          });
        }, {
          rootMargin: '50px 0px',
          threshold: 0.01
        });

        images.forEach(img => imageObserver.observe(img));
      } else {
        // Fallback for older browsers
        images.forEach(img => {
          img.src = img.dataset.src;
        });
      }
    },

    optimizeScrollEvents() {
      let scrollTimer;
      let isScrolling = false;

      window.addEventListener('scroll', () => {
        if (!isScrolling) {
          document.body.classList.add('is-scrolling');
          isScrolling = true;
        }

        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => {
          document.body.classList.remove('is-scrolling');
          isScrolling = false;
        }, 150);
      }, { passive: true });
    },

    adjustPerformanceSettings() {
      const lowPowerMode = this.state.batteryLevel < 0.2;
      const slowNetwork = this.state.networkType === '2g' || this.state.networkType === 'slow-2g';
      
      if (lowPowerMode || slowNetwork || this.state.reducedMotion) {
        document.body.classList.add('reduce-animations');
        
        // Disable non-essential features
        if (window.MobileGestures) {
          window.MobileGestures.disable();
        }
      } else {
        document.body.classList.remove('reduce-animations');
      }
    },

    preloadCriticalResources() {
      // Preload next page links on hover/touch
      const links = document.querySelectorAll('a[href^="/"]');
      
      links.forEach(link => {
        link.addEventListener('touchstart', () => {
          const href = link.getAttribute('href');
          if (href && !document.querySelector(`link[rel="prefetch"][href="${href}"]`)) {
            const prefetch = document.createElement('link');
            prefetch.rel = 'prefetch';
            prefetch.href = href;
            document.head.appendChild(prefetch);
          }
        }, { passive: true });
      });
    },

    setupOrientationHandling() {
      const updateOrientation = () => {
        const orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        this.state.orientation = orientation;
        document.body.setAttribute('data-orientation', orientation);
        
        // Adjust layout for landscape on small devices
        if (orientation === 'landscape' && window.innerHeight < 500) {
          document.body.classList.add('landscape-compact');
        } else {
          document.body.classList.remove('landscape-compact');
        }
      };

      updateOrientation();
      window.addEventListener('orientationchange', updateOrientation);
      window.addEventListener('resize', this.debounce(updateOrientation, 100));
    },

    improveAccessibility() {
      // Add touch-mode class for better touch targets
      if (this.state.isTouch) {
        document.body.classList.add('touch-mode');
      }

      // Improve focus visibility on mobile
      document.addEventListener('touchstart', () => {
        document.body.classList.add('touch-input');
      }, { once: true });

      document.addEventListener('keydown', () => {
        document.body.classList.remove('touch-input');
      });

      // Add skip links for mobile screen readers
      this.addMobileSkipLinks();
    },

    addMobileSkipLinks() {
      const skipLinks = document.createElement('div');
      skipLinks.className = 'mobile-skip-links';
      skipLinks.innerHTML = `
        <a href="#main-content" class="skip-link">メインコンテンツへ</a>
        <a href="#mobile-nav" class="skip-link">ナビゲーションへ</a>
      `;
      document.body.prepend(skipLinks);
    },

    setupNetworkAwareFeatures() {
      if ('connection' in navigator) {
        navigator.connection.addEventListener('change', () => {
          this.state.networkType = navigator.connection.effectiveType;
          this.adjustPerformanceSettings();
          
          // Notify user of network change
          if (this.state.networkType === 'offline') {
            this.showToast('オフラインです', 'warning');
          }
        });
      }

      // Online/Offline detection
      window.addEventListener('online', () => {
        this.showToast('オンラインに戻りました', 'success');
      });

      window.addEventListener('offline', () => {
        this.showToast('オフラインになりました', 'warning');
      });
    },

    showToast(message, type = 'info') {
      const toast = document.createElement('div');
      toast.className = `mobile-toast mobile-toast-${type}`;
      toast.textContent = message;
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      
      document.body.appendChild(toast);
      
      requestAnimationFrame(() => {
        toast.classList.add('show');
      });

      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          document.body.removeChild(toast);
        }, 300);
      }, 3000);
    },

    debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }
  };

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MobileEnhancements.init());
  } else {
    MobileEnhancements.init();
  }

  // Expose for external use
  window.MobileEnhancements = MobileEnhancements;
})();