(function() {
    'use strict';

    class HonorificQuizManager {
        constructor() {
            this.quizData = null;
            this.currentLevel = 'beginner';
            this.currentQuiz = null;
            this.currentQuestionIndex = 0;
            this.score = 0;
            this.totalQuestions = 0;
            this.answeredQuestions = [];
            this.wrongAnswers = [];
            this.reviewMode = false;
            this.storageKey = 'honorificQuizData';
            
            this.init();
        }

        async init() {
            try {
                await this.loadQuizData();
                this.loadProgress();
                this.setupEventListeners();
                this.renderLevelSelector();
            } catch (error) {
                console.error('Failed to initialize quiz:', error);
            }
        }

        async loadQuizData() {
            try {
                const response = await fetch('/data/honorific-quiz-data.json');
                const data = await response.json();
                this.quizData = data.quizData;
            } catch (error) {
                console.error('Failed to load quiz data:', error);
                this.quizData = { beginner: [], intermediate: [], advanced: [] };
            }
        }

        loadProgress() {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                const data = JSON.parse(savedData);
                this.score = data.score || 0;
                this.totalQuestions = data.totalQuestions || 0;
                this.wrongAnswers = data.wrongAnswers || [];
                this.updateProgressDisplay();
            }
        }

        saveProgress() {
            const data = {
                score: this.score,
                totalQuestions: this.totalQuestions,
                wrongAnswers: this.wrongAnswers,
                lastUpdated: new Date().toISOString()
            };
            localStorage.setItem(this.storageKey, JSON.stringify(data));
        }

        setupEventListeners() {
            document.addEventListener('click', (e) => {
                if (e.target.matches('.level-selector button')) {
                    this.selectLevel(e.target.dataset.level);
                } else if (e.target.matches('.start-quiz-btn')) {
                    this.startQuiz();
                } else if (e.target.matches('.review-mistakes-btn')) {
                    this.startReviewMode();
                } else if (e.target.matches('.next-question-btn')) {
                    this.nextQuestion();
                } else if (e.target.matches('.finish-quiz-btn')) {
                    this.finishQuiz();
                }
            });
        }

        renderLevelSelector() {
            const quizContainers = document.querySelectorAll('.honorific-quiz-enhanced');
            
            quizContainers.forEach(container => {
                container.innerHTML = `
                    <div class="quiz-header mb-6">
                        <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">敬語クイズ - レベル選択</h3>
                        
                        <div class="level-selector flex gap-4 mb-6">
                            <button data-level="beginner" class="level-btn px-6 py-3 rounded-lg border-2 transition-all duration-200 ${this.currentLevel === 'beginner' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}">
                                初級
                            </button>
                            <button data-level="intermediate" class="level-btn px-6 py-3 rounded-lg border-2 transition-all duration-200 ${this.currentLevel === 'intermediate' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}">
                                中級
                            </button>
                            <button data-level="advanced" class="level-btn px-6 py-3 rounded-lg border-2 transition-all duration-200 ${this.currentLevel === 'advanced' ? 'bg-blue-500 text-white border-blue-500' : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'}">
                                上級
                            </button>
                        </div>
                        
                        <div class="quiz-stats bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
                            <div class="flex justify-between items-center">
                                <div>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">総合スコア</p>
                                    <p class="text-2xl font-bold text-gray-800 dark:text-gray-200">
                                        <span class="score-display">${this.score}</span> / <span class="total-display">${this.totalQuestions}</span>
                                    </p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">正答率</p>
                                    <p class="text-2xl font-bold text-gray-800 dark:text-gray-200">
                                        <span class="accuracy-display">${this.totalQuestions > 0 ? Math.round((this.score / this.totalQuestions) * 100) : 0}</span>%
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="action-buttons flex gap-4">
                            <button class="start-quiz-btn px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors duration-200">
                                クイズを開始
                            </button>
                            ${this.wrongAnswers.length > 0 ? `
                                <button class="review-mistakes-btn px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors duration-200">
                                    間違えた問題を復習 (${this.wrongAnswers.length}問)
                                </button>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="quiz-content-area"></div>
                `;
            });
        }

        selectLevel(level) {
            this.currentLevel = level;
            this.renderLevelSelector();
        }

        startQuiz() {
            this.reviewMode = false;
            this.currentQuiz = [...this.quizData[this.currentLevel]];
            this.shuffleArray(this.currentQuiz);
            this.currentQuestionIndex = 0;
            this.answeredQuestions = [];
            this.renderQuestion();
        }

        startReviewMode() {
            this.reviewMode = true;
            this.currentQuiz = this.wrongAnswers.map(id => {
                for (const level of Object.keys(this.quizData)) {
                    const question = this.quizData[level].find(q => q.id === id);
                    if (question) return question;
                }
            }).filter(Boolean);
            
            if (this.currentQuiz.length === 0) {
                alert('復習する問題がありません。');
                return;
            }
            
            this.currentQuestionIndex = 0;
            this.answeredQuestions = [];
            this.renderQuestion();
        }

        renderQuestion() {
            const question = this.currentQuiz[this.currentQuestionIndex];
            const contentArea = document.querySelector('.quiz-content-area');
            
            contentArea.innerHTML = `
                <div class="question-container">
                    <div class="question-header mb-4">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm text-gray-600 dark:text-gray-400">
                                問題 ${this.currentQuestionIndex + 1} / ${this.currentQuiz.length}
                            </span>
                            ${this.reviewMode ? '<span class="text-sm text-orange-600 dark:text-orange-400 font-bold">復習モード</span>' : ''}
                        </div>
                        <div class="progress-bar w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                            <div class="progress-fill h-full bg-gradient-to-r from-purple-400 to-pink-500 rounded-full transition-all duration-500" 
                                 style="width: ${((this.currentQuestionIndex + 1) / this.currentQuiz.length) * 100}%"></div>
                        </div>
                    </div>
                    
                    <div class="question-section mb-6">
                        <p class="text-lg text-gray-700 dark:text-gray-300 font-medium mb-4">
                            ${question.question}
                        </p>
                        
                        ${question.sentence ? `
                            <div class="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 mb-4">
                                <p class="text-gray-800 dark:text-gray-200 font-mono">
                                    「${question.sentence}」
                                </p>
                            </div>
                        ` : ''}
                        
                        ${question.category ? `
                            <span class="inline-block px-3 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full">
                                ${question.category}
                            </span>
                        ` : ''}
                    </div>
                    
                    <div class="options-section space-y-3" data-question-id="${question.id}">
                        ${question.options.map((option, index) => `
                            <button class="quiz-option w-full text-left p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-200"
                                    data-correct="${option.correct}"
                                    data-explanation="${option.explanation || ''}"
                                    data-index="${index}">
                                <div class="flex items-center">
                                    <span class="option-indicator w-8 h-8 rounded-full border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center mr-3 text-sm font-bold">
                                        ${index + 1}
                                    </span>
                                    <span class="option-text text-gray-700 dark:text-gray-300">
                                        ${option.text}
                                    </span>
                                </div>
                            </button>
                        `).join('')}
                    </div>
                    
                    <div class="result-section hidden mt-6">
                        <div class="result-message p-4 rounded-lg mb-4">
                            <p class="text-lg font-bold mb-2"></p>
                            <p class="text-sm"></p>
                        </div>
                        
                        ${question.explanation ? `
                            <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-4">
                                <h4 class="font-bold text-blue-700 dark:text-blue-300 mb-2">解説</h4>
                                <p class="text-sm text-blue-600 dark:text-blue-400">
                                    ${question.explanation}
                                </p>
                            </div>
                        ` : ''}
                        
                        <div class="action-buttons">
                            ${this.currentQuestionIndex < this.currentQuiz.length - 1 ? `
                                <button class="next-question-btn px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors duration-200">
                                    次の問題へ
                                </button>
                            ` : `
                                <button class="finish-quiz-btn px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors duration-200">
                                    クイズを終了
                                </button>
                            `}
                        </div>
                    </div>
                </div>
            `;
            
            this.attachQuestionListeners();
        }

        attachQuestionListeners() {
            const options = document.querySelectorAll('.quiz-option');
            let answered = false;
            
            options.forEach(option => {
                option.addEventListener('click', () => {
                    if (answered) return;
                    
                    answered = true;
                    const questionId = option.closest('.options-section').dataset.questionId;
                    const isCorrect = option.dataset.correct === 'true';
                    const explanation = option.dataset.explanation;
                    
                    this.handleAnswer(questionId, isCorrect);
                    
                    options.forEach(opt => {
                        const indicator = opt.querySelector('.option-indicator');
                        if (opt.dataset.correct === 'true') {
                            opt.classList.add('border-green-500', 'dark:border-green-400', 'bg-green-50', 'dark:bg-green-900/20');
                            indicator.classList.add('bg-green-500', 'text-white');
                            indicator.innerHTML = '✓';
                        } else if (opt === option && !isCorrect) {
                            opt.classList.add('border-red-500', 'dark:border-red-400', 'bg-red-50', 'dark:bg-red-900/20');
                            indicator.classList.add('bg-red-500', 'text-white');
                            indicator.innerHTML = '✗';
                        }
                        opt.disabled = true;
                    });
                    
                    setTimeout(() => {
                        const resultSection = document.querySelector('.result-section');
                        const resultMessage = resultSection.querySelector('.result-message p:first-child');
                        const resultExplanation = resultSection.querySelector('.result-message p:last-child');
                        
                        resultSection.classList.remove('hidden');
                        
                        if (isCorrect) {
                            resultMessage.textContent = '正解です！';
                            resultMessage.className = 'text-lg font-bold mb-2 text-green-600 dark:text-green-400';
                            resultExplanation.textContent = explanation || 'よく理解できています。';
                        } else {
                            resultMessage.textContent = '惜しい！';
                            resultMessage.className = 'text-lg font-bold mb-2 text-red-600 dark:text-red-400';
                            resultExplanation.textContent = explanation || 'もう一度考えてみましょう。';
                        }
                    }, 500);
                });
            });
        }

        handleAnswer(questionId, isCorrect) {
            this.answeredQuestions.push({
                id: questionId,
                correct: isCorrect
            });
            
            if (!this.reviewMode) {
                this.totalQuestions++;
                if (isCorrect) {
                    this.score++;
                    const index = this.wrongAnswers.indexOf(questionId);
                    if (index > -1) {
                        this.wrongAnswers.splice(index, 1);
                    }
                } else {
                    if (!this.wrongAnswers.includes(questionId)) {
                        this.wrongAnswers.push(questionId);
                    }
                }
            } else {
                if (isCorrect) {
                    const index = this.wrongAnswers.indexOf(questionId);
                    if (index > -1) {
                        this.wrongAnswers.splice(index, 1);
                    }
                }
            }
            
            this.saveProgress();
            this.updateProgressDisplay();
        }

        nextQuestion() {
            this.currentQuestionIndex++;
            this.renderQuestion();
        }

        finishQuiz() {
            const correctCount = this.answeredQuestions.filter(q => q.correct).length;
            const totalCount = this.answeredQuestions.length;
            const accuracy = Math.round((correctCount / totalCount) * 100);
            
            const contentArea = document.querySelector('.quiz-content-area');
            contentArea.innerHTML = `
                <div class="quiz-results text-center">
                    <h3 class="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6">
                        ${this.reviewMode ? '復習' : 'クイズ'}結果
                    </h3>
                    
                    <div class="result-stats bg-gray-100 dark:bg-gray-800 rounded-lg p-6 mb-6">
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <p class="text-sm text-gray-600 dark:text-gray-400">正解数</p>
                                <p class="text-3xl font-bold text-green-600 dark:text-green-400">${correctCount}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600 dark:text-gray-400">問題数</p>
                                <p class="text-3xl font-bold text-gray-800 dark:text-gray-200">${totalCount}</p>
                            </div>
                            <div>
                                <p class="text-sm text-gray-600 dark:text-gray-400">正答率</p>
                                <p class="text-3xl font-bold ${accuracy >= 80 ? 'text-green-600 dark:text-green-400' : accuracy >= 60 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}">${accuracy}%</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="result-message mb-6">
                        <p class="text-lg text-gray-700 dark:text-gray-300">
                            ${accuracy >= 80 ? '素晴らしい成績です！敬語をよく理解されています。' :
                              accuracy >= 60 ? 'よく頑張りました！もう少しで完璧です。' :
                              '復習して、もう一度挑戦してみましょう！'}
                        </p>
                    </div>
                    
                    <button class="back-to-menu-btn px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-medium transition-colors duration-200"
                            onclick="location.reload()">
                        メニューに戻る
                    </button>
                </div>
            `;
        }

        updateProgressDisplay() {
            const scoreDisplays = document.querySelectorAll('.score-display');
            const totalDisplays = document.querySelectorAll('.total-display');
            const accuracyDisplays = document.querySelectorAll('.accuracy-display');
            
            scoreDisplays.forEach(el => el.textContent = this.score);
            totalDisplays.forEach(el => el.textContent = this.totalQuestions);
            accuracyDisplays.forEach(el => {
                el.textContent = this.totalQuestions > 0 ? Math.round((this.score / this.totalQuestions) * 100) : 0;
            });
        }

        shuffleArray(array) {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        if (document.querySelector('.honorific-quiz-enhanced')) {
            new HonorificQuizManager();
        }
    });
})();