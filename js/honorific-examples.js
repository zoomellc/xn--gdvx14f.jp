(function() {
    'use strict';

    class HonorificExamplesManager {
        constructor() {
            this.examplesData = null;
            this.currentScene = 'ビジネス';
            this.currentSubScene = null;
            this.favorites = [];
            this.storageKey = 'honorificExamplesFavorites';
            this.speechSynthesis = window.speechSynthesis;
            this.isSpeaking = false;
            
            this.init();
        }

        async init() {
            try {
                await this.loadExamplesData();
                this.loadFavorites();
                this.setupUI();
                this.attachEventListeners();
                this.displayScene(this.currentScene);
            } catch (error) {
                console.error('Failed to initialize examples:', error);
            }
        }

        async loadExamplesData() {
            try {
                const response = await fetch('/data/honorific-examples.json');
                const data = await response.json();
                this.examplesData = data;
            } catch (error) {
                console.error('Failed to load examples data:', error);
            }
        }

        loadFavorites() {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                this.favorites = JSON.parse(saved);
            }
        }

        saveFavorites() {
            localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));
        }

        setupUI() {
            const containers = document.querySelectorAll('.honorific-examples-interactive');
            
            containers.forEach(container => {
                container.innerHTML = `
                    <div class="examples-container">
                        <div class="examples-header mb-6">
                            <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
                                シーン別敬語例文集
                            </h3>
                            <p class="text-gray-600 dark:text-gray-400 mb-4">
                                様々なシーンでの敬語の使い方を学びましょう
                            </p>
                        </div>
                        
                        <div class="scene-navigation mb-6">
                            <div class="scene-tabs flex gap-2 mb-4 flex-wrap">
                                ${Object.keys(this.examplesData.scenes).map(cat => `
                                    <button class="scene-tab px-4 py-2 rounded-lg border-2 transition-all duration-200 ${cat === this.currentScene ? 'active' : ''}"
                                            data-scene="${cat}">
                                        ${cat}
                                    </button>
                                `).join('')}
                            </div>
                            
                            <div class="subscene-tabs flex gap-2 flex-wrap">
                                <!-- サブシーンタブが動的に挿入されます -->
                            </div>
                        </div>
                        
                        <div class="filter-section mb-4">
                            <div class="flex gap-4 items-center flex-wrap">
                                <input type="text" 
                                       class="search-input flex-1 min-w-[200px] px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 dark:focus:border-blue-400 transition-colors duration-200 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200"
                                       placeholder="例文を検索...">
                                <button class="favorites-only-btn px-4 py-2 border-2 border-gray-300 dark:border-gray-600 rounded-lg hover:border-yellow-500 dark:hover:border-yellow-400 transition-all duration-200">
                                    <span class="flex items-center gap-2">
                                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                        </svg>
                                        お気に入り
                                    </span>
                                </button>
                            </div>
                        </div>
                        
                        <div class="examples-list space-y-4">
                            <!-- 例文カードが動的に挿入されます -->
                        </div>
                        
                        <div class="no-results hidden text-center py-8 text-gray-500 dark:text-gray-400">
                            該当する例文が見つかりませんでした
                        </div>
                    </div>
                `;
            });
        }

        attachEventListeners() {
            document.addEventListener('click', (e) => {
                if (e.target.matches('.scene-tab')) {
                    this.selectScene(e.target.dataset.scene);
                } else if (e.target.matches('.subscene-tab')) {
                    this.selectSubScene(e.target.dataset.subscene);
                } else if (e.target.closest('.speak-btn')) {
                    const card = e.target.closest('.example-card');
                    this.speakExample(card);
                } else if (e.target.closest('.favorite-btn')) {
                    const card = e.target.closest('.example-card');
                    this.toggleFavorite(card.dataset.id);
                } else if (e.target.matches('.favorites-only-btn')) {
                    this.toggleFavoritesOnly(e.target);
                } else if (e.target.matches('.level-btn')) {
                    this.selectLevel(e.target);
                }
            });
            
            document.addEventListener('input', (e) => {
                if (e.target.matches('.search-input')) {
                    this.filterExamples(e.target.value);
                }
            });
        }

        displayScene(sceneName) {
            this.currentScene = sceneName;
            
            // シーンタブの更新
            document.querySelectorAll('.scene-tab').forEach(tab => {
                tab.classList.toggle('active', tab.dataset.scene === sceneName);
                tab.classList.toggle('bg-blue-500', tab.dataset.scene === sceneName);
                tab.classList.toggle('text-white', tab.dataset.scene === sceneName);
                tab.classList.toggle('border-blue-500', tab.dataset.scene === sceneName);
            });
            
            // サブシーンタブの生成
            const subscenes = Object.keys(this.examplesData.scenes[sceneName]);
            const subsceneContainer = document.querySelector('.subscene-tabs');
            
            subsceneContainer.innerHTML = subscenes.map((sub, index) => `
                <button class="subscene-tab px-3 py-1 text-sm rounded-md border transition-all duration-200 ${index === 0 ? 'active bg-gray-700 text-white' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'}"
                        data-subscene="${sub}">
                    ${sub}
                </button>
            `).join('');
            
            // 最初のサブシーンを表示
            this.selectSubScene(subscenes[0]);
        }

        selectSubScene(subsceneName) {
            this.currentSubScene = subsceneName;
            
            // サブシーンタブの更新
            document.querySelectorAll('.subscene-tab').forEach(tab => {
                const isActive = tab.dataset.subscene === subsceneName;
                tab.classList.toggle('active', isActive);
                tab.classList.toggle('bg-gray-700', isActive);
                tab.classList.toggle('text-white', isActive);
                tab.classList.toggle('border-gray-300', !isActive);
                tab.classList.toggle('dark:border-gray-600', !isActive);
            });
            
            // 例文の表示
            this.displayExamples();
        }

        displayExamples() {
            const examples = this.examplesData.scenes[this.currentScene][this.currentSubScene];
            const container = document.querySelector('.examples-list');
            
            container.innerHTML = examples.map(example => this.createExampleCard(example)).join('');
            
            // お気に入り状態の更新
            this.updateFavoriteStates();
        }

        createExampleCard(example) {
            const isFavorite = this.favorites.includes(example.id);
            
            return `
                <div class="example-card bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-transparent hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-300"
                     data-id="${example.id}"
                     data-tags="${example.tags.join(',')}"
                     data-situation="${example.situation.toLowerCase()}">
                    
                    <div class="flex justify-between items-start mb-4">
                        <h4 class="text-lg font-semibold text-gray-800 dark:text-gray-200">
                            ${example.situation}
                        </h4>
                        <div class="flex gap-2">
                            <button class="speak-btn p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                    title="音声で聞く">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clip-rule="evenodd"/>
                                </svg>
                            </button>
                            <button class="favorite-btn p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 ${isFavorite ? 'text-yellow-500' : 'text-gray-400'}"
                                    title="お気に入り">
                                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                    
                    <div class="example-levels space-y-3 mb-4">
                        <div class="level-item" data-level="casual">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="level-label text-xs font-medium px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
                                    カジュアル
                                </span>
                                <button class="level-btn text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                        data-text="${example.casual}">
                                    読み上げ
                                </button>
                            </div>
                            <p class="text-gray-700 dark:text-gray-300 pl-4">
                                「${example.casual}」
                            </p>
                        </div>
                        
                        <div class="level-item" data-level="polite">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="level-label text-xs font-medium px-2 py-1 bg-blue-100 dark:bg-blue-900 rounded">
                                    丁寧
                                </span>
                                <button class="level-btn text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                        data-text="${example.polite}">
                                    読み上げ
                                </button>
                            </div>
                            <p class="text-gray-700 dark:text-gray-300 pl-4">
                                「${example.polite}」
                            </p>
                        </div>
                        
                        <div class="level-item" data-level="formal">
                            <div class="flex items-center gap-2 mb-1">
                                <span class="level-label text-xs font-medium px-2 py-1 bg-purple-100 dark:bg-purple-900 rounded">
                                    フォーマル
                                </span>
                                <button class="level-btn text-sm text-blue-600 dark:text-blue-400 hover:underline"
                                        data-text="${example.formal}">
                                    読み上げ
                                </button>
                            </div>
                            <p class="text-gray-700 dark:text-gray-300 pl-4">
                                「${example.formal}」
                            </p>
                        </div>
                    </div>
                    
                    <div class="explanation bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-3">
                        <p class="text-sm text-blue-700 dark:text-blue-300">
                            💡 ${example.explanation}
                        </p>
                    </div>
                    
                    <div class="tags flex gap-2 flex-wrap">
                        ${example.tags.map(tag => `
                            <span class="tag text-xs px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400">
                                #${tag}
                            </span>
                        `).join('')}
                    </div>
                </div>
            `;
        }

        selectScene(sceneName) {
            this.displayScene(sceneName);
        }

        selectLevel(button) {
            const text = button.dataset.text;
            this.speak(text);
        }

        speakExample(card) {
            const levels = ['casual', 'polite', 'formal'];
            const texts = levels.map(level => {
                const levelItem = card.querySelector(`.level-item[data-level="${level}"] p`);
                return levelItem ? levelItem.textContent.replace(/[「」]/g, '') : '';
            }).filter(text => text);
            
            this.speakSequence(texts);
        }

        speak(text) {
            if (this.isSpeaking) {
                this.speechSynthesis.cancel();
                this.isSpeaking = false;
                return;
            }
            
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'ja-JP';
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            
            utterance.onstart = () => {
                this.isSpeaking = true;
            };
            
            utterance.onend = () => {
                this.isSpeaking = false;
            };
            
            this.speechSynthesis.speak(utterance);
        }

        speakSequence(texts) {
            if (this.isSpeaking) {
                this.speechSynthesis.cancel();
                this.isSpeaking = false;
                return;
            }
            
            let index = 0;
            
            const speakNext = () => {
                if (index >= texts.length) {
                    this.isSpeaking = false;
                    return;
                }
                
                const utterance = new SpeechSynthesisUtterance(texts[index]);
                utterance.lang = 'ja-JP';
                utterance.rate = 0.9;
                utterance.pitch = 1.0;
                
                utterance.onstart = () => {
                    if (index === 0) this.isSpeaking = true;
                };
                
                utterance.onend = () => {
                    index++;
                    setTimeout(speakNext, 500);
                };
                
                this.speechSynthesis.speak(utterance);
            };
            
            speakNext();
        }

        toggleFavorite(exampleId) {
            const index = this.favorites.indexOf(exampleId);
            
            if (index > -1) {
                this.favorites.splice(index, 1);
            } else {
                this.favorites.push(exampleId);
            }
            
            this.saveFavorites();
            this.updateFavoriteStates();
        }

        updateFavoriteStates() {
            document.querySelectorAll('.example-card').forEach(card => {
                const id = card.dataset.id;
                const btn = card.querySelector('.favorite-btn');
                const isFavorite = this.favorites.includes(id);
                
                btn.classList.toggle('text-yellow-500', isFavorite);
                btn.classList.toggle('text-gray-400', !isFavorite);
            });
        }

        toggleFavoritesOnly(button) {
            const isActive = button.classList.contains('active');
            button.classList.toggle('active', !isActive);
            button.classList.toggle('bg-yellow-500', !isActive);
            button.classList.toggle('text-white', !isActive);
            button.classList.toggle('border-yellow-500', !isActive);
            
            this.filterExamples(document.querySelector('.search-input').value);
        }

        filterExamples(searchTerm) {
            const cards = document.querySelectorAll('.example-card');
            const favoritesOnly = document.querySelector('.favorites-only-btn').classList.contains('active');
            const term = searchTerm.toLowerCase();
            let visibleCount = 0;
            
            cards.forEach(card => {
                const id = card.dataset.id;
                const tags = card.dataset.tags;
                const situation = card.dataset.situation;
                const content = card.textContent.toLowerCase();
                
                let shouldShow = true;
                
                // お気に入りフィルター
                if (favoritesOnly && !this.favorites.includes(id)) {
                    shouldShow = false;
                }
                
                // 検索フィルター
                if (term && shouldShow) {
                    shouldShow = content.includes(term) || 
                               tags.includes(term) || 
                               situation.includes(term);
                }
                
                card.style.display = shouldShow ? 'block' : 'none';
                if (shouldShow) visibleCount++;
            });
            
            // 結果なしメッセージの表示
            document.querySelector('.no-results').classList.toggle('hidden', visibleCount > 0);
        }
    }

    // スタイルを追加
    const style = document.createElement('style');
    style.textContent = `
        .scene-tab.active,
        .subscene-tab.active {
            background-color: rgb(59 130 246);
            color: white;
            border-color: rgb(59 130 246);
        }
        
        .favorites-only-btn.active {
            background-color: rgb(245 158 11);
            color: white;
            border-color: rgb(245 158 11);
        }
        
        .example-card {
            animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(10px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .speak-btn:hover svg,
        .favorite-btn:hover svg {
            transform: scale(1.1);
        }
        
        .speak-btn svg,
        .favorite-btn svg {
            transition: transform 0.2s;
        }
    `;
    document.head.appendChild(style);

    // 初期化
    document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector('.honorific-examples-interactive')) {
            new HonorificExamplesManager();
        }
    });
})();