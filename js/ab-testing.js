(function() {
  'use strict';

  const ABTesting = {
    // Configuration
    config: {
      storageKey: 'abTestExperiments',
      cookieExpiry: 30, // days
      defaultSplitRatio: 0.5,
      enableLogging: true
    },

    // Active experiments
    experiments: {},

    // Initialize AB Testing framework
    init: function() {
      this.loadExperiments();
      this.assignUserToExperiments();
      this.trackExperimentViews();
      this.setupEventListeners();
    },

    // Load experiment configurations
    loadExperiments: function() {
      // Define your experiments here
      this.experiments = {
        // Example: Testing new header design
        'header-redesign': {
          name: 'Header Redesign Test',
          variants: {
            control: { weight: 0.5 },
            variant1: { weight: 0.5 }
          },
          goals: ['click-rate', 'engagement'],
          startDate: '2025-01-01',
          endDate: '2025-02-01',
          active: true
        },
        // Example: Testing button colors
        'button-color': {
          name: 'Button Color Test',
          variants: {
            control: { weight: 0.33, color: 'blue' },
            green: { weight: 0.33, color: 'green' },
            red: { weight: 0.34, color: 'red' }
          },
          goals: ['conversion', 'click-rate'],
          active: true
        },
        // Example: Testing content layout
        'content-layout': {
          name: 'Content Layout Test',
          variants: {
            control: { weight: 0.5, layout: 'single-column' },
            variant1: { weight: 0.5, layout: 'two-column' }
          },
          goals: ['time-on-page', 'scroll-depth'],
          active: true
        }
      };

      // Load any dynamic experiments from server or localStorage
      this.loadDynamicExperiments();
    },

    // Load dynamic experiments from localStorage or server
    loadDynamicExperiments: function() {
      try {
        const storedExperiments = localStorage.getItem(this.config.storageKey);
        if (storedExperiments) {
          const parsed = JSON.parse(storedExperiments);
          Object.assign(this.experiments, parsed);
        }
      } catch (e) {
        this.log('Error loading dynamic experiments:', e);
      }
    },

    // Assign user to experiments
    assignUserToExperiments: function() {
      const assignments = this.getUserAssignments();
      
      Object.keys(this.experiments).forEach(experimentId => {
        const experiment = this.experiments[experimentId];
        
        // Skip inactive experiments
        if (!experiment.active) return;
        
        // Check if experiment is within date range
        if (!this.isExperimentActive(experiment)) return;
        
        // Check if user already assigned
        if (assignments[experimentId]) {
          experiment.userVariant = assignments[experimentId];
        } else {
          // Assign user to variant
          const variant = this.selectVariant(experiment.variants);
          assignments[experimentId] = variant;
          experiment.userVariant = variant;
        }
      });
      
      // Save assignments
      this.saveUserAssignments(assignments);
      
      // Apply experiments to page
      this.applyExperiments();
    },

    // Check if experiment is within active date range
    isExperimentActive: function(experiment) {
      const now = new Date();
      
      if (experiment.startDate) {
        const start = new Date(experiment.startDate);
        if (now < start) return false;
      }
      
      if (experiment.endDate) {
        const end = new Date(experiment.endDate);
        if (now > end) return false;
      }
      
      return true;
    },

    // Select variant based on weights
    selectVariant: function(variants) {
      const random = Math.random();
      let cumulative = 0;
      
      for (const [variantName, config] of Object.entries(variants)) {
        cumulative += config.weight;
        if (random < cumulative) {
          return variantName;
        }
      }
      
      // Fallback to first variant
      return Object.keys(variants)[0];
    },

    // Get user's experiment assignments
    getUserAssignments: function() {
      try {
        const cookie = this.getCookie('ab_assignments');
        if (cookie) {
          return JSON.parse(decodeURIComponent(cookie));
        }
      } catch (e) {
        this.log('Error reading assignments:', e);
      }
      return {};
    },

    // Save user's experiment assignments
    saveUserAssignments: function(assignments) {
      const expires = new Date();
      expires.setDate(expires.getDate() + this.config.cookieExpiry);
      
      this.setCookie(
        'ab_assignments',
        encodeURIComponent(JSON.stringify(assignments)),
        expires
      );
    },

    // Apply experiments to the page
    applyExperiments: function() {
      Object.keys(this.experiments).forEach(experimentId => {
        const experiment = this.experiments[experimentId];
        if (!experiment.userVariant) return;
        
        // Add experiment class to body
        document.body.classList.add(`ab-${experimentId}-${experiment.userVariant}`);
        
        // Call specific experiment handlers
        const handler = this.experimentHandlers[experimentId];
        if (handler && typeof handler === 'function') {
          handler(experiment.userVariant, experiment);
        }
      });
    },

    // Experiment-specific handlers
    experimentHandlers: {
      'header-redesign': function(variant, experiment) {
        if (variant === 'variant1') {
          // Apply new header design
          const header = document.querySelector('header');
          if (header) {
            header.classList.add('redesigned');
          }
        }
      },
      
      'button-color': function(variant, experiment) {
        const buttons = document.querySelectorAll('.cta-button');
        const color = experiment.variants[variant].color;
        buttons.forEach(button => {
          button.style.backgroundColor = color;
        });
      },
      
      'content-layout': function(variant, experiment) {
        const content = document.querySelector('.content-area');
        if (content) {
          const layout = experiment.variants[variant].layout;
          content.classList.add(`layout-${layout}`);
        }
      }
    },

    // Track experiment views
    trackExperimentViews: function() {
      Object.keys(this.experiments).forEach(experimentId => {
        const experiment = this.experiments[experimentId];
        if (experiment.userVariant) {
          this.trackEvent('experiment_view', {
            experiment_id: experimentId,
            variant: experiment.userVariant,
            timestamp: new Date().toISOString()
          });
        }
      });
    },

    // Setup event listeners for goal tracking
    setupEventListeners: function() {
      // Track clicks
      document.addEventListener('click', (e) => {
        const target = e.target;
        
        // Track button clicks
        if (target.matches('.cta-button, .ab-track-click')) {
          this.trackGoal('click-rate', {
            element: target.tagName,
            class: target.className,
            text: target.textContent
          });
        }
        
        // Track conversions
        if (target.matches('.conversion-action, .ab-track-conversion')) {
          this.trackGoal('conversion', {
            element: target.tagName,
            value: target.dataset.value || 1
          });
        }
      });
      
      // Track time on page
      let startTime = Date.now();
      window.addEventListener('beforeunload', () => {
        const timeOnPage = (Date.now() - startTime) / 1000; // seconds
        this.trackGoal('time-on-page', { duration: timeOnPage });
      });
      
      // Track scroll depth
      let maxScrollDepth = 0;
      window.addEventListener('scroll', () => {
        const scrollDepth = (window.scrollY + window.innerHeight) / document.body.scrollHeight;
        maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);
      });
      
      window.addEventListener('beforeunload', () => {
        this.trackGoal('scroll-depth', { depth: maxScrollDepth });
      });
      
      // Track engagement (mouse movements, clicks, etc.)
      let engagementScore = 0;
      ['click', 'mousemove', 'keydown', 'touchstart'].forEach(event => {
        document.addEventListener(event, () => {
          engagementScore++;
        });
      });
      
      setInterval(() => {
        if (engagementScore > 0) {
          this.trackGoal('engagement', { score: engagementScore });
          engagementScore = 0;
        }
      }, 30000); // Every 30 seconds
    },

    // Track a goal
    trackGoal: function(goalName, data = {}) {
      Object.keys(this.experiments).forEach(experimentId => {
        const experiment = this.experiments[experimentId];
        if (!experiment.userVariant || !experiment.goals.includes(goalName)) return;
        
        this.trackEvent('goal_achieved', {
          experiment_id: experimentId,
          variant: experiment.userVariant,
          goal: goalName,
          data: data,
          timestamp: new Date().toISOString()
        });
      });
    },

    // Track an event
    trackEvent: function(eventName, data) {
      // Send to analytics
      if (window.gtag) {
        window.gtag('event', eventName, data);
      }
      
      // Send to performance metrics
      if (window.PerformanceMetrics) {
        window.PerformanceMetrics.recordABTestEvent(eventName, data);
      }
      
      // Log to console in debug mode
      this.log(`AB Test Event: ${eventName}`, data);
      
      // Store locally for analysis
      this.storeEventLocally(eventName, data);
    },

    // Store event locally for later analysis
    storeEventLocally: function(eventName, data) {
      try {
        const events = JSON.parse(localStorage.getItem('ab_test_events') || '[]');
        events.push({
          event: eventName,
          data: data,
          timestamp: new Date().toISOString()
        });
        
        // Keep only last 1000 events
        if (events.length > 1000) {
          events.splice(0, events.length - 1000);
        }
        
        localStorage.setItem('ab_test_events', JSON.stringify(events));
      } catch (e) {
        this.log('Error storing event:', e);
      }
    },

    // Get experiment results
    getResults: function(experimentId) {
      const events = JSON.parse(localStorage.getItem('ab_test_events') || '[]');
      const experiment = this.experiments[experimentId];
      
      if (!experiment) return null;
      
      const results = {
        experiment: experiment.name,
        variants: {}
      };
      
      // Initialize variant results
      Object.keys(experiment.variants).forEach(variant => {
        results.variants[variant] = {
          views: 0,
          goals: {}
        };
        
        experiment.goals.forEach(goal => {
          results.variants[variant].goals[goal] = {
            count: 0,
            data: []
          };
        });
      });
      
      // Process events
      events.forEach(event => {
        if (event.data.experiment_id !== experimentId) return;
        
        const variant = event.data.variant;
        if (!results.variants[variant]) return;
        
        if (event.event === 'experiment_view') {
          results.variants[variant].views++;
        } else if (event.event === 'goal_achieved') {
          const goal = event.data.goal;
          if (results.variants[variant].goals[goal]) {
            results.variants[variant].goals[goal].count++;
            results.variants[variant].goals[goal].data.push(event.data.data);
          }
        }
      });
      
      // Calculate conversion rates
      Object.keys(results.variants).forEach(variant => {
        const variantData = results.variants[variant];
        Object.keys(variantData.goals).forEach(goal => {
          const goalData = variantData.goals[goal];
          goalData.conversionRate = variantData.views > 0 
            ? (goalData.count / variantData.views) * 100 
            : 0;
        });
      });
      
      return results;
    },

    // Get all experiment results
    getAllResults: function() {
      const allResults = {};
      Object.keys(this.experiments).forEach(experimentId => {
        allResults[experimentId] = this.getResults(experimentId);
      });
      return allResults;
    },

    // Export results
    exportResults: function() {
      const results = this.getAllResults();
      const dataStr = JSON.stringify(results, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = 'ab-test-results-' + new Date().toISOString().split('T')[0] + '.json';
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    },

    // Utility: Set cookie
    setCookie: function(name, value, expires) {
      document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/; SameSite=Lax`;
    },

    // Utility: Get cookie
    getCookie: function(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    },

    // Utility: Log messages
    log: function(...args) {
      if (this.config.enableLogging) {
        console.log('[AB Testing]', ...args);
      }
    },

    // Public API methods
    
    // Get user's variant for an experiment
    getVariant: function(experimentId) {
      const experiment = this.experiments[experimentId];
      return experiment ? experiment.userVariant : null;
    },

    // Check if user is in variant
    isInVariant: function(experimentId, variantName) {
      return this.getVariant(experimentId) === variantName;
    },

    // Force user into specific variant (for testing)
    forceVariant: function(experimentId, variantName) {
      const assignments = this.getUserAssignments();
      assignments[experimentId] = variantName;
      this.saveUserAssignments(assignments);
      
      // Reload to apply changes
      window.location.reload();
    },

    // Clear all experiment assignments
    clearAssignments: function() {
      this.setCookie('ab_assignments', '', new Date(0));
      localStorage.removeItem('ab_test_events');
      window.location.reload();
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      ABTesting.init();
    });
  } else {
    ABTesting.init();
  }

  // Expose for debugging and API access
  window.ABTesting = ABTesting;
})();