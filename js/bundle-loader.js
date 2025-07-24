// Bundle Loader - 動的にJavaScriptバンドルを読み込む
(function() {
    'use strict';

    const BundleLoader = {
        // 読み込み済みバンドルのキャッシュ
        loadedBundles: new Set(),
        
        // バンドル定義
        bundles: {
            interactive: {
                triggers: ['honorific-converter', 'honorific-examples', 'honorific-quiz'],
                scripts: [
                    '/js/min/honorific-converter.min.js',
                    '/js/min/honorific-examples.min.js',
                    '/js/min/honorific-quiz-enhanced.min.js'
                ],
                preload: false
            },
            utilities: {
                triggers: ['search-form', 'favorites-button', 'font-size-controls', 'share-buttons', 'popular-posts-widget'],
                scripts: [
                    '/js/min/search.min.js',
                    '/js/min/favorites.min.js',
                    '/js/min/font-size-adjuster.min.js',
                    '/js/min/share-buttons.min.js',
                    '/js/min/popular-posts.min.js'
                ],
                preload: false
            },
            mobile: {
                condition: () => window.innerWidth <= 768,
                scripts: [
                    '/js/min/mobile-gestures.min.js',
                    '/js/min/mobile-bottom-nav.min.js',
                    '/js/min/mobile-enhancements.min.js'
                ],
                preload: true
            },
            core: {
                autoload: true,
                scripts: [
                    '/js/min/dark-mode.min.js',
                    '/js/min/lazy-load.min.js',
                    '/js/min/table-responsive.min.js'
                ]
            },
            feedback: {
                triggers: ['feedback-button', 'feedback-system'],
                scripts: ['/js/min/feedback-system.min.js'],
                preload: false
            },
            dictionary: {
                triggers: ['honorific-dictionary-container'],
                scripts: ['/js/min/honorific-dictionary.min.js'],
                preload: false
            },
            comments: {
                triggers: ['comment-container', 'comment-section'],
                scripts: ['/js/min/comment-system.min.js'],
                preload: false
            },
            profile: {
                triggers: ['user-profile-trigger'],
                scripts: ['/js/min/user-profile.min.js'],
                preload: false,
                autoload: true
            },
            heatmap: {
                scripts: ['/js/min/heatmap-tracker.min.js'],
                preload: false,
                autoload: true
            }
        },

        // 初期化
        init() {
            // 自動読み込みバンドルの読み込み
            this.loadAutoloadBundles();
            
            // Intersection Observerでトリガー要素を監視
            this.setupObservers();
            
            // 条件付きバンドルの確認
            this.checkConditionalBundles();
            
            // プリロード設定
            this.setupPreloading();
        },
        
        // 自動読み込みバンドルの読み込み
        loadAutoloadBundles() {
            Object.entries(this.bundles).forEach(([bundleName, config]) => {
                if (config.autoload) {
                    this.loadBundle(bundleName);
                }
            });
        },

        // Intersection Observerの設定
        setupObservers() {
            if (!('IntersectionObserver' in window)) return;

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const element = entry.target;
                        const bundleName = this.findBundleByTrigger(element);
                        
                        if (bundleName && !this.loadedBundles.has(bundleName)) {
                            this.loadBundle(bundleName);
                            observer.unobserve(element);
                        }
                    }
                });
            }, {
                rootMargin: '50px'
            });

            // トリガー要素を監視
            Object.entries(this.bundles).forEach(([bundleName, config]) => {
                if (config.triggers) {
                    config.triggers.forEach(trigger => {
                        const elements = document.querySelectorAll(`[data-bundle="${trigger}"], .${trigger}, #${trigger}`);
                        elements.forEach(el => observer.observe(el));
                    });
                }
            });
        },

        // トリガー要素からバンドル名を特定
        findBundleByTrigger(element) {
            for (const [bundleName, config] of Object.entries(this.bundles)) {
                if (config.triggers) {
                    for (const trigger of config.triggers) {
                        if (element.matches(`[data-bundle="${trigger}"], .${trigger}, #${trigger}`)) {
                            return bundleName;
                        }
                    }
                }
            }
            return null;
        },

        // 条件付きバンドルの確認
        checkConditionalBundles() {
            Object.entries(this.bundles).forEach(([bundleName, config]) => {
                if (config.condition && config.condition()) {
                    if (config.preload) {
                        this.preloadBundle(bundleName);
                    } else {
                        this.loadBundle(bundleName);
                    }
                }
            });
        },

        // プリロードの設定
        setupPreloading() {
            Object.entries(this.bundles).forEach(([bundleName, config]) => {
                if (config.preload && !config.condition && !config.autoload) {
                    this.preloadBundle(bundleName);
                }
            });
        },

        // バンドルのプリロード
        preloadBundle(bundleName) {
            const config = this.bundles[bundleName];
            if (!config) return;

            const scripts = config.scripts || [config.path];
            scripts.forEach(scriptPath => {
                const link = document.createElement('link');
                link.rel = 'preload';
                link.as = 'script';
                link.href = scriptPath;
                document.head.appendChild(link);
            });
        },

        // バンドルの読み込み
        async loadBundle(bundleName) {
            if (this.loadedBundles.has(bundleName)) return;

            const config = this.bundles[bundleName];
            if (!config) return;

            try {
                this.loadedBundles.add(bundleName);
                
                const scripts = config.scripts || [config.path];
                let loadedCount = 0;
                
                const loadScript = (scriptPath) => {
                    return new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = scriptPath;
                        script.async = true;
                        
                        script.onload = () => {
                            loadedCount++;
                            if (loadedCount === scripts.length) {
                                document.dispatchEvent(new CustomEvent('bundleLoaded', {
                                    detail: { bundleName }
                                }));
                            }
                            resolve();
                        };
                        
                        script.onerror = () => {
                            console.error(`Failed to load script: ${scriptPath}`);
                            reject(new Error(`Failed to load script: ${scriptPath}`));
                        };
                        
                        document.body.appendChild(script);
                    });
                };
                
                // すべてのスクリプトを順番に読み込む
                for (const scriptPath of scripts) {
                    await loadScript(scriptPath);
                }
                
            } catch (error) {
                this.loadedBundles.delete(bundleName);
                console.error(`Error loading bundle ${bundleName}:`, error);
            }
        },

        // 手動でバンドルを読み込む
        load(bundleName) {
            return this.loadBundle(bundleName);
        }
    };

    // グローバルに公開
    window.BundleLoader = BundleLoader;

    // DOMContentLoadedで初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => BundleLoader.init());
    } else {
        BundleLoader.init();
    }
})();