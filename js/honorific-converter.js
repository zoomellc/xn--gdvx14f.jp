(function() {
    'use strict';

    class HonorificConverter {
        constructor() {
            this.conversionRules = null;
            this.conversionHistory = [];
            this.maxHistoryItems = 50;
            this.storageKey = 'honorificConverterHistory';
            
            this.init();
        }

        async init() {
            try {
                await this.loadConversionRules();
                this.loadHistory();
                this.setupUI();
                this.attachEventListeners();
            } catch (error) {
                console.error('Failed to initialize converter:', error);
            }
        }

        async loadConversionRules() {
            try {
                const response = await fetch('/data/honorific-conversion-rules.json');
                const data = await response.json();
                this.conversionRules = data;
            } catch (error) {
                console.error('Failed to load conversion rules:', error);
            }
        }

        loadHistory() {
            const savedHistory = localStorage.getItem(this.storageKey);
            if (savedHistory) {
                this.conversionHistory = JSON.parse(savedHistory);
            }
        }

        saveHistory() {
            localStorage.setItem(this.storageKey, JSON.stringify(this.conversionHistory));
        }

        addToHistory(original, converted, type) {
            const historyItem = {
                original,
                converted,
                type,
                timestamp: new Date().toISOString()
            };
            
            this.conversionHistory.unshift(historyItem);
            
            if (this.conversionHistory.length > this.maxHistoryItems) {
                this.conversionHistory = this.conversionHistory.slice(0, this.maxHistoryItems);
            }
            
            this.saveHistory();
            this.updateHistoryDisplay();
        }

        setupUI() {
            const converterElements = document.querySelectorAll('.honorific-converter-tool');
            
            converterElements.forEach(element => {
                element.innerHTML = `
                    <div class="converter-container">
                        <div class="converter-header mb-6">
                            <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">敬語変換ツール</h3>
                            <p class="text-gray-600 dark:text-gray-400">文章を入力すると、リアルタイムで敬語に変換します</p>
                        </div>
                        
                        <div class="conversion-type-selector mb-4">
                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                変換タイプを選択
                            </label>
                            <div class="flex gap-2 flex-wrap">
                                <button class="type-btn px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm" data-type="尊敬語">
                                    尊敬語
                                </button>
                                <button class="type-btn px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm" data-type="謙譲語">
                                    謙譲語
                                </button>
                                <button class="type-btn px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm active" data-type="丁寧語">
                                    丁寧語
                                </button>
                                <button class="type-btn px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm" data-type="auto">
                                    自動判定
                                </button>
                            </div>
                        </div>
                        
                        <div class="converter-input-area mb-6">
                            <div class="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        入力文章
                                    </label>
                                    <textarea 
                                        class="input-text w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                                        rows="6"
                                        placeholder="ここに文章を入力してください..."
                                    ></textarea>
                                    <div class="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        <span class="char-count">0</span> 文字
                                    </div>
                                </div>
                                
                                <div>
                                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        変換結果
                                    </label>
                                    <div class="output-text w-full p-4 border-2 border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 min-h-[152px] text-gray-800 dark:text-gray-200">
                                        <span class="text-gray-400 dark:text-gray-600">変換結果がここに表示されます</span>
                                    </div>
                                    <div class="mt-2 flex justify-between">
                                        <button class="copy-btn text-sm text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed" disabled>
                                            コピー
                                        </button>
                                        <button class="clear-btn text-sm text-red-600 dark:text-red-400 hover:underline">
                                            クリア
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="template-section mb-6">
                            <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">よく使われる例文</h4>
                            <div class="template-tabs mb-3">
                                <button class="template-tab px-4 py-2 text-sm border-b-2 transition-colors duration-200 active" data-category="ビジネスメール">
                                    ビジネスメール
                                </button>
                                <button class="template-tab px-4 py-2 text-sm border-b-2 transition-colors duration-200" data-category="電話応対">
                                    電話応対
                                </button>
                                <button class="template-tab px-4 py-2 text-sm border-b-2 transition-colors duration-200" data-category="日常会話">
                                    日常会話
                                </button>
                            </div>
                            <div class="template-content grid grid-cols-1 md:grid-cols-2 gap-2">
                                <!-- テンプレートが動的に挿入されます -->
                            </div>
                        </div>
                        
                        <div class="history-section">
                            <div class="flex justify-between items-center mb-3">
                                <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200">変換履歴</h4>
                                <button class="clear-history-btn text-sm text-red-600 dark:text-red-400 hover:underline">
                                    履歴をクリア
                                </button>
                            </div>
                            <div class="history-list max-h-64 overflow-y-auto space-y-2">
                                <!-- 履歴が動的に挿入されます -->
                            </div>
                        </div>
                    </div>
                `;
                
                this.updateTemplates('ビジネスメール');
                this.updateHistoryDisplay();
            });
        }

        attachEventListeners() {
            document.addEventListener('input', (e) => {
                if (e.target.matches('.input-text')) {
                    this.handleInput(e.target);
                }
            });
            
            document.addEventListener('click', (e) => {
                if (e.target.matches('.type-btn')) {
                    this.selectConversionType(e.target);
                } else if (e.target.matches('.copy-btn')) {
                    this.copyResult();
                } else if (e.target.matches('.clear-btn')) {
                    this.clearInput();
                } else if (e.target.matches('.template-tab')) {
                    this.selectTemplateCategory(e.target);
                } else if (e.target.matches('.template-btn')) {
                    this.applyTemplate(e.target);
                } else if (e.target.matches('.history-item')) {
                    this.applyHistoryItem(e.target);
                } else if (e.target.matches('.clear-history-btn')) {
                    this.clearHistory();
                }
            });
        }

        handleInput(textarea) {
            const text = textarea.value;
            const charCount = textarea.closest('.converter-input-area').querySelector('.char-count');
            charCount.textContent = text.length;
            
            if (text.trim()) {
                this.convertText(text);
            } else {
                this.clearOutput();
            }
        }

        convertText(text) {
            const activeType = document.querySelector('.type-btn.active').dataset.type;
            let convertedText = text;
            
            if (activeType === 'auto') {
                convertedText = this.autoConvert(text);
            } else {
                convertedText = this.convertByType(text, activeType);
            }
            
            this.updateOutput(convertedText);
            
            if (convertedText !== text) {
                document.querySelector('.copy-btn').disabled = false;
            }
        }

        convertByType(text, type) {
            if (!this.conversionRules || !this.conversionRules.conversionRules[type]) {
                return text;
            }
            
            let convertedText = text;
            const rules = this.conversionRules.conversionRules[type];
            
            Object.entries(rules).forEach(([original, conversions]) => {
                const conversion = conversions[0];
                const regex = new RegExp(original, 'g');
                convertedText = convertedText.replace(regex, conversion);
            });
            
            // 一般的なフレーズの変換
            if (this.conversionRules.commonPhrases) {
                Object.entries(this.conversionRules.commonPhrases).forEach(([original, conversions]) => {
                    const conversion = conversions[0];
                    const regex = new RegExp(original, 'g');
                    convertedText = convertedText.replace(regex, conversion);
                });
            }
            
            return convertedText;
        }

        autoConvert(text) {
            // 簡単な自動判定ロジック
            let convertedText = text;
            
            // まず丁寧語に変換
            convertedText = this.convertByType(convertedText, '丁寧語');
            
            // 文脈に応じて尊敬語・謙譲語を適用
            // これは簡易的な実装で、実際にはより高度な自然言語処理が必要
            
            return convertedText;
        }

        updateOutput(text) {
            const outputElement = document.querySelector('.output-text');
            outputElement.innerHTML = this.highlightChanges(text);
        }

        highlightChanges(text) {
            // 変更された部分をハイライト（この実装は簡易版）
            return text.split('\n').map(line => 
                `<span>${this.escapeHtml(line)}</span>`
            ).join('<br>');
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        clearOutput() {
            const outputElement = document.querySelector('.output-text');
            outputElement.innerHTML = '<span class="text-gray-400 dark:text-gray-600">変換結果がここに表示されます</span>';
            document.querySelector('.copy-btn').disabled = true;
        }

        selectConversionType(button) {
            document.querySelectorAll('.type-btn').forEach(btn => {
                btn.classList.remove('active', 'bg-blue-500', 'text-white', 'border-blue-500');
                btn.classList.add('border-gray-300', 'dark:border-gray-600');
            });
            
            button.classList.add('active', 'bg-blue-500', 'text-white', 'border-blue-500');
            button.classList.remove('border-gray-300', 'dark:border-gray-600');
            
            const inputText = document.querySelector('.input-text').value;
            if (inputText.trim()) {
                this.convertText(inputText);
            }
        }

        copyResult() {
            const outputElement = document.querySelector('.output-text');
            const text = outputElement.textContent;
            
            navigator.clipboard.writeText(text).then(() => {
                const copyBtn = document.querySelector('.copy-btn');
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'コピーしました！';
                
                setTimeout(() => {
                    copyBtn.textContent = originalText;
                }, 2000);
                
                // 履歴に追加
                const inputText = document.querySelector('.input-text').value;
                const activeType = document.querySelector('.type-btn.active').dataset.type;
                this.addToHistory(inputText, text, activeType);
            }).catch(err => {
                console.error('Failed to copy:', err);
            });
        }

        clearInput() {
            document.querySelector('.input-text').value = '';
            document.querySelector('.char-count').textContent = '0';
            this.clearOutput();
        }

        selectTemplateCategory(tab) {
            document.querySelectorAll('.template-tab').forEach(t => {
                t.classList.remove('active', 'border-blue-500', 'text-blue-600', 'dark:text-blue-400');
                t.classList.add('border-transparent');
            });
            
            tab.classList.add('active', 'border-blue-500', 'text-blue-600', 'dark:text-blue-400');
            tab.classList.remove('border-transparent');
            
            this.updateTemplates(tab.dataset.category);
        }

        updateTemplates(category) {
            const templateContent = document.querySelector('.template-content');
            
            if (!this.conversionRules || !this.conversionRules.templates || !this.conversionRules.templates[category]) {
                templateContent.innerHTML = '<p class="text-gray-500 dark:text-gray-400">テンプレートがありません</p>';
                return;
            }
            
            const templates = this.conversionRules.templates[category];
            let html = '';
            
            Object.entries(templates).forEach(([subcategory, items]) => {
                if (Array.isArray(items)) {
                    items.forEach(item => {
                        html += `
                            <button class="template-btn text-left p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 text-sm"
                                    data-text="${this.escapeHtml(item)}">
                                <span class="block font-medium text-gray-700 dark:text-gray-300 mb-1">${subcategory}</span>
                                <span class="text-gray-600 dark:text-gray-400">${item}</span>
                            </button>
                        `;
                    });
                } else {
                    Object.entries(items).forEach(([key, phrases]) => {
                        phrases.forEach(phrase => {
                            html += `
                                <button class="template-btn text-left p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 text-sm"
                                        data-text="${this.escapeHtml(phrase)}">
                                    <span class="block font-medium text-gray-700 dark:text-gray-300 mb-1">${subcategory} - ${key}</span>
                                    <span class="text-gray-600 dark:text-gray-400">${phrase}</span>
                                </button>
                            `;
                        });
                    });
                }
            });
            
            templateContent.innerHTML = html;
        }

        applyTemplate(button) {
            const text = button.dataset.text;
            const inputTextarea = document.querySelector('.input-text');
            
            if (inputTextarea.value && !inputTextarea.value.endsWith('\n')) {
                inputTextarea.value += '\n';
            }
            
            inputTextarea.value += text;
            this.handleInput(inputTextarea);
            inputTextarea.focus();
        }

        updateHistoryDisplay() {
            const historyList = document.querySelector('.history-list');
            
            if (this.conversionHistory.length === 0) {
                historyList.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-4">履歴がありません</p>';
                return;
            }
            
            const html = this.conversionHistory.map(item => {
                const date = new Date(item.timestamp);
                const timeStr = date.toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' });
                
                return `
                    <div class="history-item p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 cursor-pointer"
                         data-original="${this.escapeHtml(item.original)}"
                         data-converted="${this.escapeHtml(item.converted)}">
                        <div class="flex justify-between items-start mb-1">
                            <span class="text-xs text-gray-500 dark:text-gray-400">${timeStr}</span>
                            <span class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                                ${item.type}
                            </span>
                        </div>
                        <div class="text-sm">
                            <div class="text-gray-600 dark:text-gray-400 truncate">
                                元: ${item.original}
                            </div>
                            <div class="text-gray-800 dark:text-gray-200 truncate">
                                変換: ${item.converted}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
            
            historyList.innerHTML = html;
        }

        applyHistoryItem(element) {
            const original = element.dataset.original;
            const inputTextarea = document.querySelector('.input-text');
            
            inputTextarea.value = original;
            this.handleInput(inputTextarea);
            inputTextarea.focus();
        }

        clearHistory() {
            if (confirm('変換履歴をすべて削除しますか？')) {
                this.conversionHistory = [];
                this.saveHistory();
                this.updateHistoryDisplay();
            }
        }
    }

    // スタイルを追加
    const style = document.createElement('style');
    style.textContent = `
        .type-btn.active {
            background-color: rgb(59 130 246);
            color: white;
            border-color: rgb(59 130 246);
        }
        
        .template-tab.active {
            border-color: rgb(59 130 246);
            color: rgb(59 130 246);
        }
        
        .dark .template-tab.active {
            color: rgb(96 165 250);
        }
        
        .history-list::-webkit-scrollbar {
            width: 6px;
        }
        
        .history-list::-webkit-scrollbar-track {
            background: transparent;
        }
        
        .history-list::-webkit-scrollbar-thumb {
            background: rgba(156, 163, 175, 0.5);
            border-radius: 3px;
        }
        
        .dark .history-list::-webkit-scrollbar-thumb {
            background: rgba(75, 85, 99, 0.5);
        }
    `;
    document.head.appendChild(style);

    // 初期化
    document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector('.honorific-converter-tool')) {
            new HonorificConverter();
        }
    });
})();