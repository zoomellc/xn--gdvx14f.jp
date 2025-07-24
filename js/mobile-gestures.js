(function() {
  'use strict';

  const MobileGestures = {
    // Configuration
    config: {
      swipeThreshold: 50, // Minimum distance for swipe
      swipeTimeout: 300, // Maximum time for swipe
      longPressThreshold: 500, // Time for long press
      pinchThreshold: 0.02, // Minimum scale change for pinch
      doubleTapTimeout: 300, // Maximum time between taps
      enableVibration: true, // Enable haptic feedback
      enableDebug: false
    },

    // Touch tracking
    touches: {
      startX: 0,
      startY: 0,
      startTime: 0,
      startDistance: 0,
      lastTap: 0,
      longPressTimer: null
    },

    // Gesture handlers
    handlers: {
      swipeLeft: [],
      swipeRight: [],
      swipeUp: [],
      swipeDown: [],
      pinchIn: [],
      pinchOut: [],
      longPress: [],
      doubleTap: [],
      shake: []
    },

    // Initialize mobile gestures
    init: function() {
      if (!this.isMobile()) {
        this.log('Not a mobile device, skipping gesture initialization');
        return;
      }

      this.setupTouchListeners();
      this.setupShakeDetection();
      this.setupOrientationDetection();
      this.applyMobileOptimizations();
      this.log('Mobile gestures initialized');
    },

    // Check if device is mobile
    isMobile: function() {
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
             ('ontouchstart' in window) ||
             (navigator.maxTouchPoints > 0);
    },

    // Setup touch event listeners
    setupTouchListeners: function() {
      const body = document.body;

      // Touch start
      body.addEventListener('touchstart', (e) => {
        this.handleTouchStart(e);
      }, { passive: true });

      // Touch move
      body.addEventListener('touchmove', (e) => {
        this.handleTouchMove(e);
      }, { passive: false });

      // Touch end
      body.addEventListener('touchend', (e) => {
        this.handleTouchEnd(e);
      }, { passive: true });

      // Touch cancel
      body.addEventListener('touchcancel', (e) => {
        this.clearTouchData();
      }, { passive: true });

      // Prevent default gestures on specific elements
      this.preventDefaultGestures();
    },

    // Handle touch start
    handleTouchStart: function(e) {
      const touch = e.touches[0];
      this.touches.startX = touch.clientX;
      this.touches.startY = touch.clientY;
      this.touches.startTime = Date.now();

      // Handle multi-touch for pinch
      if (e.touches.length === 2) {
        this.touches.startDistance = this.getDistance(e.touches[0], e.touches[1]);
      }

      // Setup long press detection
      this.touches.longPressTimer = setTimeout(() => {
        this.triggerLongPress(e);
      }, this.config.longPressThreshold);

      // Handle double tap
      const currentTime = Date.now();
      if (currentTime - this.touches.lastTap < this.config.doubleTapTimeout) {
        this.triggerDoubleTap(e);
      }
      this.touches.lastTap = currentTime;
    },

    // Handle touch move
    handleTouchMove: function(e) {
      // Cancel long press if finger moves
      if (this.touches.longPressTimer) {
        const touch = e.touches[0];
        const moveX = Math.abs(touch.clientX - this.touches.startX);
        const moveY = Math.abs(touch.clientY - this.touches.startY);
        
        if (moveX > 10 || moveY > 10) {
          clearTimeout(this.touches.longPressTimer);
          this.touches.longPressTimer = null;
        }
      }

      // Handle pinch gesture
      if (e.touches.length === 2 && this.touches.startDistance > 0) {
        const currentDistance = this.getDistance(e.touches[0], e.touches[1]);
        const scale = currentDistance / this.touches.startDistance;
        
        if (Math.abs(1 - scale) > this.config.pinchThreshold) {
          if (scale > 1) {
            this.triggerPinchOut(e, scale);
          } else {
            this.triggerPinchIn(e, scale);
          }
          
          // Prevent default zoom
          e.preventDefault();
        }
      }
    },

    // Handle touch end
    handleTouchEnd: function(e) {
      // Clear long press timer
      if (this.touches.longPressTimer) {
        clearTimeout(this.touches.longPressTimer);
        this.touches.longPressTimer = null;
      }

      // Skip if it was multi-touch
      if (e.touches.length > 0) {
        return;
      }

      const endTime = Date.now();
      const timeDiff = endTime - this.touches.startTime;

      // Check for swipe
      if (timeDiff < this.config.swipeTimeout) {
        const touch = e.changedTouches[0];
        const distX = touch.clientX - this.touches.startX;
        const distY = touch.clientY - this.touches.startY;
        
        if (Math.abs(distX) > this.config.swipeThreshold || 
            Math.abs(distY) > this.config.swipeThreshold) {
          
          if (Math.abs(distX) > Math.abs(distY)) {
            // Horizontal swipe
            if (distX > 0) {
              this.triggerSwipeRight(e);
            } else {
              this.triggerSwipeLeft(e);
            }
          } else {
            // Vertical swipe
            if (distY > 0) {
              this.triggerSwipeDown(e);
            } else {
              this.triggerSwipeUp(e);
            }
          }
        }
      }

      this.clearTouchData();
    },

    // Clear touch data
    clearTouchData: function() {
      this.touches.startX = 0;
      this.touches.startY = 0;
      this.touches.startTime = 0;
      this.touches.startDistance = 0;
      
      if (this.touches.longPressTimer) {
        clearTimeout(this.touches.longPressTimer);
        this.touches.longPressTimer = null;
      }
    },

    // Get distance between two touch points
    getDistance: function(touch1, touch2) {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    },

    // Setup shake detection
    setupShakeDetection: function() {
      if (!window.DeviceMotionEvent) return;

      let lastX = 0, lastY = 0, lastZ = 0;
      let lastTime = 0;
      const shakeThreshold = 15;
      
      window.addEventListener('devicemotion', (e) => {
        const acceleration = e.accelerationIncludingGravity;
        if (!acceleration) return;
        
        const currentTime = Date.now();
        if ((currentTime - lastTime) > 100) {
          const diffTime = currentTime - lastTime;
          lastTime = currentTime;
          
          const diffX = Math.abs(acceleration.x - lastX);
          const diffY = Math.abs(acceleration.y - lastY);
          const diffZ = Math.abs(acceleration.z - lastZ);
          
          if (diffX + diffY + diffZ > shakeThreshold) {
            this.triggerShake(e);
          }
          
          lastX = acceleration.x;
          lastY = acceleration.y;
          lastZ = acceleration.z;
        }
      });
    },

    // Setup orientation detection
    setupOrientationDetection: function() {
      let previousOrientation = window.orientation;
      
      window.addEventListener('orientationchange', () => {
        const currentOrientation = window.orientation;
        this.handleOrientationChange(previousOrientation, currentOrientation);
        previousOrientation = currentOrientation;
      });
    },

    // Apply mobile-specific optimizations
    applyMobileOptimizations: function() {
      // Add mobile class to body
      document.body.classList.add('is-mobile');

      // Optimize touch targets
      this.optimizeTouchTargets();

      // Setup pull-to-refresh
      this.setupPullToRefresh();

      // Setup infinite scroll
      this.setupInfiniteScroll();

      // Apply viewport optimizations
      this.optimizeViewport();
    },

    // Optimize touch targets
    optimizeTouchTargets: function() {
      // Ensure all interactive elements are at least 44x44 pixels
      const minSize = 44;
      const interactiveElements = document.querySelectorAll('a, button, input, select, textarea, [role="button"]');
      
      interactiveElements.forEach(element => {
        const rect = element.getBoundingClientRect();
        if (rect.width < minSize || rect.height < minSize) {
          element.style.minWidth = minSize + 'px';
          element.style.minHeight = minSize + 'px';
          element.style.padding = '8px';
        }
      });
    },

    // Setup pull-to-refresh
    setupPullToRefresh: function() {
      let startY = 0;
      let currentY = 0;
      let pulling = false;
      
      const pullIndicator = document.createElement('div');
      pullIndicator.className = 'pull-to-refresh-indicator';
      pullIndicator.innerHTML = '<div class="spinner"></div>';
      pullIndicator.style.cssText = `
        position: fixed;
        top: -60px;
        left: 50%;
        transform: translateX(-50%);
        width: 40px;
        height: 40px;
        background: white;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: top 0.3s;
        z-index: 9999;
      `;
      document.body.appendChild(pullIndicator);
      
      document.addEventListener('touchstart', (e) => {
        if (window.scrollY === 0) {
          startY = e.touches[0].clientY;
          pulling = true;
        }
      });
      
      document.addEventListener('touchmove', (e) => {
        if (!pulling) return;
        
        currentY = e.touches[0].clientY;
        const diff = currentY - startY;
        
        if (diff > 0 && window.scrollY === 0) {
          e.preventDefault();
          const progress = Math.min(diff / 100, 1);
          pullIndicator.style.top = (progress * 60 - 60) + 'px';
          
          if (diff > 100) {
            pullIndicator.classList.add('ready');
          } else {
            pullIndicator.classList.remove('ready');
          }
        }
      });
      
      document.addEventListener('touchend', () => {
        if (!pulling) return;
        
        const diff = currentY - startY;
        if (diff > 100 && window.scrollY === 0) {
          // Trigger refresh
          pullIndicator.classList.add('refreshing');
          this.triggerPullToRefresh();
          
          setTimeout(() => {
            pullIndicator.classList.remove('refreshing', 'ready');
            pullIndicator.style.top = '-60px';
          }, 1000);
        } else {
          pullIndicator.style.top = '-60px';
        }
        
        pulling = false;
        startY = 0;
        currentY = 0;
      });
    },

    // Setup infinite scroll
    setupInfiniteScroll: function() {
      let loading = false;
      
      const loadMoreIndicator = document.createElement('div');
      loadMoreIndicator.className = 'infinite-scroll-loader';
      loadMoreIndicator.innerHTML = '<div class="spinner"></div>';
      loadMoreIndicator.style.cssText = `
        text-align: center;
        padding: 20px;
        display: none;
      `;
      
      const content = document.querySelector('main') || document.body;
      content.appendChild(loadMoreIndicator);
      
      window.addEventListener('scroll', () => {
        if (loading) return;
        
        const scrollPosition = window.scrollY + window.innerHeight;
        const documentHeight = document.documentElement.scrollHeight;
        
        if (scrollPosition > documentHeight - 200) {
          loading = true;
          loadMoreIndicator.style.display = 'block';
          
          this.triggerInfiniteScroll(() => {
            loading = false;
            loadMoreIndicator.style.display = 'none';
          });
        }
      });
    },

    // Optimize viewport
    optimizeViewport: function() {
      // Prevent zoom on input focus
      const inputs = document.querySelectorAll('input, select, textarea');
      inputs.forEach(input => {
        input.addEventListener('focus', () => {
          document.querySelector('meta[name="viewport"]').setAttribute('content', 
            'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
        });
        
        input.addEventListener('blur', () => {
          document.querySelector('meta[name="viewport"]').setAttribute('content', 
            'width=device-width, initial-scale=1.0');
        });
      });
    },

    // Prevent default gestures on specific elements
    preventDefaultGestures: function() {
      // Prevent pinch zoom on images
      document.querySelectorAll('img').forEach(img => {
        img.addEventListener('touchmove', (e) => {
          if (e.touches.length > 1) {
            e.preventDefault();
          }
        });
      });
    },

    // Gesture triggers
    triggerSwipeLeft: function(e) {
      this.vibrate();
      this.log('Swipe left detected');
      this.executeHandlers('swipeLeft', e);
    },

    triggerSwipeRight: function(e) {
      this.vibrate();
      this.log('Swipe right detected');
      this.executeHandlers('swipeRight', e);
    },

    triggerSwipeUp: function(e) {
      this.vibrate();
      this.log('Swipe up detected');
      this.executeHandlers('swipeUp', e);
    },

    triggerSwipeDown: function(e) {
      this.vibrate();
      this.log('Swipe down detected');
      this.executeHandlers('swipeDown', e);
    },

    triggerPinchIn: function(e, scale) {
      this.log('Pinch in detected', scale);
      this.executeHandlers('pinchIn', e, scale);
    },

    triggerPinchOut: function(e, scale) {
      this.log('Pinch out detected', scale);
      this.executeHandlers('pinchOut', e, scale);
    },

    triggerLongPress: function(e) {
      this.vibrate(50);
      this.log('Long press detected');
      this.executeHandlers('longPress', e);
    },

    triggerDoubleTap: function(e) {
      this.vibrate(25);
      this.log('Double tap detected');
      this.executeHandlers('doubleTap', e);
    },

    triggerShake: function(e) {
      this.log('Shake detected');
      this.executeHandlers('shake', e);
    },

    triggerPullToRefresh: function() {
      this.log('Pull to refresh triggered');
      // Default action: reload page
      setTimeout(() => {
        window.location.reload();
      }, 500);
    },

    triggerInfiniteScroll: function(callback) {
      this.log('Infinite scroll triggered');
      // Default action: call callback after delay
      setTimeout(callback, 1000);
    },

    // Handle orientation change
    handleOrientationChange: function(previousOrientation, currentOrientation) {
      this.log('Orientation changed from', previousOrientation, 'to', currentOrientation);
      
      // Apply orientation-specific styles
      document.body.classList.remove('orientation-0', 'orientation-90', 'orientation-180', 'orientation-270');
      document.body.classList.add('orientation-' + Math.abs(currentOrientation));
    },

    // Execute handlers for a gesture
    executeHandlers: function(gesture, event, ...args) {
      const handlers = this.handlers[gesture];
      handlers.forEach(handler => {
        try {
          handler(event, ...args);
        } catch (error) {
          console.error('Error executing gesture handler:', error);
        }
      });
    },

    // Vibrate if enabled
    vibrate: function(duration = 10) {
      if (this.config.enableVibration && navigator.vibrate) {
        navigator.vibrate(duration);
      }
    },

    // Logging utility
    log: function(...args) {
      if (this.config.enableDebug) {
        console.log('[Mobile Gestures]', ...args);
      }
    },

    // Public API

    // Register gesture handler
    on: function(gesture, handler) {
      if (this.handlers[gesture]) {
        this.handlers[gesture].push(handler);
      } else {
        console.warn('Unknown gesture:', gesture);
      }
    },

    // Unregister gesture handler
    off: function(gesture, handler) {
      if (this.handlers[gesture]) {
        const index = this.handlers[gesture].indexOf(handler);
        if (index > -1) {
          this.handlers[gesture].splice(index, 1);
        }
      }
    },

    // Enable/disable gestures
    enable: function() {
      this.init();
    },

    disable: function() {
      // Remove all event listeners
      const body = document.body;
      body.removeEventListener('touchstart', this.handleTouchStart);
      body.removeEventListener('touchmove', this.handleTouchMove);
      body.removeEventListener('touchend', this.handleTouchEnd);
      body.removeEventListener('touchcancel', this.clearTouchData);
    },

    // Get current configuration
    getConfig: function() {
      return Object.assign({}, this.config);
    },

    // Update configuration
    setConfig: function(newConfig) {
      Object.assign(this.config, newConfig);
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      MobileGestures.init();
    });
  } else {
    MobileGestures.init();
  }

  // Expose for API access
  window.MobileGestures = MobileGestures;
})();