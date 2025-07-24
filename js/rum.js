(function() {
  'use strict';

  const RUM = {
    sessionId: null,
    startTime: Date.now(),
    metrics: {
      pageViews: 0,
      interactions: 0,
      errors: 0,
      resourceTimings: []
    },

    // Initialize RUM
    init: function() {
      this.sessionId = this.getOrCreateSessionId();
      this.trackPageView();
      this.setupEventListeners();
      this.trackResourceTimings();
      this.trackErrors();
      this.trackUserEngagement();
    },

    // Get or create session ID
    getOrCreateSessionId: function() {
      let sessionId = sessionStorage.getItem('rumSessionId');
      if (!sessionId) {
        sessionId = this.generateId();
        sessionStorage.setItem('rumSessionId', sessionId);
        sessionStorage.setItem('rumSessionStart', Date.now());
      }
      return sessionId;
    },

    // Generate unique ID
    generateId: function() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Track page views
    trackPageView: function() {
      this.metrics.pageViews++;
      const pageData = {
        url: window.location.href,
        title: document.title,
        referrer: document.referrer,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        screen: {
          width: window.screen.width,
          height: window.screen.height
        },
        connection: this.getConnectionInfo()
      };

      this.sendMetric('pageview', pageData);
    },

    // Get connection information
    getConnectionInfo: function() {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        return {
          type: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData || false
        };
      }
      return null;
    },

    // Setup event listeners
    setupEventListeners: function() {
      const self = this;

      // Track clicks
      document.addEventListener('click', function(e) {
        self.trackInteraction('click', e.target);
      });

      // Track scroll depth
      let maxScroll = 0;
      let scrollTimer;
      window.addEventListener('scroll', function() {
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(function() {
          const scrollPercentage = Math.round((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100);
          if (scrollPercentage > maxScroll) {
            maxScroll = scrollPercentage;
            self.sendMetric('scroll', {
              depth: maxScroll,
              url: window.location.href
            });
          }
        }, 100);
      });

      // Track page visibility
      document.addEventListener('visibilitychange', function() {
        self.sendMetric('visibility', {
          state: document.visibilityState,
          hiddenTime: document.hidden ? Date.now() : null
        });
      });

      // Track before unload
      window.addEventListener('beforeunload', function() {
        self.sendMetric('session', {
          duration: Date.now() - self.startTime,
          pageViews: self.metrics.pageViews,
          interactions: self.metrics.interactions,
          errors: self.metrics.errors
        });
      });
    },

    // Track user interactions
    trackInteraction: function(type, target) {
      this.metrics.interactions++;
      const interactionData = {
        type: type,
        element: target.tagName,
        className: target.className,
        id: target.id,
        text: target.textContent ? target.textContent.substring(0, 50) : '',
        timestamp: Date.now(),
        url: window.location.href
      };

      this.sendMetric('interaction', interactionData);
    },

    // Track resource timings
    trackResourceTimings: function() {
      const self = this;
      
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver(function(list) {
          list.getEntries().forEach(function(entry) {
            if (entry.entryType === 'resource') {
              const timing = {
                name: entry.name,
                duration: Math.round(entry.duration),
                size: entry.transferSize || 0,
                type: self.getResourceType(entry.name),
                timestamp: Date.now()
              };
              
              self.metrics.resourceTimings.push(timing);
              
              // Send slow resource warnings
              if (timing.duration > 1000) {
                self.sendMetric('slow_resource', timing);
              }
            }
          });
        });
        
        observer.observe({ entryTypes: ['resource'] });
      }
    },

    // Get resource type from URL
    getResourceType: function(url) {
      const ext = url.split('.').pop().split('?')[0].toLowerCase();
      const types = {
        'js': 'script',
        'css': 'style',
        'jpg': 'image',
        'jpeg': 'image',
        'png': 'image',
        'webp': 'image',
        'svg': 'image',
        'woff': 'font',
        'woff2': 'font',
        'ttf': 'font'
      };
      return types[ext] || 'other';
    },

    // Track JavaScript errors
    trackErrors: function() {
      const self = this;
      
      window.addEventListener('error', function(e) {
        self.metrics.errors++;
        const errorData = {
          message: e.message,
          source: e.filename,
          line: e.lineno,
          column: e.colno,
          stack: e.error ? e.error.stack : '',
          timestamp: Date.now(),
          url: window.location.href
        };
        
        self.sendMetric('error', errorData);
      });

      window.addEventListener('unhandledrejection', function(e) {
        self.metrics.errors++;
        const errorData = {
          message: 'Unhandled Promise Rejection',
          reason: e.reason,
          timestamp: Date.now(),
          url: window.location.href
        };
        
        self.sendMetric('error', errorData);
      });
    },

    // Track user engagement
    trackUserEngagement: function() {
      const self = this;
      let engagementTime = 0;
      let lastActiveTime = Date.now();
      let isActive = true;

      function updateEngagement() {
        if (isActive) {
          engagementTime += Date.now() - lastActiveTime;
        }
        lastActiveTime = Date.now();
      }

      // User is active
      ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(function(event) {
        document.addEventListener(event, function() {
          if (!isActive) {
            isActive = true;
            lastActiveTime = Date.now();
          }
        });
      });

      // User might be inactive
      let inactivityTimer;
      function resetInactivityTimer() {
        clearTimeout(inactivityTimer);
        inactivityTimer = setTimeout(function() {
          if (isActive) {
            updateEngagement();
            isActive = false;
          }
        }, 30000); // 30 seconds of inactivity
      }

      ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'].forEach(function(event) {
        document.addEventListener(event, resetInactivityTimer);
      });

      // Send engagement time periodically
      setInterval(function() {
        updateEngagement();
        if (engagementTime > 0) {
          self.sendMetric('engagement', {
            time: engagementTime,
            url: window.location.href
          });
        }
      }, 60000); // Every minute
    },

    // Send metrics
    sendMetric: function(type, data) {
      const metric = {
        type: type,
        data: data,
        sessionId: this.sessionId,
        timestamp: Date.now()
      };

      // Log to console in development
      if (window.location.hostname === 'localhost') {
        console.log('RUM Metric:', metric);
      }

      // Send to analytics endpoint
      if (window.gtag) {
        window.gtag('event', 'rum_' + type, {
          event_category: 'RUM',
          event_label: JSON.stringify(data),
          value: data.value || 0,
          non_interaction: true
        });
      }

      // Store in localStorage for debugging
      this.storeMetric(metric);
    },

    // Store metrics locally
    storeMetric: function(metric) {
      const key = 'rumMetrics';
      let metrics = JSON.parse(localStorage.getItem(key) || '[]');
      
      metrics.push(metric);
      
      // Keep only last 50 metrics
      if (metrics.length > 50) {
        metrics = metrics.slice(-50);
      }
      
      try {
        localStorage.setItem(key, JSON.stringify(metrics));
      } catch (e) {
        // Handle quota exceeded
        console.warn('RUM storage quota exceeded');
      }
    },

    // Get stored metrics (for debugging)
    getMetrics: function() {
      return JSON.parse(localStorage.getItem('rumMetrics') || '[]');
    },

    // Clear stored metrics
    clearMetrics: function() {
      localStorage.removeItem('rumMetrics');
    }
  };

  // Initialize RUM when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      RUM.init();
    });
  } else {
    RUM.init();
  }

  // Expose RUM object for debugging
  window.RUM = RUM;
})();