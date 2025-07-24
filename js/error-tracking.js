(function() {
  'use strict';

  const ErrorTracker = {
    errors: [],
    maxErrors: 50,
    sessionId: null,
    
    init: function() {
      this.sessionId = this.getSessionId();
      this.setupErrorHandlers();
      this.trackConsoleErrors();
      this.trackNetworkErrors();
      this.setupErrorReporting();
    },

    getSessionId: function() {
      return sessionStorage.getItem('errorTrackingSession') || this.createSession();
    },

    createSession: function() {
      const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2);
      sessionStorage.setItem('errorTrackingSession', sessionId);
      return sessionId;
    },

    setupErrorHandlers: function() {
      const self = this;

      // JavaScript errors
      window.addEventListener('error', function(event) {
        self.trackError({
          type: 'javascript',
          message: event.message,
          source: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          stack: event.error ? event.error.stack : null,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        });
      });

      // Promise rejections
      window.addEventListener('unhandledrejection', function(event) {
        self.trackError({
          type: 'unhandled_promise',
          message: event.reason ? event.reason.toString() : 'Unhandled Promise Rejection',
          reason: event.reason,
          promise: event.promise,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        });
      });
    },

    trackConsoleErrors: function() {
      const self = this;
      const originalError = console.error;

      console.error = function() {
        const args = Array.prototype.slice.call(arguments);
        const message = args.map(arg => {
          if (typeof arg === 'object') {
            try {
              return JSON.stringify(arg);
            } catch (e) {
              return arg.toString();
            }
          }
          return arg;
        }).join(' ');

        self.trackError({
          type: 'console',
          message: message,
          timestamp: Date.now(),
          url: window.location.href
        });

        // Call original console.error
        originalError.apply(console, arguments);
      };
    },

    trackNetworkErrors: function() {
      const self = this;

      // Monitor fetch API
      const originalFetch = window.fetch;
      window.fetch = function() {
        const args = arguments;
        return originalFetch.apply(this, args)
          .then(function(response) {
            if (!response.ok) {
              self.trackError({
                type: 'network',
                subtype: 'fetch',
                status: response.status,
                statusText: response.statusText,
                url: args[0],
                timestamp: Date.now(),
                pageUrl: window.location.href
              });
            }
            return response;
          })
          .catch(function(error) {
            self.trackError({
              type: 'network',
              subtype: 'fetch_failed',
              message: error.message,
              url: args[0],
              timestamp: Date.now(),
              pageUrl: window.location.href
            });
            throw error;
          });
      };

      // Monitor XMLHttpRequest
      const originalOpen = XMLHttpRequest.prototype.open;
      const originalSend = XMLHttpRequest.prototype.send;

      XMLHttpRequest.prototype.open = function() {
        this._url = arguments[1];
        this._method = arguments[0];
        originalOpen.apply(this, arguments);
      };

      XMLHttpRequest.prototype.send = function() {
        const xhr = this;
        const onreadystatechange = xhr.onreadystatechange;

        xhr.onreadystatechange = function() {
          if (xhr.readyState === 4 && xhr.status >= 400) {
            self.trackError({
              type: 'network',
              subtype: 'xhr',
              status: xhr.status,
              statusText: xhr.statusText,
              method: xhr._method,
              url: xhr._url,
              timestamp: Date.now(),
              pageUrl: window.location.href
            });
          }

          if (onreadystatechange) {
            onreadystatechange.apply(xhr, arguments);
          }
        };

        originalSend.apply(this, arguments);
      };
    },

    trackError: function(errorData) {
      // Add context information
      errorData.sessionId = this.sessionId;
      errorData.viewport = {
        width: window.innerWidth,
        height: window.innerHeight
      };
      errorData.screen = {
        width: window.screen.width,
        height: window.screen.height
      };
      
      // Add performance context
      if (window.performance && window.performance.memory) {
        errorData.memory = {
          used: Math.round(window.performance.memory.usedJSHeapSize / 1048576),
          total: Math.round(window.performance.memory.totalJSHeapSize / 1048576),
          limit: Math.round(window.performance.memory.jsHeapSizeLimit / 1048576)
        };
      }

      // Store error
      this.errors.push(errorData);
      
      // Limit stored errors
      if (this.errors.length > this.maxErrors) {
        this.errors.shift();
      }

      // Save to localStorage
      this.saveErrors();

      // Send error report
      this.reportError(errorData);

      // Log in development
      if (window.location.hostname === 'localhost') {
        console.warn('Error tracked:', errorData);
      }
    },

    saveErrors: function() {
      try {
        localStorage.setItem('trackedErrors', JSON.stringify(this.errors));
      } catch (e) {
        // Handle quota exceeded
        console.warn('Error storage quota exceeded');
      }
    },

    loadErrors: function() {
      try {
        const stored = localStorage.getItem('trackedErrors');
        if (stored) {
          this.errors = JSON.parse(stored);
        }
      } catch (e) {
        console.warn('Failed to load stored errors');
      }
    },

    reportError: function(errorData) {
      // Send to Google Analytics if available
      if (window.gtag) {
        window.gtag('event', 'exception', {
          description: errorData.message || errorData.type,
          fatal: errorData.type === 'javascript',
          error_type: errorData.type,
          error_source: errorData.source || 'unknown'
        });
      }

      // Group similar errors
      const errorKey = this.getErrorKey(errorData);
      const errorCount = this.getErrorCount(errorKey);
      
      // Only report first occurrence and milestones
      if (errorCount === 1 || errorCount === 10 || errorCount === 100) {
        this.sendErrorReport(errorData, errorCount);
      }
    },

    getErrorKey: function(errorData) {
      return [
        errorData.type,
        errorData.message,
        errorData.source,
        errorData.lineno
      ].filter(Boolean).join('|');
    },

    getErrorCount: function(key) {
      const counts = JSON.parse(sessionStorage.getItem('errorCounts') || '{}');
      counts[key] = (counts[key] || 0) + 1;
      sessionStorage.setItem('errorCounts', JSON.stringify(counts));
      return counts[key];
    },

    sendErrorReport: function(errorData, count) {
      // This would send to your error tracking service
      // For now, just log it
      const report = {
        error: errorData,
        count: count,
        timestamp: Date.now()
      };

      if (window.location.hostname !== 'localhost') {
        // In production, you would send this to your error tracking endpoint
        // fetch('/api/errors', { method: 'POST', body: JSON.stringify(report) });
      }
    },

    setupErrorReporting: function() {
      const self = this;

      // Send error summary before page unload
      window.addEventListener('beforeunload', function() {
        if (self.errors.length > 0) {
          const summary = {
            sessionId: self.sessionId,
            errorCount: self.errors.length,
            errors: self.errors.slice(-10), // Last 10 errors
            timestamp: Date.now()
          };

          // Use sendBeacon for reliable delivery
          if (navigator.sendBeacon) {
            const blob = new Blob([JSON.stringify(summary)], { type: 'application/json' });
            // navigator.sendBeacon('/api/error-summary', blob);
          }
        }
      });
    },

    // Public API
    getErrors: function() {
      return this.errors;
    },

    clearErrors: function() {
      this.errors = [];
      localStorage.removeItem('trackedErrors');
      sessionStorage.removeItem('errorCounts');
    },

    getErrorSummary: function() {
      const summary = {};
      
      this.errors.forEach(function(error) {
        const type = error.type;
        summary[type] = summary[type] || { count: 0, errors: [] };
        summary[type].count++;
        
        if (summary[type].errors.length < 5) {
          summary[type].errors.push({
            message: error.message,
            timestamp: error.timestamp
          });
        }
      });

      return summary;
    }
  };

  // Initialize error tracking
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      ErrorTracker.init();
    });
  } else {
    ErrorTracker.init();
  }

  // Expose ErrorTracker for debugging
  window.ErrorTracker = ErrorTracker;
})();