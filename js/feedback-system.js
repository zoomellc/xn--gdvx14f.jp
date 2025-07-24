(function() {
    'use strict';

    class FeedbackSystem {
        constructor() {
            this.feedbackData = [];
            this.storageKey = 'keigo-jp-feedback';
            this.isOpen = false;
            this.currentFeedback = {
                rating: 0,
                category: '',
                message: '',
                pageUrl: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: null,
                sessionId: this.generateSessionId()
            };
            
            this.init();
        }

        generateSessionId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }

        async init() {
            this.loadFeedbackData();
            this.setupUI();
            this.attachEventListeners();
        }

        loadFeedbackData() {
            const savedData = localStorage.getItem(this.storageKey);
            if (savedData) {
                try {
                    this.feedbackData = JSON.parse(savedData);
                } catch (error) {
                    console.error('Failed to parse feedback data:', error);
                    this.feedbackData = [];
                }
            }
        }

        saveFeedbackData() {
            localStorage.setItem(this.storageKey, JSON.stringify(this.feedbackData));
        }

        setupUI() {
            this.injectStyles();
            this.createFeedbackButton();
            this.createFeedbackModal();
            this.createThankYouMessage();
        }

        injectStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .feedback-button {
                    position: fixed;
                    bottom: 20px;
                    left: 20px;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 30px;
                    padding: 12px 24px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
                    transition: all 0.3s ease;
                    z-index: 998;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                }
                
                .feedback-button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
                }
                
                .feedback-button-icon {
                    font-size: 18px;
                }
                
                .feedback-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: none;
                    z-index: 1000;
                    padding: 20px;
                    overflow-y: auto;
                    backdrop-filter: blur(5px);
                }
                
                .feedback-modal.show {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .feedback-modal-content {
                    background: var(--bg-color, white);
                    max-width: 500px;
                    width: 100%;
                    padding: 30px;
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                    position: relative;
                    animation: slideIn 0.3s ease;
                }
                
                @keyframes slideIn {
                    from {
                        transform: translateY(20px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                .feedback-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                }
                
                .feedback-title {
                    font-size: 24px;
                    font-weight: bold;
                    color: var(--text-color, #333);
                    margin: 0;
                }
                
                .feedback-close {
                    background: none;
                    border: none;
                    font-size: 28px;
                    cursor: pointer;
                    color: var(--text-color-secondary, #999);
                    padding: 0;
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s;
                }
                
                .feedback-close:hover {
                    background: rgba(0, 0, 0, 0.05);
                    color: var(--text-color, #333);
                }
                
                .feedback-form {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                
                .feedback-section {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                
                .feedback-label {
                    font-weight: 500;
                    color: var(--text-color, #333);
                    font-size: 14px;
                }
                
                .feedback-rating {
                    display: flex;
                    gap: 8px;
                    font-size: 28px;
                }
                
                .feedback-star {
                    cursor: pointer;
                    transition: all 0.2s;
                    user-select: none;
                }
                
                .feedback-star:hover {
                    transform: scale(1.2);
                }
                
                .feedback-star.active {
                    color: #fbbf24;
                }
                
                .feedback-star.inactive {
                    color: #e0e0e0;
                }
                
                .feedback-categories {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                }
                
                .feedback-category {
                    padding: 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    background: var(--bg-secondary, #f8f9fa);
                    cursor: pointer;
                    transition: all 0.2s;
                    text-align: center;
                    font-size: 14px;
                    color: var(--text-color, #333);
                }
                
                .feedback-category:hover {
                    border-color: #667eea;
                    background: rgba(102, 126, 234, 0.05);
                }
                
                .feedback-category.selected {
                    border-color: #667eea;
                    background: #667eea;
                    color: white;
                }
                
                .feedback-textarea {
                    width: 100%;
                    min-height: 120px;
                    padding: 12px;
                    border: 2px solid #e0e0e0;
                    border-radius: 8px;
                    font-size: 14px;
                    resize: vertical;
                    font-family: inherit;
                    transition: border-color 0.2s;
                    background: var(--bg-color, white);
                    color: var(--text-color, #333);
                }
                
                .feedback-textarea:focus {
                    outline: none;
                    border-color: #667eea;
                }
                
                .feedback-actions {
                    display: flex;
                    gap: 12px;
                    justify-content: flex-end;
                    margin-top: 10px;
                }
                
                .feedback-btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .feedback-btn-primary {
                    background: #667eea;
                    color: white;
                }
                
                .feedback-btn-primary:hover {
                    background: #5a67d8;
                    transform: translateY(-1px);
                }
                
                .feedback-btn-primary:disabled {
                    background: #cbd5e0;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .feedback-btn-secondary {
                    background: transparent;
                    color: var(--text-color, #333);
                    border: 2px solid #e0e0e0;
                }
                
                .feedback-btn-secondary:hover {
                    background: rgba(0, 0, 0, 0.05);
                }
                
                .feedback-optional {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-size: 14px;
                    color: var(--text-color-secondary, #666);
                }
                
                .feedback-checkbox {
                    width: 18px;
                    height: 18px;
                    cursor: pointer;
                }
                
                .feedback-info {
                    font-size: 12px;
                    color: var(--text-color-secondary, #666);
                    margin-top: 15px;
                    padding: 12px;
                    background: rgba(102, 126, 234, 0.05);
                    border-radius: 6px;
                    line-height: 1.5;
                }
                
                .feedback-thankyou {
                    position: fixed;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: var(--bg-color, white);
                    padding: 40px;
                    border-radius: 16px;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                    text-align: center;
                    z-index: 1001;
                    display: none;
                    animation: fadeIn 0.3s ease;
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                
                .feedback-thankyou.show {
                    display: block;
                }
                
                .feedback-thankyou-icon {
                    font-size: 48px;
                    margin-bottom: 20px;
                }
                
                .feedback-thankyou-title {
                    font-size: 24px;
                    font-weight: bold;
                    color: var(--text-color, #333);
                    margin-bottom: 10px;
                }
                
                .feedback-thankyou-message {
                    color: var(--text-color-secondary, #666);
                    margin-bottom: 20px;
                }
                
                .feedback-admin-button {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: #4b5563;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 48px;
                    height: 48px;
                    font-size: 20px;
                    cursor: pointer;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
                    transition: all 0.3s ease;
                    z-index: 997;
                }
                
                .feedback-admin-button:hover {
                    transform: scale(1.1);
                    background: #374151;
                }
                
                @media (max-width: 768px) {
                    .feedback-button {
                        bottom: 80px;
                        padding: 10px 20px;
                        font-size: 13px;
                    }
                    
                    .feedback-modal-content {
                        padding: 20px;
                        margin: 20px;
                    }
                    
                    .feedback-categories {
                        grid-template-columns: 1fr;
                    }
                    
                    .feedback-title {
                        font-size: 20px;
                    }
                }
                
                @media (prefers-color-scheme: dark) {
                    .feedback-modal-content,
                    .feedback-thankyou {
                        background: #1e1e1e;
                    }
                    
                    .feedback-textarea,
                    .feedback-category {
                        background: #2a2a2a;
                        border-color: #444;
                        color: #e0e0e0;
                    }
                    
                    .feedback-category:hover {
                        border-color: #667eea;
                        background: rgba(102, 126, 234, 0.1);
                    }
                    
                    .feedback-star.inactive {
                        color: #555;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        createFeedbackButton() {
            const button = document.createElement('button');
            button.className = 'feedback-button';
            button.innerHTML = `
                <span class="feedback-button-icon">💬</span>
                <span>フィードバック</span>
            `;
            button.addEventListener('click', () => this.openModal());
            document.body.appendChild(button);
        }

        createFeedbackModal() {
            const modal = document.createElement('div');
            modal.className = 'feedback-modal';
            modal.innerHTML = `
                <div class="feedback-modal-content">
                    <div class="feedback-header">
                        <h2 class="feedback-title">フィードバックをお聞かせください</h2>
                        <button class="feedback-close">&times;</button>
                    </div>
                    
                    <form class="feedback-form">
                        <div class="feedback-section">
                            <label class="feedback-label">サイトの満足度を教えてください</label>
                            <div class="feedback-rating">
                                ${[1, 2, 3, 4, 5].map(i => 
                                    `<span class="feedback-star inactive" data-rating="${i}">★</span>`
                                ).join('')}
                            </div>
                        </div>
                        
                        <div class="feedback-section">
                            <label class="feedback-label">フィードバックの種類</label>
                            <div class="feedback-categories">
                                <div class="feedback-category" data-category="bug">
                                    🐛 バグ報告
                                </div>
                                <div class="feedback-category" data-category="feature">
                                    💡 機能リクエスト
                                </div>
                                <div class="feedback-category" data-category="content">
                                    📝 コンテンツ
                                </div>
                                <div class="feedback-category" data-category="other">
                                    💭 その他
                                </div>
                            </div>
                        </div>
                        
                        <div class="feedback-section">
                            <label class="feedback-label">詳細なフィードバック</label>
                            <textarea 
                                class="feedback-textarea" 
                                placeholder="ご意見・ご要望をお聞かせください..."
                                maxlength="1000"
                            ></textarea>
                        </div>
                        
                        <div class="feedback-optional">
                            <input type="checkbox" class="feedback-checkbox" id="include-page-info">
                            <label for="include-page-info">現在のページ情報を含める</label>
                        </div>
                        
                        <div class="feedback-actions">
                            <button type="button" class="feedback-btn feedback-btn-secondary cancel-btn">
                                キャンセル
                            </button>
                            <button type="submit" class="feedback-btn feedback-btn-primary submit-btn" disabled>
                                送信
                            </button>
                        </div>
                        
                        <div class="feedback-info">
                            フィードバックはブラウザのローカルストレージに保存されます。個人情報は収集されません。
                        </div>
                    </form>
                </div>
            `;
            document.body.appendChild(modal);
            
            this.modal = modal;
            this.form = modal.querySelector('.feedback-form');
            this.ratingStars = modal.querySelectorAll('.feedback-star');
            this.categories = modal.querySelectorAll('.feedback-category');
            this.textarea = modal.querySelector('.feedback-textarea');
            this.submitBtn = modal.querySelector('.submit-btn');
            this.includePageInfo = modal.querySelector('#include-page-info');
        }

        createThankYouMessage() {
            const thankyou = document.createElement('div');
            thankyou.className = 'feedback-thankyou';
            thankyou.innerHTML = `
                <div class="feedback-thankyou-icon">🎉</div>
                <div class="feedback-thankyou-title">ありがとうございました！</div>
                <div class="feedback-thankyou-message">
                    貴重なフィードバックをいただき、ありがとうございます。<br>
                    サイトの改善に活用させていただきます。
                </div>
                <button class="feedback-btn feedback-btn-primary close-thankyou">
                    閉じる
                </button>
            `;
            document.body.appendChild(thankyou);
            this.thankyouMessage = thankyou;
        }

        attachEventListeners() {
            // モーダルを閉じる
            this.modal.querySelector('.feedback-close').addEventListener('click', () => {
                this.closeModal();
            });
            
            this.modal.querySelector('.cancel-btn').addEventListener('click', () => {
                this.closeModal();
            });
            
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });
            
            // 評価の選択
            this.ratingStars.forEach((star, index) => {
                star.addEventListener('click', () => {
                    this.selectRating(index + 1);
                });
                
                star.addEventListener('mouseenter', () => {
                    this.previewRating(index + 1);
                });
            });
            
            this.modal.querySelector('.feedback-rating').addEventListener('mouseleave', () => {
                this.updateRatingDisplay(this.currentFeedback.rating);
            });
            
            // カテゴリの選択
            this.categories.forEach(category => {
                category.addEventListener('click', () => {
                    this.selectCategory(category.dataset.category);
                });
            });
            
            // テキストエリアの入力
            this.textarea.addEventListener('input', () => {
                this.updateSubmitButton();
            });
            
            // フォームの送信
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitFeedback();
            });
            
            // Thank youメッセージを閉じる
            this.thankyouMessage.querySelector('.close-thankyou').addEventListener('click', () => {
                this.thankyouMessage.classList.remove('show');
            });
            
            // ESCキーで閉じる
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isOpen) {
                    this.closeModal();
                }
            });
            
            // 管理者用ボタン（Ctrl+Shift+F）
            document.addEventListener('keydown', (e) => {
                if (e.ctrlKey && e.shiftKey && e.key === 'F') {
                    e.preventDefault();
                    this.showAdminPanel();
                }
            });
        }

        selectRating(rating) {
            this.currentFeedback.rating = rating;
            this.updateRatingDisplay(rating);
            this.updateSubmitButton();
        }

        previewRating(rating) {
            this.updateRatingDisplay(rating);
        }

        updateRatingDisplay(rating) {
            this.ratingStars.forEach((star, index) => {
                if (index < rating) {
                    star.classList.add('active');
                    star.classList.remove('inactive');
                } else {
                    star.classList.remove('active');
                    star.classList.add('inactive');
                }
            });
        }

        selectCategory(category) {
            this.currentFeedback.category = category;
            this.categories.forEach(cat => {
                if (cat.dataset.category === category) {
                    cat.classList.add('selected');
                } else {
                    cat.classList.remove('selected');
                }
            });
            this.updateSubmitButton();
        }

        updateSubmitButton() {
            const isValid = this.currentFeedback.rating > 0 && 
                           this.currentFeedback.category && 
                           this.textarea.value.trim().length > 0;
            this.submitBtn.disabled = !isValid;
        }

        openModal() {
            this.modal.classList.add('show');
            this.isOpen = true;
            document.body.style.overflow = 'hidden';
            this.resetForm();
        }

        closeModal() {
            this.modal.classList.remove('show');
            this.isOpen = false;
            document.body.style.overflow = '';
        }

        resetForm() {
            this.currentFeedback = {
                rating: 0,
                category: '',
                message: '',
                pageUrl: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: null,
                sessionId: this.generateSessionId()
            };
            
            this.updateRatingDisplay(0);
            this.categories.forEach(cat => cat.classList.remove('selected'));
            this.textarea.value = '';
            this.includePageInfo.checked = true;
            this.submitBtn.disabled = true;
        }

        submitFeedback() {
            this.currentFeedback.message = this.textarea.value.trim();
            this.currentFeedback.timestamp = new Date().toISOString();
            
            if (!this.includePageInfo.checked) {
                delete this.currentFeedback.pageUrl;
                delete this.currentFeedback.userAgent;
            }
            
            this.feedbackData.push({...this.currentFeedback});
            this.saveFeedbackData();
            
            this.closeModal();
            this.showThankYou();
            
            // アナリティクスイベントを送信（もし設定されていれば）
            if (typeof gtag !== 'undefined') {
                gtag('event', 'feedback_submitted', {
                    'event_category': 'engagement',
                    'event_label': this.currentFeedback.category,
                    'value': this.currentFeedback.rating
                });
            }
        }

        showThankYou() {
            this.thankyouMessage.classList.add('show');
            setTimeout(() => {
                this.thankyouMessage.classList.remove('show');
            }, 3000);
        }

        showAdminPanel() {
            const adminButton = document.createElement('button');
            adminButton.className = 'feedback-admin-button';
            adminButton.innerHTML = '📊';
            adminButton.title = 'フィードバック管理';
            adminButton.addEventListener('click', () => this.exportFeedback());
            document.body.appendChild(adminButton);
            
            setTimeout(() => {
                adminButton.remove();
            }, 10000);
        }

        exportFeedback() {
            if (this.feedbackData.length === 0) {
                alert('フィードバックデータがありません');
                return;
            }
            
            const dataStr = JSON.stringify(this.feedbackData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `feedback-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }

    // 初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new FeedbackSystem();
        });
    } else {
        new FeedbackSystem();
    }
})();