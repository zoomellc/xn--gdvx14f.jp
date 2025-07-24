(function() {
    'use strict';

    class HeatmapTracker {
        constructor(config = {}) {
            this.config = {
                enabled: config.enabled !== false,
                sampleRate: config.sampleRate || 0.1, // 10% のユーザーをサンプリング
                trackClicks: config.trackClicks !== false,
                trackMouseMovement: config.trackMouseMovement !== false,
                trackScroll: config.trackScroll !== false,
                trackTouch: config.trackTouch !== false,
                mouseMoveThrottle: config.mouseMoveThrottle || 50,
                scrollThrottle: config.scrollThrottle || 100,
                batchSize: config.batchSize || 50,
                flushInterval: config.flushInterval || 5000,
                endpoint: config.endpoint || '/api/heatmap',
                storageKey: 'keigo-jp-heatmap',
                sessionId: this.generateSessionId(),
                debug: config.debug || false
            };

            this.events = [];
            this.mousePositions = [];
            this.lastMouseMove = 0;
            this.lastScroll = 0;
            this.flushTimer = null;
            
            // サンプリングチェック
            if (Math.random() > this.config.sampleRate) {
                this.config.enabled = false;
                if (this.config.debug) {
                    console.log('Heatmap tracking disabled for this session (sampling)');
                }
                return;
            }

            if (this.config.enabled) {
                this.init();
            }
        }

        generateSessionId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }

        init() {
            this.injectStyles();
            this.attachEventListeners();
            this.startFlushTimer();
            this.loadExistingData();
            
            if (this.config.debug) {
                this.createDebugOverlay();
            }
        }

        injectStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .heatmap-debug-overlay {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: rgba(0, 0, 0, 0.8);
                    color: white;
                    padding: 10px;
                    border-radius: 5px;
                    font-family: monospace;
                    font-size: 12px;
                    z-index: 10000;
                    max-width: 300px;
                }
                
                .heatmap-debug-overlay h4 {
                    margin: 0 0 10px 0;
                    font-size: 14px;
                }
                
                .heatmap-debug-overlay table {
                    width: 100%;
                    border-collapse: collapse;
                }
                
                .heatmap-debug-overlay td {
                    padding: 2px 5px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                }
                
                .heatmap-debug-overlay td:first-child {
                    text-align: right;
                    padding-right: 10px;
                }
                
                .heatmap-click-indicator {
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    background: rgba(255, 0, 0, 0.5);
                    border: 2px solid rgba(255, 0, 0, 0.8);
                    pointer-events: none;
                    animation: heatmap-pulse 1s ease-out;
                    z-index: 9999;
                }
                
                @keyframes heatmap-pulse {
                    0% {
                        transform: scale(0);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(2);
                        opacity: 0;
                    }
                }
                
                .heatmap-scroll-indicator {
                    position: fixed;
                    right: 10px;
                    width: 4px;
                    background: rgba(0, 255, 0, 0.3);
                    pointer-events: none;
                    transition: all 0.3s ease;
                    z-index: 9998;
                }
            `;
            document.head.appendChild(style);
        }

        attachEventListeners() {
            // クリックイベント
            if (this.config.trackClicks) {
                document.addEventListener('click', this.handleClick.bind(this), true);
                document.addEventListener('touchend', this.handleTouch.bind(this), true);
            }

            // マウス移動イベント
            if (this.config.trackMouseMovement) {
                document.addEventListener('mousemove', this.handleMouseMove.bind(this));
            }

            // スクロールイベント
            if (this.config.trackScroll) {
                window.addEventListener('scroll', this.handleScroll.bind(this));
                // 初期スクロール位置を記録
                this.recordScroll();
            }

            // タッチイベント
            if (this.config.trackTouch) {
                document.addEventListener('touchstart', this.handleTouchStart.bind(this));
                document.addEventListener('touchmove', this.handleTouchMove.bind(this));
            }

            // ページ離脱時の処理
            window.addEventListener('beforeunload', () => {
                this.flush(true);
            });

            // ページ可視性の変更
            document.addEventListener('visibilitychange', () => {
                if (document.hidden) {
                    this.flush();
                }
            });
        }

        handleClick(event) {
            const target = event.target;
            const data = {
                type: 'click',
                x: event.pageX,
                y: event.pageY,
                clientX: event.clientX,
                clientY: event.clientY,
                target: this.getTargetInfo(target),
                timestamp: Date.now(),
                pageUrl: window.location.href,
                viewport: this.getViewport()
            };

            this.addEvent(data);

            if (this.config.debug) {
                this.showClickIndicator(event.clientX, event.clientY);
            }
        }

        handleTouch(event) {
            if (event.changedTouches && event.changedTouches.length > 0) {
                const touch = event.changedTouches[0];
                const target = document.elementFromPoint(touch.clientX, touch.clientY);
                
                const data = {
                    type: 'touch',
                    x: touch.pageX,
                    y: touch.pageY,
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    target: this.getTargetInfo(target),
                    timestamp: Date.now(),
                    pageUrl: window.location.href,
                    viewport: this.getViewport()
                };

                this.addEvent(data);
            }
        }

        handleMouseMove(event) {
            const now = Date.now();
            if (now - this.lastMouseMove < this.config.mouseMoveThrottle) {
                return;
            }
            
            this.lastMouseMove = now;
            
            const position = {
                x: event.pageX,
                y: event.pageY,
                timestamp: now
            };
            
            this.mousePositions.push(position);
            
            // マウス位置のバッファが大きくなりすぎないように制限
            if (this.mousePositions.length > 100) {
                this.mousePositions = this.mousePositions.slice(-50);
            }
        }

        handleScroll() {
            const now = Date.now();
            if (now - this.lastScroll < this.config.scrollThrottle) {
                return;
            }
            
            this.lastScroll = now;
            this.recordScroll();
        }

        recordScroll() {
            const scrollData = {
                type: 'scroll',
                scrollY: window.pageYOffset,
                scrollX: window.pageXOffset,
                scrollHeight: document.documentElement.scrollHeight,
                scrollWidth: document.documentElement.scrollWidth,
                timestamp: Date.now(),
                pageUrl: window.location.href,
                viewport: this.getViewport()
            };

            this.addEvent(scrollData);

            if (this.config.debug) {
                this.updateScrollIndicator();
            }
        }

        handleTouchStart(event) {
            if (event.touches && event.touches.length > 0) {
                const touch = event.touches[0];
                const data = {
                    type: 'touchstart',
                    x: touch.pageX,
                    y: touch.pageY,
                    touches: event.touches.length,
                    timestamp: Date.now(),
                    pageUrl: window.location.href
                };
                
                this.addEvent(data);
            }
        }

        handleTouchMove(event) {
            // タッチ移動は頻度を制限
            const now = Date.now();
            if (now - this.lastMouseMove < this.config.mouseMoveThrottle * 2) {
                return;
            }
            
            this.lastMouseMove = now;
            
            if (event.touches && event.touches.length > 0) {
                const touch = event.touches[0];
                const data = {
                    type: 'touchmove',
                    x: touch.pageX,
                    y: touch.pageY,
                    touches: event.touches.length,
                    timestamp: now,
                    pageUrl: window.location.href
                };
                
                this.addEvent(data);
            }
        }

        getTargetInfo(element) {
            if (!element) return null;
            
            return {
                tagName: element.tagName,
                id: element.id || null,
                className: element.className || null,
                text: element.textContent ? element.textContent.substring(0, 50) : null,
                href: element.href || null,
                selector: this.getSelector(element)
            };
        }

        getSelector(element) {
            if (!element) return '';
            
            if (element.id) {
                return '#' + element.id;
            }
            
            let path = [];
            while (element && element.nodeType === Node.ELEMENT_NODE) {
                let selector = element.nodeName.toLowerCase();
                
                if (element.className) {
                    const classes = element.className.trim().split(/\s+/).slice(0, 2);
                    if (classes.length > 0 && classes[0]) {
                        selector += '.' + classes.join('.');
                    }
                }
                
                path.unshift(selector);
                element = element.parentNode;
                
                if (path.length > 3) break;
            }
            
            return path.join(' > ');
        }

        getViewport() {
            return {
                width: window.innerWidth,
                height: window.innerHeight,
                devicePixelRatio: window.devicePixelRatio || 1
            };
        }

        addEvent(eventData) {
            eventData.sessionId = this.config.sessionId;
            this.events.push(eventData);
            
            if (this.events.length >= this.config.batchSize) {
                this.flush();
            }
            
            if (this.config.debug) {
                this.updateDebugInfo();
            }
        }

        startFlushTimer() {
            this.flushTimer = setInterval(() => {
                this.flush();
            }, this.config.flushInterval);
        }

        flush(sync = false) {
            if (this.events.length === 0 && this.mousePositions.length === 0) {
                return;
            }
            
            const data = {
                events: [...this.events],
                mousePositions: [...this.mousePositions],
                sessionId: this.config.sessionId,
                timestamp: Date.now(),
                pageUrl: window.location.href,
                userAgent: navigator.userAgent
            };
            
            // データをリセット
            this.events = [];
            this.mousePositions = [];
            
            // ローカルストレージに保存（オフライン対応）
            this.saveToLocalStorage(data);
            
            // 実際のエンドポイントに送信する場合
            if (this.config.endpoint && this.config.endpoint !== '/api/heatmap') {
                this.sendData(data, sync);
            }
        }

        saveToLocalStorage(data) {
            try {
                const existing = localStorage.getItem(this.config.storageKey);
                const allData = existing ? JSON.parse(existing) : [];
                allData.push(data);
                
                // 最新の100バッチのみ保持
                const trimmedData = allData.slice(-100);
                localStorage.setItem(this.config.storageKey, JSON.stringify(trimmedData));
            } catch (error) {
                console.error('Failed to save heatmap data:', error);
            }
        }

        loadExistingData() {
            try {
                const existing = localStorage.getItem(this.config.storageKey);
                if (existing) {
                    const data = JSON.parse(existing);
                    if (this.config.debug) {
                        console.log(`Loaded ${data.length} batches of heatmap data`);
                    }
                }
            } catch (error) {
                console.error('Failed to load heatmap data:', error);
            }
        }

        sendData(data, sync = false) {
            const options = {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            };
            
            if (sync && navigator.sendBeacon) {
                // ページ離脱時は sendBeacon を使用
                navigator.sendBeacon(this.config.endpoint, JSON.stringify(data));
            } else {
                // 通常は fetch を使用
                fetch(this.config.endpoint, options)
                    .catch(error => {
                        if (this.config.debug) {
                            console.error('Failed to send heatmap data:', error);
                        }
                    });
            }
        }

        createDebugOverlay() {
            const overlay = document.createElement('div');
            overlay.className = 'heatmap-debug-overlay';
            overlay.innerHTML = `
                <h4>Heatmap Debug</h4>
                <table>
                    <tr>
                        <td>Session:</td>
                        <td class="debug-session">${this.config.sessionId.substring(0, 8)}...</td>
                    </tr>
                    <tr>
                        <td>Events:</td>
                        <td class="debug-events">0</td>
                    </tr>
                    <tr>
                        <td>Mouse Points:</td>
                        <td class="debug-mouse">0</td>
                    </tr>
                    <tr>
                        <td>Last Event:</td>
                        <td class="debug-last">None</td>
                    </tr>
                    <tr>
                        <td>Viewport:</td>
                        <td class="debug-viewport">${window.innerWidth}x${window.innerHeight}</td>
                    </tr>
                </table>
            `;
            document.body.appendChild(overlay);
            this.debugOverlay = overlay;
        }

        updateDebugInfo() {
            if (!this.debugOverlay) return;
            
            this.debugOverlay.querySelector('.debug-events').textContent = this.events.length;
            this.debugOverlay.querySelector('.debug-mouse').textContent = this.mousePositions.length;
            
            if (this.events.length > 0) {
                const lastEvent = this.events[this.events.length - 1];
                this.debugOverlay.querySelector('.debug-last').textContent = lastEvent.type;
            }
            
            this.debugOverlay.querySelector('.debug-viewport').textContent = 
                `${window.innerWidth}x${window.innerHeight}`;
        }

        showClickIndicator(x, y) {
            const indicator = document.createElement('div');
            indicator.className = 'heatmap-click-indicator';
            indicator.style.left = (x - 10) + 'px';
            indicator.style.top = (y - 10) + 'px';
            document.body.appendChild(indicator);
            
            setTimeout(() => {
                indicator.remove();
            }, 1000);
        }

        updateScrollIndicator() {
            let indicator = document.querySelector('.heatmap-scroll-indicator');
            if (!indicator) {
                indicator = document.createElement('div');
                indicator.className = 'heatmap-scroll-indicator';
                document.body.appendChild(indicator);
            }
            
            const scrollPercentage = (window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100;
            const indicatorHeight = (window.innerHeight / document.documentElement.scrollHeight) * window.innerHeight;
            const indicatorTop = (scrollPercentage / 100) * (window.innerHeight - indicatorHeight);
            
            indicator.style.height = indicatorHeight + 'px';
            indicator.style.top = indicatorTop + 'px';
        }

        // 公開API
        enable() {
            this.config.enabled = true;
            this.init();
        }

        disable() {
            this.config.enabled = false;
            if (this.flushTimer) {
                clearInterval(this.flushTimer);
            }
            this.flush(true);
        }

        getHeatmapData() {
            try {
                const existing = localStorage.getItem(this.config.storageKey);
                return existing ? JSON.parse(existing) : [];
            } catch (error) {
                console.error('Failed to get heatmap data:', error);
                return [];
            }
        }

        clearData() {
            localStorage.removeItem(this.config.storageKey);
            this.events = [];
            this.mousePositions = [];
        }
    }

    // グローバルに公開
    window.HeatmapTracker = HeatmapTracker;

    // 自動初期化（設定がある場合）
    if (window.heatmapConfig) {
        window.heatmapInstance = new HeatmapTracker(window.heatmapConfig);
    }
})();