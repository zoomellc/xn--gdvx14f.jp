(function() {
    'use strict';

    class HonorificDictionary {
        constructor() {
            this.entries = [];
            this.filteredEntries = [];
            this.categories = {};
            this.types = {};
            this.currentFilter = {
                search: '',
                category: 'all',
                type: 'all',
                tags: []
            };
            this.favorites = [];
            this.history = [];
            this.storageKey = 'keigo-jp-dictionary';
            
            this.init();
        }

        async init() {
            try {
                await this.loadDictionaryData();
                this.loadUserData();
                this.setupUI();
                this.attachEventListeners();
                this.updateDisplay();
            } catch (error) {
                console.error('Failed to initialize dictionary:', error);
                this.showError('辞書の初期化に失敗しました');
            }
        }

        async loadDictionaryData() {
            try {
                const response = await fetch('/data/honorific-dictionary.json');
                if (!response.ok) throw new Error('Failed to load dictionary data');
                
                const data = await response.json();
                this.entries = data.entries;
                this.categories = data.categories;
                this.types = data.types;
                this.filteredEntries = [...this.entries];
            } catch (error) {
                console.error('Error loading dictionary:', error);
                throw error;
            }
        }

        loadUserData() {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                try {
                    const data = JSON.parse(savedData);
                    this.favorites = data.favorites || [];
                    this.history = data.history || [];
                } catch (error) {
                    console.error('Failed to parse user data:', error);
                }
            }
        }

        saveUserData() {
            const data = {
                favorites: this.favorites,
                history: this.history.slice(0, 50) // 最新50件のみ保存
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        }

        setupUI() {
            this.injectStyles();
            this.createDictionaryContainer();
        }

        injectStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .honorific-dictionary {
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                }
                
                .dictionary-header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 30px;
                    border-radius: 10px;
                    margin-bottom: 30px;
                    text-align: center;
                }
                
                .dictionary-title {
                    font-size: 2.5em;
                    margin: 0 0 10px 0;
                    font-weight: bold;
                }
                
                .dictionary-subtitle {
                    font-size: 1.1em;
                    opacity: 0.9;
                }
                
                .dictionary-controls {
                    background: var(--bg-color, #f8f9fa);
                    padding: 20px;
                    border-radius: 10px;
                    margin-bottom: 20px;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                }
                
                .search-container {
                    position: relative;
                    margin-bottom: 15px;
                }
                
                .dictionary-search {
                    width: 100%;
                    padding: 12px 40px 12px 15px;
                    font-size: 16px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    transition: border-color 0.3s;
                }
                
                .dictionary-search:focus {
                    outline: none;
                    border-color: #667eea;
                }
                
                .search-icon {
                    position: absolute;
                    right: 12px;
                    top: 50%;
                    transform: translateY(-50%);
                    color: #999;
                }
                
                .filter-container {
                    display: flex;
                    gap: 15px;
                    flex-wrap: wrap;
                }
                
                .filter-select {
                    flex: 1;
                    min-width: 150px;
                    padding: 10px;
                    border: 2px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 14px;
                    background: white;
                    cursor: pointer;
                }
                
                .dictionary-stats {
                    text-align: center;
                    color: #666;
                    margin-bottom: 20px;
                    font-size: 14px;
                }
                
                .dictionary-content {
                    display: grid;
                    gap: 15px;
                }
                
                .dictionary-entry {
                    background: var(--bg-color, white);
                    border: 1px solid #e0e0e0;
                    border-radius: 10px;
                    padding: 20px;
                    transition: all 0.3s ease;
                    position: relative;
                }
                
                .dictionary-entry:hover {
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                    transform: translateY(-2px);
                }
                
                .entry-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: start;
                    margin-bottom: 15px;
                }
                
                .entry-word {
                    font-size: 1.8em;
                    font-weight: bold;
                    color: #333;
                    margin: 0;
                }
                
                .entry-reading {
                    font-size: 1em;
                    color: #666;
                    margin-left: 10px;
                }
                
                .entry-actions {
                    display: flex;
                    gap: 10px;
                }
                
                .entry-action-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 50%;
                    transition: background-color 0.3s;
                    color: #666;
                }
                
                .entry-action-btn:hover {
                    background-color: rgba(0,0,0,0.05);
                }
                
                .entry-action-btn.favorite.active {
                    color: #f59e0b;
                }
                
                .entry-metadata {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 15px;
                    flex-wrap: wrap;
                }
                
                .entry-category, .entry-tag {
                    display: inline-block;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    font-weight: 500;
                }
                
                .entry-category {
                    background: #e3f2fd;
                    color: #1976d2;
                }
                
                .entry-tag {
                    background: #f3e5f5;
                    color: #7b1fa2;
                }
                
                .entry-meaning {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 20px;
                    line-height: 1.6;
                }
                
                .entry-forms {
                    display: grid;
                    gap: 15px;
                }
                
                .form-section {
                    background: var(--bg-secondary, #f8f9fa);
                    padding: 15px;
                    border-radius: 8px;
                }
                
                .form-type {
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 8px;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .form-type-icon {
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    color: white;
                }
                
                .form-type-icon.respectful {
                    background: #4caf50;
                }
                
                .form-type-icon.humble {
                    background: #ff9800;
                }
                
                .form-type-icon.polite {
                    background: #2196f3;
                }
                
                .form-list {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 8px;
                    margin-bottom: 8px;
                }
                
                .form-item {
                    background: white;
                    padding: 6px 12px;
                    border-radius: 6px;
                    border: 1px solid #e0e0e0;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .form-item:hover {
                    background: #667eea;
                    color: white;
                    border-color: #667eea;
                }
                
                .form-usage {
                    font-size: 13px;
                    color: #666;
                    margin-bottom: 8px;
                    font-style: italic;
                }
                
                .form-examples {
                    font-size: 13px;
                    color: #555;
                    line-height: 1.6;
                }
                
                .example-item {
                    padding: 4px 0;
                    border-left: 3px solid #667eea;
                    padding-left: 12px;
                    margin-bottom: 4px;
                }
                
                .entry-notes {
                    margin-top: 15px;
                    padding: 12px;
                    background: #fff3cd;
                    border-radius: 6px;
                    font-size: 13px;
                    color: #856404;
                }
                
                .entry-related {
                    margin-top: 15px;
                    font-size: 13px;
                }
                
                .related-words {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 6px;
                    margin-top: 5px;
                }
                
                .related-word {
                    background: #e8eaf6;
                    color: #3f51b5;
                    padding: 4px 10px;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: background-color 0.2s;
                }
                
                .related-word:hover {
                    background: #c5cae9;
                }
                
                .dictionary-empty {
                    text-align: center;
                    padding: 60px 20px;
                    color: #999;
                }
                
                .dictionary-empty-icon {
                    font-size: 48px;
                    margin-bottom: 20px;
                }
                
                .dictionary-empty-text {
                    font-size: 18px;
                    margin-bottom: 10px;
                }
                
                .dictionary-empty-hint {
                    font-size: 14px;
                    color: #666;
                }
                
                .dictionary-loading {
                    text-align: center;
                    padding: 40px;
                    color: #666;
                }
                
                .dictionary-error {
                    text-align: center;
                    padding: 40px;
                    color: #d32f2f;
                    background: #ffebee;
                    border-radius: 8px;
                }
                
                .copy-notification {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #333;
                    color: white;
                    padding: 12px 24px;
                    border-radius: 6px;
                    font-size: 14px;
                    opacity: 0;
                    transition: opacity 0.3s;
                    pointer-events: none;
                    z-index: 1000;
                }
                
                .copy-notification.show {
                    opacity: 1;
                }
                
                @media (max-width: 768px) {
                    .honorific-dictionary {
                        padding: 10px;
                    }
                    
                    .dictionary-header {
                        padding: 20px;
                    }
                    
                    .dictionary-title {
                        font-size: 2em;
                    }
                    
                    .filter-container {
                        flex-direction: column;
                    }
                    
                    .entry-word {
                        font-size: 1.5em;
                    }
                }
                
                @media (prefers-color-scheme: dark) {
                    .honorific-dictionary {
                        --bg-color: #1e1e1e;
                        --bg-secondary: #2a2a2a;
                        color: #e0e0e0;
                    }
                    
                    .dictionary-controls {
                        background: var(--bg-secondary);
                    }
                    
                    .dictionary-search,
                    .filter-select {
                        background: var(--bg-color);
                        color: #e0e0e0;
                        border-color: #444;
                    }
                    
                    .dictionary-entry {
                        background: var(--bg-secondary);
                        border-color: #444;
                    }
                    
                    .entry-word {
                        color: #e0e0e0;
                    }
                    
                    .form-item {
                        background: var(--bg-color);
                        border-color: #555;
                        color: #e0e0e0;
                    }
                    
                    .form-item:hover {
                        background: #667eea;
                        color: white;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        createDictionaryContainer() {
            const container = document.querySelector('.honorific-dictionary-container');
            if (!container) return;

            container.innerHTML = `
                <div class="honorific-dictionary">
                    <div class="dictionary-header">
                        <h1 class="dictionary-title">敬語辞書</h1>
                        <p class="dictionary-subtitle">敬語の正しい使い方を調べることができます</p>
                    </div>
                    
                    <div class="dictionary-controls">
                        <div class="search-container">
                            <input type="text" class="dictionary-search" placeholder="単語を検索...">
                            <span class="search-icon">🔍</span>
                        </div>
                        
                        <div class="filter-container">
                            <select class="filter-select filter-category">
                                <option value="all">すべてのカテゴリ</option>
                                ${Object.entries(this.categories).map(([key, value]) => 
                                    `<option value="${key}">${key}</option>`
                                ).join('')}
                            </select>
                            
                            <select class="filter-select filter-type">
                                <option value="all">すべての種類</option>
                                <option value="respectful">尊敬語のみ</option>
                                <option value="humble">謙譲語のみ</option>
                                <option value="polite">丁寧語のみ</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="dictionary-stats"></div>
                    
                    <div class="dictionary-content"></div>
                    
                    <div class="copy-notification">コピーしました</div>
                </div>
            `;

            this.elements = {
                search: container.querySelector('.dictionary-search'),
                categoryFilter: container.querySelector('.filter-category'),
                typeFilter: container.querySelector('.filter-type'),
                stats: container.querySelector('.dictionary-stats'),
                content: container.querySelector('.dictionary-content'),
                notification: container.querySelector('.copy-notification')
            };
        }

        attachEventListeners() {
            if (!this.elements) return;

            // 検索入力
            this.elements.search.addEventListener('input', (e) => {
                this.currentFilter.search = e.target.value;
                this.filterEntries();
            });

            // カテゴリフィルター
            this.elements.categoryFilter.addEventListener('change', (e) => {
                this.currentFilter.category = e.target.value;
                this.filterEntries();
            });

            // 種類フィルター
            this.elements.typeFilter.addEventListener('change', (e) => {
                this.currentFilter.type = e.target.value;
                this.filterEntries();
            });

            // キーボードショートカット
            document.addEventListener('keydown', (e) => {
                if (e.key === '/' && e.target.tagName !== 'INPUT') {
                    e.preventDefault();
                    this.elements.search.focus();
                }
            });
        }

        filterEntries() {
            const { search, category, type } = this.currentFilter;
            
            this.filteredEntries = this.entries.filter(entry => {
                // 検索フィルター
                if (search) {
                    const searchLower = search.toLowerCase();
                    const matchWord = entry.word.includes(searchLower);
                    const matchReading = entry.reading.includes(searchLower);
                    const matchMeaning = entry.meaning.includes(searchLower);
                    const matchTags = entry.tags.some(tag => tag.includes(searchLower));
                    
                    if (!matchWord && !matchReading && !matchMeaning && !matchTags) {
                        return false;
                    }
                }
                
                // カテゴリフィルター
                if (category !== 'all' && entry.category !== category) {
                    return false;
                }
                
                // 種類フィルター
                if (type !== 'all') {
                    if (type === 'respectful' && (!entry.respectful || entry.respectful.forms.length === 0)) return false;
                    if (type === 'humble' && (!entry.humble || entry.humble.forms.length === 0)) return false;
                    if (type === 'polite' && (!entry.polite || entry.polite.forms.length === 0)) return false;
                }
                
                return true;
            });
            
            this.updateDisplay();
        }

        updateDisplay() {
            if (!this.elements) return;
            
            // 統計情報の更新
            this.elements.stats.textContent = `${this.filteredEntries.length}件の結果`;
            
            // コンテンツの更新
            if (this.filteredEntries.length === 0) {
                this.elements.content.innerHTML = `
                    <div class="dictionary-empty">
                        <div class="dictionary-empty-icon">📚</div>
                        <div class="dictionary-empty-text">該当する単語が見つかりません</div>
                        <div class="dictionary-empty-hint">別のキーワードで検索してみてください</div>
                    </div>
                `;
                return;
            }
            
            this.elements.content.innerHTML = this.filteredEntries.map(entry => 
                this.createEntryHTML(entry)
            ).join('');
            
            // イベントリスナーの追加
            this.attachEntryEventListeners();
        }

        createEntryHTML(entry) {
            const isFavorite = this.favorites.includes(entry.id);
            
            return `
                <div class="dictionary-entry" data-id="${entry.id}">
                    <div class="entry-header">
                        <div>
                            <span class="entry-word">${entry.word}</span>
                            <span class="entry-reading">${entry.reading}</span>
                        </div>
                        <div class="entry-actions">
                            <button class="entry-action-btn favorite ${isFavorite ? 'active' : ''}" 
                                    title="お気に入り" data-id="${entry.id}">
                                ${isFavorite ? '★' : '☆'}
                            </button>
                            <button class="entry-action-btn copy" title="コピー" data-word="${entry.word}">
                                📋
                            </button>
                            <button class="entry-action-btn speak" title="読み上げ" data-text="${entry.word}">
                                🔊
                            </button>
                        </div>
                    </div>
                    
                    <div class="entry-metadata">
                        <span class="entry-category">${entry.category}</span>
                        ${entry.tags.map(tag => `<span class="entry-tag">${tag}</span>`).join('')}
                    </div>
                    
                    <div class="entry-meaning">${entry.meaning}</div>
                    
                    <div class="entry-forms">
                        ${entry.respectful && entry.respectful.forms.length > 0 ? `
                            <div class="form-section">
                                <div class="form-type">
                                    <span class="form-type-icon respectful">尊</span>
                                    尊敬語
                                </div>
                                <div class="form-list">
                                    ${entry.respectful.forms.map(form => 
                                        `<span class="form-item" data-text="${form}">${form}</span>`
                                    ).join('')}
                                </div>
                                ${entry.respectful.usage ? 
                                    `<div class="form-usage">${entry.respectful.usage}</div>` : ''}
                                ${entry.respectful.examples && entry.respectful.examples.length > 0 ? `
                                    <div class="form-examples">
                                        ${entry.respectful.examples.map(ex => 
                                            `<div class="example-item">${ex}</div>`
                                        ).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                        
                        ${entry.humble && entry.humble.forms.length > 0 ? `
                            <div class="form-section">
                                <div class="form-type">
                                    <span class="form-type-icon humble">謙</span>
                                    謙譲語
                                </div>
                                <div class="form-list">
                                    ${entry.humble.forms.map(form => 
                                        `<span class="form-item" data-text="${form}">${form}</span>`
                                    ).join('')}
                                </div>
                                ${entry.humble.usage ? 
                                    `<div class="form-usage">${entry.humble.usage}</div>` : ''}
                                ${entry.humble.examples && entry.humble.examples.length > 0 ? `
                                    <div class="form-examples">
                                        ${entry.humble.examples.map(ex => 
                                            `<div class="example-item">${ex}</div>`
                                        ).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                        
                        ${entry.polite && entry.polite.forms.length > 0 ? `
                            <div class="form-section">
                                <div class="form-type">
                                    <span class="form-type-icon polite">丁</span>
                                    丁寧語
                                </div>
                                <div class="form-list">
                                    ${entry.polite.forms.map(form => 
                                        `<span class="form-item" data-text="${form}">${form}</span>`
                                    ).join('')}
                                </div>
                                ${entry.polite.usage ? 
                                    `<div class="form-usage">${entry.polite.usage}</div>` : ''}
                                ${entry.polite.examples && entry.polite.examples.length > 0 ? `
                                    <div class="form-examples">
                                        ${entry.polite.examples.map(ex => 
                                            `<div class="example-item">${ex}</div>`
                                        ).join('')}
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                    
                    ${entry.notes ? `
                        <div class="entry-notes">
                            <strong>注意:</strong> ${entry.notes}
                        </div>
                    ` : ''}
                    
                    ${entry.related && entry.related.length > 0 ? `
                        <div class="entry-related">
                            <strong>関連語:</strong>
                            <div class="related-words">
                                ${entry.related.map(word => 
                                    `<span class="related-word" data-word="${word}">${word}</span>`
                                ).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        attachEntryEventListeners() {
            // お気に入りボタン
            document.querySelectorAll('.entry-action-btn.favorite').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const id = e.target.dataset.id;
                    this.toggleFavorite(id);
                });
            });

            // コピーボタン
            document.querySelectorAll('.entry-action-btn.copy').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const word = e.target.dataset.word;
                    this.copyToClipboard(word);
                });
            });

            // 読み上げボタン
            document.querySelectorAll('.entry-action-btn.speak').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const text = e.target.dataset.text;
                    this.speak(text);
                });
            });

            // 形式のコピー
            document.querySelectorAll('.form-item').forEach(item => {
                item.addEventListener('click', (e) => {
                    const text = e.target.dataset.text;
                    this.copyToClipboard(text);
                });
            });

            // 関連語のクリック
            document.querySelectorAll('.related-word').forEach(word => {
                word.addEventListener('click', (e) => {
                    const searchWord = e.target.dataset.word;
                    this.elements.search.value = searchWord;
                    this.currentFilter.search = searchWord;
                    this.filterEntries();
                    this.elements.search.scrollIntoView({ behavior: 'smooth', block: 'center' });
                });
            });
        }

        toggleFavorite(id) {
            const index = this.favorites.indexOf(id);
            if (index > -1) {
                this.favorites.splice(index, 1);
            } else {
                this.favorites.push(id);
            }
            this.saveUserData();
            this.updateDisplay();
        }

        copyToClipboard(text) {
            if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(() => {
                    this.showNotification('コピーしました');
                }).catch(err => {
                    console.error('Copy failed:', err);
                });
            } else {
                // フォールバック
                const textarea = document.createElement('textarea');
                textarea.value = text;
                textarea.style.position = 'fixed';
                textarea.style.opacity = '0';
                document.body.appendChild(textarea);
                textarea.select();
                try {
                    document.execCommand('copy');
                    this.showNotification('コピーしました');
                } catch (err) {
                    console.error('Copy failed:', err);
                }
                document.body.removeChild(textarea);
            }
        }

        speak(text) {
            if ('speechSynthesis' in window) {
                // 既存の音声を停止
                window.speechSynthesis.cancel();
                
                const utterance = new SpeechSynthesisUtterance(text);
                utterance.lang = 'ja-JP';
                utterance.rate = 0.9;
                utterance.pitch = 1.0;
                
                window.speechSynthesis.speak(utterance);
            }
        }

        showNotification(message) {
            this.elements.notification.textContent = message;
            this.elements.notification.classList.add('show');
            
            setTimeout(() => {
                this.elements.notification.classList.remove('show');
            }, 2000);
        }

        showError(message) {
            if (this.elements && this.elements.content) {
                this.elements.content.innerHTML = `
                    <div class="dictionary-error">
                        <p>${message}</p>
                    </div>
                `;
            }
        }
    }

    // 初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (document.querySelector('.honorific-dictionary-container')) {
                new HonorificDictionary();
            }
        });
    } else {
        if (document.querySelector('.honorific-dictionary-container')) {
            new HonorificDictionary();
        }
    }

    // グローバルに公開
    window.HonorificDictionary = HonorificDictionary;
})();