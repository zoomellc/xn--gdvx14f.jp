(function() {
    'use strict';

    class UserProfile {
        constructor() {
            this.userData = this.loadUserData();
            this.learningData = this.loadLearningData();
            this.commentsData = this.loadCommentsData();
            this.favoritesData = this.loadFavoritesData();
            this.isModalOpen = false;
            
            this.init();
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
                avatar: this.generateAvatar(),
                joinDate: new Date().toISOString(),
                level: 'beginner',
                points: 0,
                achievements: [],
                settings: {
                    emailNotifications: false,
                    displayName: true,
                    publicProfile: false
                }
            };
            this.saveUserData(user);
            return user;
        }

        generateId() {
            return Date.now().toString(36) + Math.random().toString(36).substr(2);
        }

        generateAvatar() {
            const colors = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#fa709a', '#fed330'];
            return colors[Math.floor(Math.random() * colors.length)];
        }

        saveUserData(data) {
            localStorage.setItem('keigo-jp-user', JSON.stringify(data));
            this.userData = data;
        }

        loadLearningData() {
            const saved = localStorage.getItem('keigo-jp-learning-progress');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    return {};
                }
            }
            return {};
        }

        loadCommentsData() {
            const saved = localStorage.getItem('keigo-jp-comments');
            if (saved) {
                try {
                    const allComments = JSON.parse(saved);
                    const userComments = [];
                    Object.entries(allComments).forEach(([articleId, comments]) => {
                        comments.forEach(comment => {
                            if (comment.userId === this.userData.id) {
                                userComments.push({
                                    ...comment,
                                    articleId
                                });
                            }
                        });
                    });
                    return userComments;
                } catch (e) {
                    return [];
                }
            }
            return [];
        }

        loadFavoritesData() {
            const saved = localStorage.getItem('keigo-jp-favorites');
            if (saved) {
                try {
                    return JSON.parse(saved);
                } catch (e) {
                    return [];
                }
            }
            return [];
        }

        async init() {
            this.injectStyles();
            this.createProfileButton();
            this.createProfileModal();
            this.attachEventListeners();
        }

        injectStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .profile-button {
                    position: fixed;
                    top: 80px;
                    right: 20px;
                    background: var(--bg-color, white);
                    border: 2px solid #667eea;
                    color: #667eea;
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
                    transition: all 0.3s ease;
                    z-index: 999;
                    font-weight: bold;
                    font-size: 18px;
                }
                
                .profile-button:hover {
                    background: #667eea;
                    color: white;
                    transform: scale(1.1);
                }
                
                .profile-modal {
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
                
                .profile-modal.show {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .profile-content {
                    background: var(--bg-color, white);
                    max-width: 800px;
                    width: 100%;
                    max-height: 90vh;
                    border-radius: 16px;
                    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                    display: flex;
                    overflow: hidden;
                    animation: slideUp 0.3s ease;
                }
                
                @keyframes slideUp {
                    from {
                        transform: translateY(30px);
                        opacity: 0;
                    }
                    to {
                        transform: translateY(0);
                        opacity: 1;
                    }
                }
                
                .profile-sidebar {
                    width: 250px;
                    background: #f8f9fa;
                    padding: 30px 20px;
                    border-right: 1px solid #e0e0e0;
                }
                
                .profile-main {
                    flex: 1;
                    padding: 30px;
                    overflow-y: auto;
                }
                
                .profile-header {
                    text-align: center;
                    margin-bottom: 30px;
                }
                
                .profile-avatar {
                    width: 80px;
                    height: 80px;
                    border-radius: 50%;
                    margin: 0 auto 15px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-size: 36px;
                    font-weight: bold;
                }
                
                .profile-name {
                    font-size: 20px;
                    font-weight: bold;
                    color: var(--text-color, #333);
                    margin-bottom: 5px;
                }
                
                .profile-level {
                    font-size: 14px;
                    color: var(--text-color-secondary, #666);
                    margin-bottom: 10px;
                }
                
                .profile-points {
                    background: #667eea;
                    color: white;
                    padding: 4px 12px;
                    border-radius: 20px;
                    font-size: 12px;
                    display: inline-block;
                }
                
                .profile-nav {
                    margin-top: 30px;
                }
                
                .profile-nav-item {
                    display: block;
                    width: 100%;
                    padding: 12px 20px;
                    margin-bottom: 5px;
                    border: none;
                    background: transparent;
                    text-align: left;
                    cursor: pointer;
                    color: var(--text-color, #333);
                    border-radius: 8px;
                    transition: all 0.2s;
                }
                
                .profile-nav-item:hover {
                    background: rgba(102, 126, 234, 0.1);
                    color: #667eea;
                }
                
                .profile-nav-item.active {
                    background: #667eea;
                    color: white;
                }
                
                .profile-close {
                    position: absolute;
                    top: 20px;
                    right: 20px;
                    background: none;
                    border: none;
                    font-size: 28px;
                    cursor: pointer;
                    color: var(--text-color-secondary, #999);
                    width: 36px;
                    height: 36px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s;
                }
                
                .profile-close:hover {
                    background: rgba(0, 0, 0, 0.05);
                    color: var(--text-color, #333);
                }
                
                .profile-section {
                    display: none;
                }
                
                .profile-section.active {
                    display: block;
                }
                
                .profile-section-title {
                    font-size: 24px;
                    font-weight: bold;
                    color: var(--text-color, #333);
                    margin-bottom: 20px;
                }
                
                .profile-form {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                
                .profile-form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 5px;
                }
                
                .profile-label {
                    font-size: 14px;
                    font-weight: 500;
                    color: var(--text-color, #333);
                }
                
                .profile-input {
                    padding: 10px 12px;
                    border: 1px solid #e0e0e0;
                    border-radius: 6px;
                    font-size: 14px;
                    transition: border-color 0.2s;
                    background: var(--bg-color, white);
                    color: var(--text-color, #333);
                }
                
                .profile-input:focus {
                    outline: none;
                    border-color: #667eea;
                }
                
                .profile-save-btn {
                    background: #667eea;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 6px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    transition: all 0.2s;
                    align-self: flex-start;
                }
                
                .profile-save-btn:hover {
                    background: #5a67d8;
                    transform: translateY(-1px);
                }
                
                .profile-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin-bottom: 30px;
                }
                
                .profile-stat {
                    background: #f8f9fa;
                    padding: 20px;
                    border-radius: 8px;
                    text-align: center;
                }
                
                .profile-stat-value {
                    font-size: 28px;
                    font-weight: bold;
                    color: #667eea;
                    margin-bottom: 5px;
                }
                
                .profile-stat-label {
                    font-size: 14px;
                    color: var(--text-color-secondary, #666);
                }
                
                .profile-list {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                
                .profile-list-item {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    border: 1px solid #e0e0e0;
                    transition: all 0.2s;
                }
                
                .profile-list-item:hover {
                    border-color: #667eea;
                    transform: translateY(-1px);
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                }
                
                .profile-achievement {
                    display: flex;
                    align-items: center;
                    gap: 15px;
                }
                
                .profile-achievement-icon {
                    width: 48px;
                    height: 48px;
                    background: #667eea;
                    color: white;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 24px;
                }
                
                .profile-achievement-info h4 {
                    font-weight: 500;
                    color: var(--text-color, #333);
                    margin-bottom: 4px;
                }
                
                .profile-achievement-info p {
                    font-size: 12px;
                    color: var(--text-color-secondary, #666);
                }
                
                .profile-empty {
                    text-align: center;
                    padding: 40px;
                    color: var(--text-color-secondary, #666);
                }
                
                @media (max-width: 768px) {
                    .profile-content {
                        flex-direction: column;
                        max-height: 100vh;
                    }
                    
                    .profile-sidebar {
                        width: 100%;
                        border-right: none;
                        border-bottom: 1px solid #e0e0e0;
                        padding: 20px;
                    }
                    
                    .profile-nav {
                        display: flex;
                        overflow-x: auto;
                        margin-top: 20px;
                        gap: 10px;
                    }
                    
                    .profile-nav-item {
                        white-space: nowrap;
                        flex-shrink: 0;
                    }
                    
                    .profile-main {
                        padding: 20px;
                    }
                    
                    .profile-button {
                        top: auto;
                        bottom: 140px;
                    }
                }
                
                @media (prefers-color-scheme: dark) {
                    .profile-sidebar {
                        background: #2a2a2a;
                        border-color: #444;
                    }
                    
                    .profile-content {
                        background: #1e1e1e;
                    }
                    
                    .profile-stat,
                    .profile-list-item {
                        background: #2a2a2a;
                        border-color: #444;
                    }
                    
                    .profile-input {
                        background: #333;
                        border-color: #555;
                        color: #e0e0e0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        createProfileButton() {
            const button = document.createElement('button');
            button.className = 'profile-button';
            button.innerHTML = this.userData.name ? this.userData.name.charAt(0).toUpperCase() : 'P';
            button.style.background = this.userData.avatar;
            button.style.color = 'white';
            button.style.border = 'none';
            button.title = 'プロフィール';
            button.addEventListener('click', () => this.openModal());
            document.body.appendChild(button);
            this.profileButton = button;
        }

        createProfileModal() {
            const modal = document.createElement('div');
            modal.className = 'profile-modal';
            modal.innerHTML = `
                <div class="profile-content">
                    <div class="profile-sidebar">
                        <div class="profile-header">
                            <div class="profile-avatar" style="background: ${this.userData.avatar}">
                                ${this.userData.name ? this.userData.name.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div class="profile-name">${this.userData.name || '未設定'}</div>
                            <div class="profile-level">
                                ${this.getLevelDisplay(this.userData.level)}
                            </div>
                            <div class="profile-points">${this.userData.points} ポイント</div>
                        </div>
                        
                        <nav class="profile-nav">
                            <button class="profile-nav-item active" data-section="overview">
                                概要
                            </button>
                            <button class="profile-nav-item" data-section="profile">
                                プロフィール編集
                            </button>
                            <button class="profile-nav-item" data-section="learning">
                                学習進捗
                            </button>
                            <button class="profile-nav-item" data-section="comments">
                                コメント履歴
                            </button>
                            <button class="profile-nav-item" data-section="favorites">
                                お気に入り
                            </button>
                            <button class="profile-nav-item" data-section="achievements">
                                実績
                            </button>
                        </nav>
                    </div>
                    
                    <div class="profile-main">
                        <button class="profile-close">&times;</button>
                        
                        ${this.createOverviewSection()}
                        ${this.createProfileSection()}
                        ${this.createLearningSection()}
                        ${this.createCommentsSection()}
                        ${this.createFavoritesSection()}
                        ${this.createAchievementsSection()}
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            this.modal = modal;
        }

        createOverviewSection() {
            const joinDate = new Date(this.userData.joinDate);
            const daysActive = Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24));
            
            return `
                <div class="profile-section active" data-section="overview">
                    <h2 class="profile-section-title">概要</h2>
                    
                    <div class="profile-stats">
                        <div class="profile-stat">
                            <div class="profile-stat-value">${daysActive}</div>
                            <div class="profile-stat-label">日間利用</div>
                        </div>
                        <div class="profile-stat">
                            <div class="profile-stat-value">${this.commentsData.length}</div>
                            <div class="profile-stat-label">コメント</div>
                        </div>
                        <div class="profile-stat">
                            <div class="profile-stat-value">${this.favoritesData.length}</div>
                            <div class="profile-stat-label">お気に入り</div>
                        </div>
                        <div class="profile-stat">
                            <div class="profile-stat-value">${this.userData.achievements.length}</div>
                            <div class="profile-stat-label">実績</div>
                        </div>
                    </div>
                    
                    <h3 style="font-size: 18px; font-weight: 500; margin-bottom: 15px;">最近のアクティビティ</h3>
                    <div class="profile-list">
                        ${this.getRecentActivity()}
                    </div>
                </div>
            `;
        }

        createProfileSection() {
            return `
                <div class="profile-section" data-section="profile">
                    <h2 class="profile-section-title">プロフィール編集</h2>
                    
                    <form class="profile-form" id="profile-form">
                        <div class="profile-form-group">
                            <label class="profile-label">表示名</label>
                            <input type="text" class="profile-input" id="profile-name" 
                                   value="${this.userData.name}" placeholder="表示名を入力">
                        </div>
                        
                        <div class="profile-form-group">
                            <label class="profile-label">メールアドレス</label>
                            <input type="email" class="profile-input" id="profile-email" 
                                   value="${this.userData.email}" placeholder="メールアドレスを入力">
                        </div>
                        
                        <div class="profile-form-group">
                            <label class="profile-label">アバターカラー</label>
                            <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                                ${['#667eea', '#764ba2', '#f093fb', '#4facfe', '#fa709a', '#fed330'].map(color => `
                                    <button type="button" class="avatar-color" 
                                            style="width: 40px; height: 40px; border-radius: 50%; 
                                                   background: ${color}; border: 2px solid ${color === this.userData.avatar ? '#333' : 'transparent'}; 
                                                   cursor: pointer;" 
                                            data-color="${color}"></button>
                                `).join('')}
                            </div>
                        </div>
                        
                        <button type="submit" class="profile-save-btn">保存</button>
                    </form>
                </div>
            `;
        }

        createLearningSection() {
            return `
                <div class="profile-section" data-section="learning">
                    <h2 class="profile-section-title">学習進捗</h2>
                    
                    <div class="profile-stats">
                        <div class="profile-stat">
                            <div class="profile-stat-value">${Object.keys(this.learningData).length}</div>
                            <div class="profile-stat-label">完了レッスン</div>
                        </div>
                        <div class="profile-stat">
                            <div class="profile-stat-value">${this.calculateQuizScore()}%</div>
                            <div class="profile-stat-label">クイズ正答率</div>
                        </div>
                    </div>
                    
                    <div class="profile-list">
                        ${this.getLearningHistory()}
                    </div>
                </div>
            `;
        }

        createCommentsSection() {
            return `
                <div class="profile-section" data-section="comments">
                    <h2 class="profile-section-title">コメント履歴</h2>
                    
                    ${this.commentsData.length > 0 ? `
                        <div class="profile-list">
                            ${this.commentsData.slice(0, 10).map(comment => `
                                <div class="profile-list-item">
                                    <div style="margin-bottom: 8px;">
                                        <strong>${this.escapeHtml(comment.content.substring(0, 100))}${comment.content.length > 100 ? '...' : ''}</strong>
                                    </div>
                                    <div style="font-size: 12px; color: var(--text-color-secondary, #666);">
                                        ${this.formatDate(new Date(comment.timestamp))} • ${comment.likes} いいね
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="profile-empty">
                            まだコメントがありません
                        </div>
                    `}
                </div>
            `;
        }

        createFavoritesSection() {
            return `
                <div class="profile-section" data-section="favorites">
                    <h2 class="profile-section-title">お気に入り記事</h2>
                    
                    ${this.favoritesData.length > 0 ? `
                        <div class="profile-list">
                            ${this.favoritesData.map(favorite => `
                                <div class="profile-list-item">
                                    <a href="${favorite.url}" style="text-decoration: none; color: inherit;">
                                        <h4 style="margin-bottom: 8px; color: var(--text-color, #333);">
                                            ${this.escapeHtml(favorite.title)}
                                        </h4>
                                        <p style="font-size: 14px; color: var(--text-color-secondary, #666); margin-bottom: 8px;">
                                            ${this.escapeHtml(favorite.description || '')}
                                        </p>
                                        <div style="font-size: 12px; color: var(--text-color-secondary, #666);">
                                            ${this.formatDate(new Date(favorite.savedAt))}に保存
                                        </div>
                                    </a>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="profile-empty">
                            まだお気に入り記事がありません
                        </div>
                    `}
                </div>
            `;
        }

        createAchievementsSection() {
            const achievements = this.getAchievements();
            
            return `
                <div class="profile-section" data-section="achievements">
                    <h2 class="profile-section-title">実績</h2>
                    
                    ${achievements.length > 0 ? `
                        <div class="profile-list">
                            ${achievements.map(achievement => `
                                <div class="profile-list-item">
                                    <div class="profile-achievement">
                                        <div class="profile-achievement-icon">
                                            ${achievement.icon}
                                        </div>
                                        <div class="profile-achievement-info">
                                            <h4>${achievement.title}</h4>
                                            <p>${achievement.description}</p>
                                        </div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <div class="profile-empty">
                            まだ実績がありません
                        </div>
                    `}
                </div>
            `;
        }

        attachEventListeners() {
            // モーダルの開閉
            this.modal.querySelector('.profile-close').addEventListener('click', () => {
                this.closeModal();
            });
            
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });
            
            // ナビゲーション
            const navItems = this.modal.querySelectorAll('.profile-nav-item');
            const sections = this.modal.querySelectorAll('.profile-section');
            
            navItems.forEach(item => {
                item.addEventListener('click', () => {
                    const targetSection = item.dataset.section;
                    
                    navItems.forEach(nav => nav.classList.remove('active'));
                    sections.forEach(section => section.classList.remove('active'));
                    
                    item.classList.add('active');
                    this.modal.querySelector(`[data-section="${targetSection}"]`).classList.add('active');
                });
            });
            
            // プロフィール編集フォーム
            const profileForm = this.modal.querySelector('#profile-form');
            if (profileForm) {
                profileForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.saveProfile();
                });
                
                // アバターカラー選択
                const colorButtons = profileForm.querySelectorAll('.avatar-color');
                colorButtons.forEach(btn => {
                    btn.addEventListener('click', () => {
                        colorButtons.forEach(b => b.style.border = '2px solid transparent');
                        btn.style.border = '2px solid #333';
                        this.userData.avatar = btn.dataset.color;
                    });
                });
            }
            
            // ESCキーで閉じる
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isModalOpen) {
                    this.closeModal();
                }
            });
        }

        openModal() {
            this.modal.classList.add('show');
            this.isModalOpen = true;
            document.body.style.overflow = 'hidden';
            this.updateModalContent();
        }

        closeModal() {
            this.modal.classList.remove('show');
            this.isModalOpen = false;
            document.body.style.overflow = '';
        }

        updateModalContent() {
            // 最新のデータで更新
            this.commentsData = this.loadCommentsData();
            this.favoritesData = this.loadFavoritesData();
            this.learningData = this.loadLearningData();
            
            // 統計を更新
            const statsElements = this.modal.querySelectorAll('.profile-stat-value');
            if (statsElements.length >= 2) {
                statsElements[1].textContent = this.commentsData.length;
                statsElements[2].textContent = this.favoritesData.length;
            }
        }

        saveProfile() {
            const nameInput = this.modal.querySelector('#profile-name');
            const emailInput = this.modal.querySelector('#profile-email');
            
            this.userData.name = nameInput.value.trim();
            this.userData.email = emailInput.value.trim();
            
            this.saveUserData(this.userData);
            
            // プロフィールボタンとアバターを更新
            this.profileButton.innerHTML = this.userData.name ? this.userData.name.charAt(0).toUpperCase() : 'P';
            this.profileButton.style.background = this.userData.avatar;
            
            const avatar = this.modal.querySelector('.profile-avatar');
            avatar.style.background = this.userData.avatar;
            avatar.innerHTML = this.userData.name ? this.userData.name.charAt(0).toUpperCase() : 'U';
            
            const profileName = this.modal.querySelector('.profile-name');
            profileName.textContent = this.userData.name || '未設定';
            
            // 成功メッセージ（簡易的）
            const saveBtn = this.modal.querySelector('.profile-save-btn');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '保存しました！';
            saveBtn.style.background = '#10b981';
            
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.style.background = '#667eea';
            }, 2000);
        }

        getLevelDisplay(level) {
            const levels = {
                beginner: '初級者',
                intermediate: '中級者',
                advanced: '上級者',
                expert: 'エキスパート'
            };
            return levels[level] || '初級者';
        }

        getRecentActivity() {
            const activities = [];
            
            // 最近のコメント
            if (this.commentsData.length > 0) {
                const latestComment = this.commentsData[0];
                activities.push({
                    type: 'comment',
                    content: `「${latestComment.content.substring(0, 50)}...」にコメント`,
                    date: new Date(latestComment.timestamp)
                });
            }
            
            // 最近のお気に入り
            if (this.favoritesData.length > 0) {
                const latestFavorite = this.favoritesData[0];
                activities.push({
                    type: 'favorite',
                    content: `「${latestFavorite.title}」をお気に入りに追加`,
                    date: new Date(latestFavorite.savedAt)
                });
            }
            
            // ソートして最新5件を表示
            activities.sort((a, b) => b.date - a.date);
            
            if (activities.length === 0) {
                return '<div class="profile-empty">まだアクティビティがありません</div>';
            }
            
            return activities.slice(0, 5).map(activity => `
                <div class="profile-list-item">
                    <div style="font-size: 14px; margin-bottom: 4px;">${this.escapeHtml(activity.content)}</div>
                    <div style="font-size: 12px; color: var(--text-color-secondary, #666);">
                        ${this.formatDate(activity.date)}
                    </div>
                </div>
            `).join('');
        }

        calculateQuizScore() {
            // 学習データからクイズの正答率を計算
            if (!this.learningData.quizResults) return 0;
            
            const results = this.learningData.quizResults;
            const totalQuestions = results.reduce((sum, result) => sum + result.total, 0);
            const correctAnswers = results.reduce((sum, result) => sum + result.correct, 0);
            
            return totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
        }

        getLearningHistory() {
            // 学習履歴を表示
            if (Object.keys(this.learningData).length === 0) {
                return '<div class="profile-empty">まだ学習履歴がありません</div>';
            }
            
            // 実際の学習データがあればここで処理
            return '<div class="profile-empty">学習履歴の詳細は準備中です</div>';
        }

        getAchievements() {
            const achievements = [];
            
            // コメント数による実績
            if (this.commentsData.length >= 1) {
                achievements.push({
                    icon: '💬',
                    title: '初めてのコメント',
                    description: '最初のコメントを投稿しました'
                });
            }
            
            if (this.commentsData.length >= 10) {
                achievements.push({
                    icon: '🗣️',
                    title: 'アクティブコメンター',
                    description: '10件以上のコメントを投稿しました'
                });
            }
            
            // お気に入り数による実績
            if (this.favoritesData.length >= 5) {
                achievements.push({
                    icon: '⭐',
                    title: 'お気に入りコレクター',
                    description: '5件以上の記事をお気に入りに追加しました'
                });
            }
            
            // 利用日数による実績
            const joinDate = new Date(this.userData.joinDate);
            const daysActive = Math.floor((new Date() - joinDate) / (1000 * 60 * 60 * 24));
            
            if (daysActive >= 7) {
                achievements.push({
                    icon: '📅',
                    title: '1週間継続',
                    description: '7日間サイトを利用しました'
                });
            }
            
            if (daysActive >= 30) {
                achievements.push({
                    icon: '🏆',
                    title: '1ヶ月継続',
                    description: '30日間サイトを利用しました'
                });
            }
            
            return achievements;
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
            new UserProfile();
        });
    } else {
        new UserProfile();
    }
})();