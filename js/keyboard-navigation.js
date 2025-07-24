/**
 * キーボードナビゲーション改善スクリプト
 * サイト全体のキーボード操作を最適化
 */

(function() {
    'use strict';
    
    // フォーカス可能な要素のセレクター
    const focusableElements = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';
    
    // 現在のフォーカスを可視化
    let currentFocusedElement = null;
    
    // ページ内ナビゲーション用のショートカットキー
    const shortcuts = {
        'h': () => navigateToElement('header'),
        'm': () => navigateToElement('main'),
        'f': () => navigateToElement('footer'),
        's': () => focusSearchInput(),
        '/': () => focusSearchInput(),
        'g': {
            'h': () => window.location.href = '/',
            'a': () => navigateToLink('概要'),
            'c': () => navigateToLink('お問い合わせ')
        }
    };
    
    // 現在のショートカットモード
    let shortcutMode = null;
    let shortcutTimer = null;
    
    // ページ読み込み時の初期化
    document.addEventListener('DOMContentLoaded', function() {
        initKeyboardNavigation();
        improveFormNavigation();
        addSkipLinks();
        enhanceFocusIndicators();
    });
    
    /**
     * キーボードナビゲーションの初期化
     */
    function initKeyboardNavigation() {
        // グローバルキーイベントリスナー
        document.addEventListener('keydown', handleGlobalKeydown);
        
        // フォーカスイベントの監視
        document.addEventListener('focusin', handleFocusIn);
        document.addEventListener('focusout', handleFocusOut);
        
        // タブインデックスの動的管理
        manageDynamicTabIndex();
    }
    
    /**
     * グローバルキーダウンハンドラー
     */
    function handleGlobalKeydown(e) {
        // テキスト入力中は無効
        if (isTyping()) return;
        
        // ショートカットモードの処理
        if (shortcutMode && shortcuts[shortcutMode] && shortcuts[shortcutMode][e.key]) {
            e.preventDefault();
            shortcuts[shortcutMode][e.key]();
            resetShortcutMode();
            return;
        }
        
        // 通常のショートカット
        if (shortcuts[e.key]) {
            e.preventDefault();
            if (typeof shortcuts[e.key] === 'function') {
                shortcuts[e.key]();
            } else {
                // 複合キーの場合
                shortcutMode = e.key;
                showShortcutHint(e.key);
                shortcutTimer = setTimeout(resetShortcutMode, 2000);
            }
        }
        
        // 矢印キーナビゲーション（記事リスト内）
        if (e.key.startsWith('Arrow') && e.target.closest('article')) {
            handleArrowNavigation(e);
        }
        
        // Enterキーでのクリック動作
        if (e.key === 'Enter' && e.target.hasAttribute('role') && e.target.getAttribute('role') === 'button') {
            e.target.click();
        }
    }
    
    /**
     * 矢印キーによるナビゲーション
     */
    function handleArrowNavigation(e) {
        const articles = Array.from(document.querySelectorAll('article'));
        const currentArticle = e.target.closest('article');
        const currentIndex = articles.indexOf(currentArticle);
        
        let targetIndex = currentIndex;
        
        switch(e.key) {
            case 'ArrowUp':
            case 'ArrowLeft':
                targetIndex = Math.max(0, currentIndex - 1);
                break;
            case 'ArrowDown':
            case 'ArrowRight':
                targetIndex = Math.min(articles.length - 1, currentIndex + 1);
                break;
        }
        
        if (targetIndex !== currentIndex) {
            e.preventDefault();
            const targetLink = articles[targetIndex].querySelector('a');
            if (targetLink) {
                targetLink.focus();
            }
        }
    }
    
    /**
     * フォーカスイン時の処理
     */
    function handleFocusIn(e) {
        currentFocusedElement = e.target;
        
        // フォーカスリングの強調
        e.target.classList.add('keyboard-focused');
        
        // スクリーンリーダー用の追加情報
        announceElementInfo(e.target);
    }
    
    /**
     * フォーカスアウト時の処理
     */
    function handleFocusOut(e) {
        e.target.classList.remove('keyboard-focused');
    }
    
    /**
     * 要素への移動
     */
    function navigateToElement(selector) {
        const element = document.querySelector(selector);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // フォーカス可能な最初の要素を探す
            const focusable = element.querySelector(focusableElements);
            if (focusable) {
                focusable.focus();
            } else if (element.hasAttribute('tabindex')) {
                element.focus();
            }
        }
    }
    
    /**
     * リンクテキストで要素を検索して移動
     */
    function navigateToLink(text) {
        const link = Array.from(document.querySelectorAll('a')).find(a => a.textContent.includes(text));
        if (link) {
            link.focus();
            link.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
    
    /**
     * 検索入力にフォーカス
     */
    function focusSearchInput() {
        const searchInput = document.querySelector('input[type="search"], input[name="search"], input[placeholder*="検索"]');
        if (searchInput) {
            searchInput.focus();
            searchInput.select();
        }
    }
    
    /**
     * ユーザーが入力中かどうかを判定
     */
    function isTyping() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.contentEditable === 'true'
        );
    }
    
    /**
     * フォーム要素のナビゲーション改善
     */
    function improveFormNavigation() {
        // フォーム内でのEnterキー処理
        document.querySelectorAll('form').forEach(form => {
            form.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
                    const inputs = Array.from(form.querySelectorAll('input:not([type="submit"]), select, textarea'));
                    const currentIndex = inputs.indexOf(e.target);
                    
                    if (currentIndex < inputs.length - 1) {
                        e.preventDefault();
                        inputs[currentIndex + 1].focus();
                    }
                }
            });
        });
    }
    
    /**
     * スキップリンクの追加
     */
    function addSkipLinks() {
        // 既存のスキップリンクがない場合は追加
        if (!document.querySelector('.skip-link')) {
            const skipNav = document.createElement('nav');
            skipNav.setAttribute('aria-label', 'スキップリンク');
            skipNav.className = 'skip-links';
            skipNav.innerHTML = `
                <a href="#main-content" class="skip-link">メインコンテンツへ</a>
                <a href="#sidebar" class="skip-link">サイドバーへ</a>
                <a href="#footer" class="skip-link">フッターへ</a>
            `;
            document.body.insertBefore(skipNav, document.body.firstChild);
        }
    }
    
    /**
     * フォーカスインジケーターの強化
     */
    function enhanceFocusIndicators() {
        // CSSを動的に追加
        const style = document.createElement('style');
        style.textContent = `
            .keyboard-focused {
                outline: 3px solid #4299e1 !important;
                outline-offset: 3px !important;
                box-shadow: 0 0 0 6px rgba(66, 153, 225, 0.2) !important;
                transition: all 0.2s ease !important;
            }
            
            .skip-links {
                position: absolute;
                top: -40px;
                left: 0;
                background: white;
                z-index: 9999;
            }
            
            .skip-link:focus {
                position: absolute;
                top: 0;
                left: 0;
                background: white;
                padding: 8px 16px;
                text-decoration: none;
                color: #1a202c;
                border: 2px solid #4299e1;
                border-radius: 4px;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .shortcut-hint {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                font-size: 14px;
                z-index: 9999;
                animation: fadeIn 0.3s ease;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            @media (prefers-reduced-motion: reduce) {
                * {
                    animation: none !important;
                    transition: none !important;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * ショートカットヒントの表示
     */
    function showShortcutHint(key) {
        const hint = document.createElement('div');
        hint.className = 'shortcut-hint';
        hint.textContent = `ショートカットモード: ${key}... (h=ホーム, a=概要, c=お問い合わせ)`;
        document.body.appendChild(hint);
        
        setTimeout(() => hint.remove(), 2000);
    }
    
    /**
     * ショートカットモードのリセット
     */
    function resetShortcutMode() {
        shortcutMode = null;
        if (shortcutTimer) {
            clearTimeout(shortcutTimer);
            shortcutTimer = null;
        }
    }
    
    /**
     * 動的なタブインデックス管理
     */
    function manageDynamicTabIndex() {
        // 非表示要素のタブインデックスを無効化
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const element = mutation.target;
                    if (element.classList.contains('hidden') || element.style.display === 'none') {
                        element.setAttribute('tabindex', '-1');
                    } else {
                        element.removeAttribute('tabindex');
                    }
                }
            });
        });
        
        // 監視対象の設定
        observer.observe(document.body, {
            attributes: true,
            subtree: true,
            attributeFilter: ['class', 'style']
        });
    }
    
    /**
     * スクリーンリーダー用のアナウンス
     */
    function announceElementInfo(element) {
        // ARIA live regionを使用してアナウンス
        let announcer = document.getElementById('keyboard-announcer');
        if (!announcer) {
            announcer = document.createElement('div');
            announcer.id = 'keyboard-announcer';
            announcer.setAttribute('aria-live', 'polite');
            announcer.setAttribute('aria-atomic', 'true');
            announcer.className = 'sr-only';
            document.body.appendChild(announcer);
        }
        
        // 要素の情報をアナウンス
        const label = element.getAttribute('aria-label') || element.textContent;
        if (label) {
            announcer.textContent = `フォーカス: ${label}`;
        }
    }
    
    // ヘルプダイアログの表示（?キー）
    document.addEventListener('keydown', function(e) {
        if (e.key === '?' && !isTyping()) {
            e.preventDefault();
            showKeyboardHelp();
        }
    });
    
    /**
     * キーボードヘルプの表示
     */
    function showKeyboardHelp() {
        const helpDialog = document.createElement('div');
        helpDialog.innerHTML = `
            <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full" role="dialog" aria-label="キーボードショートカット">
                    <h2 class="text-xl font-bold mb-4">キーボードショートカット</h2>
                    <table class="w-full text-sm">
                        <tr><td class="py-1"><kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">?</kbd></td><td>このヘルプを表示</td></tr>
                        <tr><td class="py-1"><kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">h</kbd></td><td>ヘッダーへ移動</td></tr>
                        <tr><td class="py-1"><kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">m</kbd></td><td>メインコンテンツへ移動</td></tr>
                        <tr><td class="py-1"><kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">f</kbd></td><td>フッターへ移動</td></tr>
                        <tr><td class="py-1"><kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">/</kbd></td><td>検索にフォーカス</td></tr>
                        <tr><td class="py-1"><kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">g h</kbd></td><td>ホームへ移動</td></tr>
                        <tr><td class="py-1"><kbd class="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded">Esc</kbd></td><td>ダイアログを閉じる</td></tr>
                    </table>
                    <button class="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500">
                        閉じる
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(helpDialog);
        
        // 閉じるボタンとEscキーの処理
        const closeButton = helpDialog.querySelector('button');
        closeButton.focus();
        closeButton.addEventListener('click', () => helpDialog.remove());
        
        helpDialog.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                helpDialog.remove();
            }
        });
    }
})();