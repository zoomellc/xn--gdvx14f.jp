(function() {
  'use strict';

  // Core Web Vitals thresholds
  const thresholds = {
    LCP: { good: 2500, needsImprovement: 4000 },
    FID: { good: 100, needsImprovement: 300 },
    CLS: { good: 0.1, needsImprovement: 0.25 },
    FCP: { good: 1800, needsImprovement: 3000 },
    TTFB: { good: 800, needsImprovement: 1800 }
  };

  // Function to send metrics to analytics
  function sendToAnalytics(metric) {
    const rating = getRating(metric.name, metric.value);
    
    // Log to console in development
    if (window.location.hostname === 'localhost') {
      console.log(`${metric.name}: ${metric.value.toFixed(2)} (${rating})`, metric);
    }

    // Send to Google Analytics if available
    if (window.gtag) {
      gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true,
        metric_rating: rating
      });
    }

    // Store in localStorage for debugging
    const vitals = JSON.parse(localStorage.getItem('webVitals') || '[]');
    vitals.push({
      name: metric.name,
      value: metric.value,
      rating: rating,
      timestamp: new Date().toISOString(),
      id: metric.id
    });
    
    // Keep only last 10 measurements
    if (vitals.length > 10) {
      vitals.shift();
    }
    
    localStorage.setItem('webVitals', JSON.stringify(vitals));
  }

  // Determine rating based on thresholds
  function getRating(name, value) {
    const threshold = thresholds[name];
    if (!threshold) return 'unknown';
    
    if (value <= threshold.good) return 'good';
    if (value <= threshold.needsImprovement) return 'needs-improvement';
    return 'poor';
  }

  // Load web-vitals library dynamically
  function loadWebVitals() {
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/web-vitals@3/dist/web-vitals.iife.js';
    script.onload = function() {
      if (window.webVitals) {
        // Measure Core Web Vitals
        webVitals.onLCP(sendToAnalytics);
        webVitals.onFID(sendToAnalytics);
        webVitals.onCLS(sendToAnalytics);
        webVitals.onFCP(sendToAnalytics);
        webVitals.onTTFB(sendToAnalytics);

        // Log navigation type
        const navEntry = performance.getEntriesByType('navigation')[0];
        if (navEntry) {
          console.log('Navigation type:', navEntry.type);
        }
      }
    };
    document.head.appendChild(script);
  }

  // Initialize on page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadWebVitals);
  } else {
    loadWebVitals();
  }

  // Expose function to get current vitals from localStorage
  window.getWebVitals = function() {
    const vitals = JSON.parse(localStorage.getItem('webVitals') || '[]');
    const summary = {};
    
    // Group by metric name and calculate averages
    vitals.forEach(function(metric) {
      if (!summary[metric.name]) {
        summary[metric.name] = {
          values: [],
          ratings: []
        };
      }
      summary[metric.name].values.push(metric.value);
      summary[metric.name].ratings.push(metric.rating);
    });
    
    // Calculate averages and most common rating
    Object.keys(summary).forEach(function(name) {
      const values = summary[name].values;
      const ratings = summary[name].ratings;
      
      summary[name] = {
        average: values.reduce((a, b) => a + b, 0) / values.length,
        latest: values[values.length - 1],
        rating: ratings[ratings.length - 1],
        count: values.length
      };
    });
    
    return summary;
  };
})();