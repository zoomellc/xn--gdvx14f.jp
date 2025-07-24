// Bundle Loader - 動的にJavaScriptバンドルを読み込む
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class BundleLoader {
    constructor() {
        this.observer = null;
        this.loadedBundles = new Set();
        // バンドル定義
        this.bundles = {
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
        };
    }
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
    }
    // 自動読み込みバンドルの読み込み
    loadAutoloadBundles() {
        Object.entries(this.bundles).forEach(([bundleName, config]) => {
            if (config.autoload) {
                this.loadBundle(bundleName);
            }
        });
    }
    // Intersection Observerの設定
    setupObservers() {
        if (!('IntersectionObserver' in window))
            return;
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                var _a;
                if (entry.isIntersecting) {
                    const element = entry.target;
                    const bundleName = this.findBundleByTrigger(element);
                    if (bundleName && !this.loadedBundles.has(bundleName)) {
                        this.loadBundle(bundleName);
                        (_a = this.observer) === null || _a === void 0 ? void 0 : _a.unobserve(element);
                    }
                }
            });
        }, {
            rootMargin: '50px'
        });
        // トリガー要素を監視
        Object.entries(this.bundles).forEach(([, config]) => {
            if (config.triggers) {
                config.triggers.forEach(trigger => {
                    const elements = document.querySelectorAll(`[data-bundle="${trigger}"], .${trigger}, #${trigger}`);
                    elements.forEach(el => { var _a; return (_a = this.observer) === null || _a === void 0 ? void 0 : _a.observe(el); });
                });
            }
        });
    }
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
    }
    // 条件付きバンドルの確認
    checkConditionalBundles() {
        Object.entries(this.bundles).forEach(([bundleName, config]) => {
            if (config.condition && config.condition()) {
                if (config.preload) {
                    this.preloadBundle(bundleName);
                }
                else {
                    this.loadBundle(bundleName);
                }
            }
        });
    }
    // プリロードの設定
    setupPreloading() {
        Object.entries(this.bundles).forEach(([bundleName, config]) => {
            if (config.preload && !config.condition && !config.autoload) {
                this.preloadBundle(bundleName);
            }
        });
    }
    // バンドルのプリロード
    preloadBundle(bundleName) {
        const config = this.bundles[bundleName];
        if (!config)
            return;
        const scripts = config.scripts || (config.path ? [config.path] : []);
        scripts.forEach(scriptPath => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.as = 'script';
            link.href = scriptPath;
            document.head.appendChild(link);
        });
    }
    // バンドルの読み込み
    loadBundle(bundleName) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.loadedBundles.has(bundleName))
                return;
            const config = this.bundles[bundleName];
            if (!config)
                return;
            try {
                this.loadedBundles.add(bundleName);
                const scripts = config.scripts || (config.path ? [config.path] : []);
                let loadedCount = 0;
                const loadScript = (scriptPath) => {
                    return new Promise((resolve, reject) => {
                        const script = document.createElement('script');
                        script.src = scriptPath;
                        script.async = true;
                        script.onload = () => {
                            loadedCount++;
                            if (loadedCount === scripts.length) {
                                const event = new CustomEvent('bundleLoaded', {
                                    detail: { bundleName }
                                });
                                document.dispatchEvent(event);
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
                    yield loadScript(scriptPath);
                }
            }
            catch (error) {
                this.loadedBundles.delete(bundleName);
                console.error(`Error loading bundle ${bundleName}:`, error);
            }
        });
    }
    // 手動でバンドルを読み込む
    load(bundleName) {
        return this.loadBundle(bundleName);
    }
    // クリーンアップ
    destroy() {
        var _a;
        (_a = this.observer) === null || _a === void 0 ? void 0 : _a.disconnect();
        this.observer = null;
    }
}
// シングルトンインスタンスを作成
const bundleLoaderInstance = new BundleLoader();
window.bundleLoader = bundleLoaderInstance;
window.BundleLoader = bundleLoaderInstance; // 後方互換性
// DOMContentLoadedで初期化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => bundleLoaderInstance.init());
}
else {
    bundleLoaderInstance.init();
}
// ES Module export
export default bundleLoaderInstance;
export { BundleLoader };
//# sourceMappingURL=bundle-loader.js.map