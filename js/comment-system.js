(function() {
    'use strict';

    class CommentSystem {
        constructor() {
            this.comments = [];
            this.storageKey = 'keigo-jp-comments';
            this.articleId = this.getArticleId();
            this.currentUser = this.loadUserData();
            
            this.init();
        }

        getArticleId() {
            // ページのURLからアーティクルIDを生成
            const path = window.location.pathname;
            return path.replace(/\//g, '-').replace(/^-|-$/g, '') || 'home';
        }

        loadUserData() {
            const saved = localStorage.getItem('keigo-jp-user');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    return this.createNewUser();
                }
            }
            return this.createNewUser();
        }

        createNewUser() {
            const user = {
                id: this.generateId(),
                name: '',
                email: '',
                avatar: this.generateAvatar()
            };
            localStorage.setItem('keigo-jp-user', JSON.stringify(user));
            return user;
        }

        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }

        generateAvatar() {
            const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#fa709a', '#fed330'];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        async init() {
            this.loadComments();
            this.setupUI();
            this.attachEventListeners();
            this.renderComments();
        }

        loadComments() {
            const allComments = localStorage.getItem(this.storageKey);
            if (allComments) {
                try {
                    const parsed = JSON.parse(allComments);
                    this.comments = parsed[this.articleId] || [];
                } catch (error) {
                    console.error('Failed to parse comments:', error);
                    this.comments = [];
                }
            }
        }

        saveComments() {
            const allComments = localStorage.getItem(this.storageKey);
            let parsed = {};
            
            if (allComments) {
                try {
                    parsed = JSON.parse(allComments);
                } catch (error) {
                    console.error('Failed to parse existing comments:', error);
                }
            }
            
            parsed[this.articleId] = this.comments;
            localStorage.setItem(this.storageKey, JSON.stringify(parsed));
        }

        setupUI() {
            this.injectStyles();
            this.createCommentSection();
        }

        injectStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .comment-section {
                    margin: 40px 0;
                    padding: 30px;
                    background: var(--bg-color, #f8f9fa);
                    border-radius: 12px;
                }
                
                .comment-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 25px;
                }
                
                .comment-title {
                    font-size: 24px;
                    font-weight: bold;
                    color: var(--text-color, #333);
                    margin: 0;
                }
                
                .comment-count {
                    color: var(--text-color-secondary, #666);
                    font-size: 14px;
                }
                
                .comment-form {
                    background: var(--bg-color, white);
                    padding: 20px;
                    border-radius: 8px;
                    margin-bottom: 30px;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                }
                
                .comment-user-info {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 15px;
                }
                
                .comment-input {
                    width: 100%;
                    padding: 10px 12px;
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 14px;
                    font-family: inherit;
                    transition: border-color 0.2s;
                    background: var(--bg-color, white);
                    color: var(--text-color, #333);
                }
                
                .comment-input:focus {
                    outline: none;
                    border-color: #667eea;
                }
                
                .comment-textarea {
                    width: 100%;
                    min-height: 100px;
                    padding: 12px;
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 14px;
                    resize: vertical;
                    font-family: inherit;
                    transition: border-color 0.2s;
                    background: var(--bg-color, white);
                    color: var(--text-color, #333);
                    margin-bottom: 15px;
                }
                
                .comment-textarea:focus {
                    outline: none;
                    border-color: #667eea;
                }
                
                .comment-actions {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                
                .comment-guidelines {
                    font-size: 12px;
                    color: var(--text-color-secondary, #666);
                }
                
                .comment-submit {
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 10px 24px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .comment-submit:hover {
                    background: #5a67d8;
                    transform: translateY(-1px);
                }
                
                .comment-submit:disabled {
                    background: #cbd5e0;
                    cursor: not-allowed;
                    transform: none;
                }
                
                .comments-list {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }
                
                .comment-item {
                    background: var(--bg-color, white);
                    padding: 20px;
                    border-radius: 8px;
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    transition: transform 0.2s;
                }
                
                .comment-item:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                
                .comment-meta {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                }
                
                .comment-avatar {
                    width: 40px;
                    height: 40px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 18px;
                }
                
                .comment-author {
                    font-weight: 500;
                    color: var(--text-color, #333);
                }
                
                .comment-date {
                    font-size: 12px;
                    color: var(--text-color-secondary, #666);
                }
                
                .comment-content {
                    color: var(--text-color, #333);
                    line-height: 1.6;
                    white-space: pre-wrap;
                }
                
                .comment-footer {
                    display: flex;
                    gap: 15px;
                    margin-top: 12px;
                }
                
                .comment-action {
                    font-size: 12px;
                    color: var(--text-color-secondary, #666);
                    cursor: pointer;
                    transition: color 0.2s;
                    display: flex;
                    align-items: center;
                    gap: 4px;
                }
                
                .comment-action:hover {
                    color: #667eea;
                }
                
                .comment-action.liked {
                    color: #ef4444;
                }
                
                .comment-reply {
                    margin-left: 50px;
                    margin-top: 15px;
                    padding: 15px;
                    background: rgba(102, 126, 234, 0.05);
                    border-radius: 6px;
                    border-left: 3px solid #667eea;
                }
                
                .comment-empty {
                    text-align: center;
                    padding: 40px;
                    color: var(--text-color-secondary, #666);
                }
                
                .comment-sort {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                
                .comment-sort-btn {
                    padding: 6px 12px;
                    border: 1px solid #e0e0e0;
                    border-radius: 4px;
                    background: var(--bg-color, white);
                    color: var(--text-color, #333);
                    cursor: pointer;
                    font-size: 12px;
                    transition: all 0.2s;
                }
                
                .comment-sort-btn:hover {
                    border-color: #667eea;
                    background: rgba(102, 126, 234, 0.05);
                }
                
                .comment-sort-btn.active {
                    background: #667eea;
                    color: white;
                    border-color: #667eea;
                }
                
                @media (max-width: 768px) {
                    .comment-section {
                        padding: 20px;
                    }
                    
                    .comment-user-info {
                        grid-template-columns: 1fr;
                    }
                    
                    .comment-reply {
                        margin-left: 20px;
                    }
                }
                
                @media (prefers-color-scheme: dark) {
                    .comment-section {
                        background: #1e1e1e;
                    }
                    
                    .comment-form,
                    .comment-item {
                        background: #2a2a2a;
                        border-color: #444;
                    }
                    
                    .comment-input,
                    .comment-textarea {
                        background: #333;
                        border-color: #555;
                        color: #e0e0e0;
                    }
                    
                    .comment-input:focus,
                    .comment-textarea:focus {
                        border-color: #667eea;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        createCommentSection() {
            const container = document.querySelector('.comment-container');
            if (!container) {
                console.warn('Comment container not found');
                return;
            }

            const section = document.createElement('div');
            section.className = 'comment-section';
            section.innerHTML = `
                <div class="comment-header">
                    <h3 class="comment-title">コメント</h3>
                    <span class="comment-count">0件のコメント</span>
                </div>
                
                <div class="comment-form">
                    <form id="comment-form">
                        <div class="comment-user-info">
                            <input 
                                type="text" 
                                class="comment-input" 
                                id="comment-name" 
                                placeholder="お名前（必須）" 
                                required
                                value="${this.currentUser.name}"
                            >
                            <input 
                                type="email" 
                                class="comment-input" 
                                id="comment-email" 
                                placeholder="メールアドレス（任意）"
                                value="${this.currentUser.email}"
                            >
                        </div>
                        <textarea 
                            class="comment-textarea" 
                            id="comment-content" 
                            placeholder="コメントを入力してください..."
                            required
                        ></textarea>
                        <div class="comment-actions">
                            <span class="comment-guidelines">
                                建設的で敬意のあるコメントをお願いします
                            </span>
                            <button type="submit" class="comment-submit" disabled>
                                コメントを投稿
                            </button>
                        </div>
                    </form>
                </div>
                
                <div class="comment-sort">
                    <button class="comment-sort-btn active" data-sort="newest">新しい順</button>
                    <button class="comment-sort-btn" data-sort="oldest">古い順</button>
                    <button class="comment-sort-btn" data-sort="popular">人気順</button>
                </div>
                
                <div class="comments-list" id="comments-list">
                    <div class="comment-empty">
                        まだコメントがありません。最初のコメントを投稿してみましょう！
                    </div>
                </div>
            `;

            container.appendChild(section);
            
            this.form = section.querySelector('#comment-form');
            this.nameInput = section.querySelector('#comment-name');
            this.emailInput = section.querySelector('#comment-email');
            this.contentInput = section.querySelector('#comment-content');
            this.submitBtn = section.querySelector('.comment-submit');
            this.commentsList = section.querySelector('#comments-list');
            this.commentCount = section.querySelector('.comment-count');
            this.sortButtons = section.querySelectorAll('.comment-sort-btn');
        }

        attachEventListeners() {
            if (!this.form) return;

            // フォーム入力の監視
            this.nameInput.addEventListener('input', () => this.validateForm());
            this.contentInput.addEventListener('input', () => this.validateForm());
            
            // ユーザー情報の保存
            this.nameInput.addEventListener('blur', () => this.saveUserInfo());
            this.emailInput.addEventListener('blur', () => this.saveUserInfo());
            
            // フォーム送信
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.submitComment();
            });
            
            // ソートボタン
            this.sortButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    this.sortComments(btn.dataset.sort);
                    this.sortButtons.forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                });
            });
        }

        validateForm() {
            const isValid = this.nameInput.value.trim() && this.contentInput.value.trim();
            this.submitBtn.disabled = !isValid;
        }

        saveUserInfo() {
            this.currentUser.name = this.nameInput.value.trim();
            this.currentUser.email = this.emailInput.value.trim();
            localStorage.setItem('keigo-jp-user', JSON.stringify(this.currentUser));
        }

        submitComment() {
            const comment = {
                id: this.generateId(),
                author: this.nameInput.value.trim(),
                email: this.emailInput.value.trim(),
                content: this.contentInput.value.trim(),
                timestamp: new Date().toISOString(),
                likes: 0,
                likedBy: [],
                replies: [],
                userId: this.currentUser.id,
                avatar: this.currentUser.avatar
            };
            
            this.comments.unshift(comment);
            this.saveComments();
            this.renderComments();
            
            // フォームをリセット
            this.contentInput.value = '';
            this.validateForm();
            
            // スクロールして新しいコメントを表示
            const newComment = this.commentsList.querySelector('.comment-item');
            if (newComment) {
                newComment.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }

        sortComments(sortType) {
            switch (sortType) {
                case 'newest':
                    this.comments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
                    break;
                case 'oldest':
                    this.comments.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
                    break;
                case 'popular':
                    this.comments.sort((a, b) => b.likes - a.likes);
                    break;
            }
            this.renderComments();
        }

        renderComments() {
            this.commentCount.textContent = `${this.comments.length}件のコメント`;
            
            if (this.comments.length === 0) {
                this.commentsList.innerHTML = `
                    <div class="comment-empty">
                        まだコメントがありません。最初のコメントを投稿してみましょう！
                    </div>
                `;
                return;
            }
            
            this.commentsList.innerHTML = this.comments.map(comment => this.renderComment(comment)).join('');
            
            // いいねボタンのイベントリスナーを追加
            this.commentsList.querySelectorAll('.like-btn').forEach(btn => {
                btn.addEventListener('click', () => this.toggleLike(btn.dataset.commentId));
            });
        }

        renderComment(comment) {
            const date = new Date(comment.timestamp);
            const formattedDate = this.formatDate(date);
            const isLiked = comment.likedBy.includes(this.currentUser.id);
            const initial = comment.author.charAt(0).toUpperCase();
            
            return `
                <div class="comment-item" data-comment-id="${comment.id}">
                    <div class="comment-meta">
                        <div class="comment-avatar" style="background: ${comment.avatar}">
                            ${initial}
                        </div>
                        <div>
                            <div class="comment-author">${this.escapeHtml(comment.author)}</div>
                            <div class="comment-date">${formattedDate}</div>
                        </div>
                    </div>
                    <div class="comment-content">${this.escapeHtml(comment.content)}</div>
                    <div class="comment-footer">
                        <span class="comment-action like-btn ${isLiked ? 'liked' : ''}" data-comment-id="${comment.id}">
                            ${isLiked ? '❤️' : '🤍'} ${comment.likes}
                        </span>
                    </div>
                </div>
            `;
        }

        toggleLike(commentId) {
            const comment = this.comments.find(c => c.id === commentId);
            if (!comment) return;
            
            const index = comment.likedBy.indexOf(this.currentUser.id);
            if (index > -1) {
                comment.likedBy.splice(index, 1);
                comment.likes--;
            } else {
                comment.likedBy.push(this.currentUser.id);
                comment.likes++;
            }
            
            this.saveComments();
            this.renderComments();
        }

        formatDate(date) {
            const now = new Date();
            const diff = now - date;
            const minutes = Math.floor(diff / 60000);
            const hours = Math.floor(diff / 3600000);
            const days = Math.floor(diff / 86400000);
            
            if (minutes < 1) return 'たった今';
            if (minutes < 60) return `${minutes}分前`;
            if (hours < 24) return `${hours}時間前`;
            if (days < 7) return `${days}日前`;
            
            return date.toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    }

    // 初期化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new CommentSystem();
        });
    } else {
        new CommentSystem();
    }
})();