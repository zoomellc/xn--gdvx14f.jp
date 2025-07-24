(function() {
  'use strict';

  const PerformanceMetrics = {
    metricsKey: 'performanceMetricsHistory',
    
    // Initialize performance metrics recording
    init: function() {
      this.recordCurrentMetrics();
      this.setupMetricsViewer();
    },

    // Record current performance metrics
    recordCurrentMetrics: function() {
      var that = this;
      
      // Wait for web vitals to be collected
      setTimeout(function() {
        const webVitals = window.getWebVitals ? window.getWebVitals() : {};
        const rumMetrics = window.RUM ? window.RUM.getMetrics() : [];
        
        const currentMetrics = {
          timestamp: new Date().toISOString(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight
          },
          connection: that.getConnectionInfo(),
          webVitals: webVitals,
          resourceCount: performance.getEntriesByType('resource').length,
          pageLoadTime: that.getPageLoadTime(),
          rumSummary: that.summarizeRumMetrics(rumMetrics)
        };
        
        that.saveMetrics(currentMetrics);
      }, 5000); // Wait 5 seconds for metrics to be collected
    },

    // Get connection information
    getConnectionInfo: function() {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection) {
        return {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData || false
        };
      }
      return null;
    },

    // Get page load time
    getPageLoadTime: function() {
      const perfData = performance.getEntriesByType('navigation')[0];
      if (perfData) {
        return {
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
          loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
          totalTime: perfData.loadEventEnd - perfData.fetchStart
        };
      }
      return null;
    },

    // Summarize RUM metrics
    summarizeRumMetrics: function(metrics) {
      const summary = {
        pageViews: 0,
        interactions: 0,
        errors: 0,
        slowResources: 0
      };
      
      metrics.forEach(function(metric) {
        switch(metric.type) {
          case 'pageview':
            summary.pageViews++;
            break;
          case 'interaction':
            summary.interactions++;
            break;
          case 'error':
            summary.errors++;
            break;
          case 'slow_resource':
            summary.slowResources++;
            break;
        }
      });
      
      return summary;
    },

    // Save metrics to localStorage
    saveMetrics: function(metrics) {
      let history = this.getMetricsHistory();
      
      // Add deployment marker if specified
      const deploymentMarker = this.getDeploymentMarker();
      if (deploymentMarker) {
        metrics.deployment = deploymentMarker;
      }
      
      history.push(metrics);
      
      // Keep only last 100 records
      if (history.length > 100) {
        history = history.slice(-100);
      }
      
      try {
        localStorage.setItem(this.metricsKey, JSON.stringify(history));
        console.log('Performance metrics recorded:', metrics);
      } catch (e) {
        console.error('Failed to save performance metrics:', e);
      }
    },

    // Get metrics history
    getMetricsHistory: function() {
      try {
        return JSON.parse(localStorage.getItem(this.metricsKey) || '[]');
      } catch (e) {
        return [];
      }
    },

    // Get deployment marker from URL parameters or meta tag
    getDeploymentMarker: function() {
      // Check URL parameter
      const urlParams = new URLSearchParams(window.location.search);
      const deploymentParam = urlParams.get('deployment');
      if (deploymentParam) {
        return deploymentParam;
      }
      
      // Check meta tag
      const deploymentMeta = document.querySelector('meta[name="deployment-id"]');
      if (deploymentMeta) {
        return deploymentMeta.content;
      }
      
      return null;
    },

    // Compare metrics between two time periods
    compareMetrics: function(startDate, endDate) {
      const history = this.getMetricsHistory();
      const startTime = new Date(startDate).getTime();
      const endTime = new Date(endDate).getTime();
      
      const beforeMetrics = [];
      const afterMetrics = [];
      
      history.forEach(function(metric) {
        const metricTime = new Date(metric.timestamp).getTime();
        if (metricTime <= startTime) {
          beforeMetrics.push(metric);
        } else if (metricTime >= endTime) {
          afterMetrics.push(metric);
        }
      });
      
      return {
        before: this.aggregateMetrics(beforeMetrics),
        after: this.aggregateMetrics(afterMetrics),
        improvement: this.calculateImprovement(beforeMetrics, afterMetrics)
      };
    },

    // Aggregate metrics for a time period
    aggregateMetrics: function(metrics) {
      if (metrics.length === 0) return null;
      
      const vitals = {
        LCP: [],
        FID: [],
        CLS: [],
        FCP: [],
        TTFB: []
      };
      
      metrics.forEach(function(metric) {
        if (metric.webVitals) {
          Object.keys(vitals).forEach(function(key) {
            if (metric.webVitals[key] && metric.webVitals[key].latest) {
              vitals[key].push(metric.webVitals[key].latest);
            }
          });
        }
      });
      
      const aggregated = {};
      Object.keys(vitals).forEach(function(key) {
        if (vitals[key].length > 0) {
          aggregated[key] = {
            average: vitals[key].reduce((a, b) => a + b, 0) / vitals[key].length,
            min: Math.min(...vitals[key]),
            max: Math.max(...vitals[key]),
            count: vitals[key].length
          };
        }
      });
      
      return aggregated;
    },

    // Calculate improvement percentage
    calculateImprovement: function(beforeMetrics, afterMetrics) {
      const before = this.aggregateMetrics(beforeMetrics);
      const after = this.aggregateMetrics(afterMetrics);
      
      if (!before || !after) return null;
      
      const improvement = {};
      Object.keys(before).forEach(function(key) {
        if (after[key]) {
          const percentChange = ((before[key].average - after[key].average) / before[key].average) * 100;
          improvement[key] = {
            percentChange: percentChange,
            improved: percentChange > 0,
            beforeAvg: before[key].average,
            afterAvg: after[key].average
          };
        }
      });
      
      return improvement;
    },

    // Setup metrics viewer UI
    setupMetricsViewer: function() {
      var that = this;
      
      // Add keyboard shortcut to view metrics (Ctrl+Shift+M)
      document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.shiftKey && e.key === 'M') {
          that.showMetricsReport();
        }
      });
    },

    // Show metrics report
    showMetricsReport: function() {
      const history = this.getMetricsHistory();
      const latestMetrics = history[history.length - 1];
      
      console.group('Performance Metrics Report');
      console.log('Total records:', history.length);
      console.log('Latest metrics:', latestMetrics);
      
      // Show last 7 days comparison
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const comparison = this.compareMetrics(
        sevenDaysAgo.toISOString(),
        new Date().toISOString()
      );
      
      if (comparison.improvement) {
        console.log('7-day improvement:', comparison.improvement);
      }
      
      console.groupEnd();
    },

    // Export metrics as JSON
    exportMetrics: function() {
      const history = this.getMetricsHistory();
      const dataStr = JSON.stringify(history, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'performance-metrics-' + new Date().toISOString().split('T')[0] + '.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    },

    // Clear metrics history
    clearHistory: function() {
      if (confirm('Are you sure you want to clear all performance metrics history?')) {
        localStorage.removeItem(this.metricsKey);
        console.log('Performance metrics history cleared');
      }
    },

    // Record A/B test event
    recordABTestEvent: function(eventName, data) {
      const abTestData = {
        timestamp: new Date().toISOString(),
        event: eventName,
        data: data,
        url: window.location.href,
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        }
      };
      
      // Store A/B test metrics separately
      const abKey = 'abTestMetrics';
      let abHistory = [];
      try {
        abHistory = JSON.parse(localStorage.getItem(abKey) || '[]');
      } catch (e) {
        console.error('Failed to parse A/B test history:', e);
      }
      
      abHistory.push(abTestData);
      
      // Keep only last 500 A/B test events
      if (abHistory.length > 500) {
        abHistory = abHistory.slice(-500);
      }
      
      try {
        localStorage.setItem(abKey, JSON.stringify(abHistory));
      } catch (e) {
        console.error('Failed to save A/B test metrics:', e);
      }
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      PerformanceMetrics.init();
    });
  } else {
    PerformanceMetrics.init();
  }

  // Expose for debugging and manual access
  window.PerformanceMetrics = PerformanceMetrics;
})();