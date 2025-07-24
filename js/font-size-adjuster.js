/**
 * フォントサイズ調整機能
 * ユーザーが読みやすいフォントサイズ、行間、文字間を調整できる機能
 */

(function() {
    'use strict';

    // デフォルト設定
    const FONT_SIZE_KEY = 'keigo-jp-font-size';
    const LINE_HEIGHT_KEY = 'keigo-jp-line-height';
    const LETTER_SPACING_KEY = 'keigo-jp-letter-spacing';
    
    const DEFAULT_FONT_SIZE = 100; // パーセント
    const MIN_FONT_SIZE = 80;
    const MAX_FONT_SIZE = 140;
    const FONT_SIZE_STEP = 10;
    
    const DEFAULT_LINE_HEIGHT = 1.8;
    const MIN_LINE_HEIGHT = 1.4;
    const MAX_LINE_HEIGHT = 2.2;
    const LINE_HEIGHT_STEP = 0.2;
    
    const DEFAULT_LETTER_SPACING = 0.05; // em
    const MIN_LETTER_SPACING = 0;
    const MAX_LETTER_SPACING = 0.15;
    const LETTER_SPACING_STEP = 0.05;

    // 現在の設定を保持
    let currentSettings = {
        fontSize: DEFAULT_FONT_SIZE,
        lineHeight: DEFAULT_LINE_HEIGHT,
        letterSpacing: DEFAULT_LETTER_SPACING
    };

    // 設定を読み込む
    function loadSettings() {
        const savedFontSize = localStorage.getItem(FONT_SIZE_KEY);
        const savedLineHeight = localStorage.getItem(LINE_HEIGHT_KEY);
        const savedLetterSpacing = localStorage.getItem(LETTER_SPACING_KEY);
        
        if (savedFontSize) {
            currentSettings.fontSize = parseInt(savedFontSize);
        }
        if (savedLineHeight) {
            currentSettings.lineHeight = parseFloat(savedLineHeight);
        }
        if (savedLetterSpacing) {
            currentSettings.letterSpacing = parseFloat(savedLetterSpacing);
        }
    }

    // 設定を保存する
    function saveSettings() {
        localStorage.setItem(FONT_SIZE_KEY, currentSettings.fontSize);
        localStorage.setItem(LINE_HEIGHT_KEY, currentSettings.lineHeight);
        localStorage.setItem(LETTER_SPACING_KEY, currentSettings.letterSpacing);
    }

    // 設定を適用する
    function applySettings() {
        const contentElements = document.querySelectorAll('.content, article, main p, main li, main td, main th');
        
        contentElements.forEach(element => {
            // フォントサイズを適用（相対的に）
            const baseFontSize = parseFloat(window.getComputedStyle(element).fontSize);
            const newFontSize = (baseFontSize * currentSettings.fontSize / 100) + 'px';
            element.style.fontSize = newFontSize;
            
            // 行間を適用
            element.style.lineHeight = currentSettings.lineHeight;
            
            // 文字間を適用
            element.style.letterSpacing = currentSettings.letterSpacing + 'em';
        });
        
        // ルート要素にもカスタムプロパティとして設定
        document.documentElement.style.setProperty('--custom-font-size', currentSettings.fontSize + '%');
        document.documentElement.style.setProperty('--custom-line-height', currentSettings.lineHeight);
        document.documentElement.style.setProperty('--custom-letter-spacing', currentSettings.letterSpacing + 'em');
    }

    // フォントサイズを変更
    function changeFontSize(delta) {
        const newSize = currentSettings.fontSize + delta;
        if (newSize >= MIN_FONT_SIZE && newSize <= MAX_FONT_SIZE) {
            currentSettings.fontSize = newSize;
            saveSettings();
            applySettings();
            updateUI();
            
            // スクリーンリーダー用のアナウンス
            announceChange(`フォントサイズが${currentSettings.fontSize}%に変更されました`);
        }
    }

    // 行間を変更
    function changeLineHeight(delta) {
        const newHeight = Math.round((currentSettings.lineHeight + delta) * 10) / 10;
        if (newHeight >= MIN_LINE_HEIGHT && newHeight <= MAX_LINE_HEIGHT) {
            currentSettings.lineHeight = newHeight;
            saveSettings();
            applySettings();
            updateUI();
            
            announceChange(`行間が${currentSettings.lineHeight}に変更されました`);
        }
    }

    // 文字間を変更
    function changeLetterSpacing(delta) {
        const newSpacing = Math.round((currentSettings.letterSpacing + delta) * 100) / 100;
        if (newSpacing >= MIN_LETTER_SPACING && newSpacing <= MAX_LETTER_SPACING) {
            currentSettings.letterSpacing = newSpacing;
            saveSettings();
            applySettings();
            updateUI();
            
            announceChange(`文字間隔が${currentSettings.letterSpacing}emに変更されました`);
        }
    }

    // デフォルトに戻す
    function resetToDefault() {
        currentSettings = {
            fontSize: DEFAULT_FONT_SIZE,
            lineHeight: DEFAULT_LINE_HEIGHT,
            letterSpacing: DEFAULT_LETTER_SPACING
        };
        saveSettings();
        applySettings();
        updateUI();
        
        announceChange('読みやすさの設定がデフォルトに戻されました');
    }

    // スクリーンリーダー用のアナウンス
    function announceChange(message) {
        const announcement = document.createElement('div');
        announcement.setAttribute('role', 'status');
        announcement.setAttribute('aria-live', 'polite');
        announcement.className = 'sr-only';
        announcement.textContent = message;
        document.body.appendChild(announcement);
        
        setTimeout(() => {
            document.body.removeChild(announcement);
        }, 1000);
    }

    // UIを更新
    function updateUI() {
        const fontSizeDisplay = document.getElementById('font-size-display');
        const lineHeightDisplay = document.getElementById('line-height-display');
        const letterSpacingDisplay = document.getElementById('letter-spacing-display');
        
        if (fontSizeDisplay) {
            fontSizeDisplay.textContent = currentSettings.fontSize + '%';
        }
        if (lineHeightDisplay) {
            lineHeightDisplay.textContent = currentSettings.lineHeight;
        }
        if (letterSpacingDisplay) {
            letterSpacingDisplay.textContent = currentSettings.letterSpacing + 'em';
        }
        
        // ボタンの有効/無効を更新
        updateButtonStates();
    }

    // ボタンの有効/無効状態を更新
    function updateButtonStates() {
        const decreaseFontBtn = document.getElementById('decrease-font-size');
        const increaseFontBtn = document.getElementById('increase-font-size');
        const decreaseLineBtn = document.getElementById('decrease-line-height');
        const increaseLineBtn = document.getElementById('increase-line-height');
        const decreaseSpacingBtn = document.getElementById('decrease-letter-spacing');
        const increaseSpacingBtn = document.getElementById('increase-letter-spacing');
        
        if (decreaseFontBtn) {
            decreaseFontBtn.disabled = currentSettings.fontSize <= MIN_FONT_SIZE;
        }
        if (increaseFontBtn) {
            increaseFontBtn.disabled = currentSettings.fontSize >= MAX_FONT_SIZE;
        }
        if (decreaseLineBtn) {
            decreaseLineBtn.disabled = currentSettings.lineHeight <= MIN_LINE_HEIGHT;
        }
        if (increaseLineBtn) {
            increaseLineBtn.disabled = currentSettings.lineHeight >= MAX_LINE_HEIGHT;
        }
        if (decreaseSpacingBtn) {
            decreaseSpacingBtn.disabled = currentSettings.letterSpacing <= MIN_LETTER_SPACING;
        }
        if (increaseSpacingBtn) {
            increaseSpacingBtn.disabled = currentSettings.letterSpacing >= MAX_LETTER_SPACING;
        }
    }

    // 読みやすさ設定パネルのHTMLを作成
    function createReadabilityPanel() {
        const panel = document.createElement('div');
        panel.id = 'readability-panel';
        panel.className = 'readability-panel hidden';
        panel.setAttribute('role', 'region');
        panel.setAttribute('aria-label', '読みやすさの設定');
        
        panel.innerHTML = `
            <div class="readability-panel-header">
                <h3>読みやすさの設定</h3>
                <button id="close-readability-panel" class="close-btn" aria-label="閉じる">
                    <span aria-hidden="true">&times;</span>
                </button>
            </div>
            <div class="readability-panel-content">
                <div class="readability-setting">
                    <label>フォントサイズ</label>
                    <div class="setting-controls">
                        <button id="decrease-font-size" class="control-btn" aria-label="フォントサイズを小さくする">
                            <span aria-hidden="true">−</span>
                        </button>
                        <span id="font-size-display" class="setting-value">${currentSettings.fontSize}%</span>
                        <button id="increase-font-size" class="control-btn" aria-label="フォントサイズを大きくする">
                            <span aria-hidden="true">＋</span>
                        </button>
                    </div>
                </div>
                <div class="readability-setting">
                    <label>行間</label>
                    <div class="setting-controls">
                        <button id="decrease-line-height" class="control-btn" aria-label="行間を狭くする">
                            <span aria-hidden="true">−</span>
                        </button>
                        <span id="line-height-display" class="setting-value">${currentSettings.lineHeight}</span>
                        <button id="increase-line-height" class="control-btn" aria-label="行間を広くする">
                            <span aria-hidden="true">＋</span>
                        </button>
                    </div>
                </div>
                <div class="readability-setting">
                    <label>文字間隔</label>
                    <div class="setting-controls">
                        <button id="decrease-letter-spacing" class="control-btn" aria-label="文字間隔を狭くする">
                            <span aria-hidden="true">−</span>
                        </button>
                        <span id="letter-spacing-display" class="setting-value">${currentSettings.letterSpacing}em</span>
                        <button id="increase-letter-spacing" class="control-btn" aria-label="文字間隔を広くする">
                            <span aria-hidden="true">＋</span>
                        </button>
                    </div>
                </div>
                <div class="readability-actions">
                    <button id="reset-readability" class="reset-btn">デフォルトに戻す</button>
                </div>
            </div>
        `;
        
        return panel;
    }

    // 読みやすさ設定ボタンを作成
    function createReadabilityButton() {
        const button = document.createElement('button');
        button.id = 'open-readability-settings';
        button.className = 'readability-btn';
        button.setAttribute('aria-label', '読みやすさの設定を開く');
        button.innerHTML = `
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"></path>
            </svg>
            <span class="readability-btn-text">読みやすさ</span>
        `;
        
        return button;
    }

    // イベントリスナーを設定
    function setupEventListeners() {
        // 読みやすさ設定ボタン
        const openBtn = document.getElementById('open-readability-settings');
        const closeBtn = document.getElementById('close-readability-panel');
        const panel = document.getElementById('readability-panel');
        
        if (openBtn && panel) {
            openBtn.addEventListener('click', () => {
                panel.classList.toggle('hidden');
                if (!panel.classList.contains('hidden')) {
                    closeBtn.focus();
                }
            });
        }
        
        if (closeBtn && panel) {
            closeBtn.addEventListener('click', () => {
                panel.classList.add('hidden');
                openBtn.focus();
            });
        }
        
        // フォントサイズ調整
        document.getElementById('decrease-font-size')?.addEventListener('click', () => changeFontSize(-FONT_SIZE_STEP));
        document.getElementById('increase-font-size')?.addEventListener('click', () => changeFontSize(FONT_SIZE_STEP));
        
        // 行間調整
        document.getElementById('decrease-line-height')?.addEventListener('click', () => changeLineHeight(-LINE_HEIGHT_STEP));
        document.getElementById('increase-line-height')?.addEventListener('click', () => changeLineHeight(LINE_HEIGHT_STEP));
        
        // 文字間隔調整
        document.getElementById('decrease-letter-spacing')?.addEventListener('click', () => changeLetterSpacing(-LETTER_SPACING_STEP));
        document.getElementById('increase-letter-spacing')?.addEventListener('click', () => changeLetterSpacing(LETTER_SPACING_STEP));
        
        // リセットボタン
        document.getElementById('reset-readability')?.addEventListener('click', resetToDefault);
        
        // Escapeキーで閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && panel && !panel.classList.contains('hidden')) {
                panel.classList.add('hidden');
                openBtn.focus();
            }
        });
        
        // パネル外クリックで閉じる
        document.addEventListener('click', (e) => {
            if (panel && !panel.classList.contains('hidden') && 
                !panel.contains(e.target) && 
                e.target !== openBtn && 
                !openBtn.contains(e.target)) {
                panel.classList.add('hidden');
            }
        });
    }

    // 初期化
    function init() {
        // 設定を読み込む
        loadSettings();
        
        // DOMContentLoadedを待つ
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', setupUI);
        } else {
            setupUI();
        }
    }

    function setupUI() {
        // ナビゲーションバーに読みやすさ設定ボタンを追加
        const darkModeButton = document.querySelector('[onclick="toggleDarkMode()"]');
        if (darkModeButton && !document.getElementById('open-readability-settings')) {
            const readabilityButton = createReadabilityButton();
            const separator = document.createElement('span');
            separator.className = 'text-white mx-2';
            separator.setAttribute('aria-hidden', 'true');
            separator.textContent = '|';
            
            // ダークモードボタンの後に追加
            const container = darkModeButton.parentElement;
            if (container) {
                container.appendChild(separator);
                container.appendChild(readabilityButton);
            }
        }
        
        // 読みやすさ設定パネルを追加
        if (!document.getElementById('readability-panel')) {
            const panel = createReadabilityPanel();
            document.body.appendChild(panel);
        }
        
        // 設定を適用
        applySettings();
        
        // イベントリスナーを設定
        setupEventListeners();
        
        // UIを更新
        updateUI();
    }

    // 初期化を実行
    init();
})();