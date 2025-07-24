(function() {
    'use strict';

    class FavoritesManager {
        constructor() {
            this.favorites = [];
            this.storageKey = 'keigo-jp-favorites';
            this.maxFavorites = 100;
            
            this.init();
        }

        async init() {
            this.loadFavorites();
            this.setupUI();
            this.attachEventListeners();
            this.updateFavoriteButtons();
        }

        loadFavorites() {
            const savedFavorites = localStorage.getItem(this.storageKey);
            if (savedFavorites) {
                try {
                    this.favorites = JSON.parse(savedFavorites);
                } catch (error) {
                    console.error('Failed to parse favorites:', error);
                    this.favorites = [];
                }
            }
        }

        saveFavorites() {
            localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));
        }

        isFavorite(articleId) {
            return this.favorites.some(fav => fav.id === articleId);
        }

        toggleFavorite(articleData) {
            const index = this.favorites.findIndex(fav => fav.id === articleData.id);
            
            if (index > -1) {
                this.favorites.splice(index, 1);
                this.onFavoriteRemoved(articleData);
            } else {
                if (this.favorites.length >= this.maxFavorites) {
                    this.showMessage('お気に入りの上限に達しました。既存のお気に入りを削除してください。');
                    return;
                }
                this.favorites.unshift({
                    id: articleData.id,
                    title: articleData.title,
                    url: articleData.url,
                    excerpt: articleData.excerpt,
                    savedAt: new Date().toISOString()
                });
                this.onFavoriteAdded(articleData);
            }
            
            this.saveFavorites();
            this.updateFavoriteButtons();
            this.updateFavoritesList();
        }

        onFavoriteAdded(articleData) {
            if ('serviceWorker' in navigator) {
                // Wait for service worker to be ready before sending message
                navigator.serviceWorker.ready.then(registration => {
                    if (registration.active) {
                        registration.active.postMessage({
                            type: 'CACHE_ARTICLE',
                            url: articleData.url
                        });
                    }
                });
            }
            this.showMessage('お気に入りに追加しました');
        }

        onFavoriteRemoved(articleData) {
            if ('serviceWorker' in navigator) {
                // Wait for service worker to be ready before sending message
                navigator.serviceWorker.ready.then(registration => {
                    if (registration.active) {
                        registration.active.postMessage({
                            type: 'UNCACHE_ARTICLE',
                            url: articleData.url
                        });
                    }
                });
            }
            this.showMessage('お気に入りから削除しました');
        }

        setupUI() {
            this.injectStyles();
            this.createFavoriteButtons();
            this.createFavoritesModal();
            this.createMessageContainer();
        }

        injectStyles() {
            const style = document.createElement('style');
            style.textContent = `
                .favorite-button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 8px;
                    border-radius: 50%;
                    transition: all 0.3s ease;
                    display: inline-flex;
                    align-items: center;
                    justify-content: center;
                }
                
                .favorite-button:hover {
                    background-color: rgba(59, 130, 246, 0.1);
                }
                
                .favorite-button svg {
                    width: 24px;
                    height: 24px;
                    fill: none;
                    stroke: #6b7280;
                    stroke-width: 2;
                    transition: all 0.3s ease;
                }
                
                .favorite-button.is-favorite svg {
                    fill: #f59e0b;
                    stroke: #f59e0b;
                }
                
                .favorites-modal {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: rgba(0, 0, 0, 0.5);
                    display: none;
                    z-index: 1000;
                    padding: 20px;
                    overflow-y: auto;
                }
                
                .favorites-modal.show {
                    display: block;
                }
                
                .favorites-modal-content {
                    background-color: var(--bg-color, #ffffff);
                    color: var(--text-color, #000000);
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 30px;
                    border-radius: 10px;
                    position: relative;
                }
                
                .favorites-modal-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 20px;
                }
                
                .favorites-modal-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    cursor: pointer;
                    color: var(--text-color, #000000);
                }
                
                .favorites-list {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }
                
                .favorites-list-item {
                    padding: 15px;
                    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                    display: flex;
                    justify-content: space-between;
                    align-items: start;
                }
                
                .favorites-list-item:last-child {
                    border-bottom: none;
                }
                
                .favorites-item-content {
                    flex: 1;
                    margin-right: 10px;
                }
                
                .favorites-item-title {
                    font-weight: bold;
                    margin-bottom: 5px;
                    color: var(--link-color, #3b82f6);
                    text-decoration: none;
                    display: block;
                }
                
                .favorites-item-title:hover {
                    text-decoration: underline;
                }
                
                .favorites-item-excerpt {
                    font-size: 14px;
                    color: var(--text-color-secondary, #6b7280);
                    margin-bottom: 5px;
                }
                
                .favorites-item-date {
                    font-size: 12px;
                    color: var(--text-color-secondary, #9ca3af);
                }
                
                .favorites-empty {
                    text-align: center;
                    padding: 40px;
                    color: var(--text-color-secondary, #6b7280);
                }
                
                .favorites-fab {
                    position: fixed;
                    bottom: 80px;
                    right: 20px;
                    background-color: #f59e0b;
                    color: white;
                    border: none;
                    border-radius: 50%;
                    width: 56px;
                    height: 56px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    cursor: pointer;
                    z-index: 999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    transition: transform 0.3s ease;
                }
                
                .favorites-fab:hover {
                    transform: scale(1.1);
                }
                
                .favorites-message {
                    position: fixed;
                    top: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background-color: var(--bg-color, #1f2937);
                    color: var(--text-color, #ffffff);
                    padding: 12px 24px;
                    border-radius: 8px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    z-index: 2000;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                }
                
                .favorites-message.show {
                    opacity: 1;
                }
                
                .favorites-export-section {
                    margin-bottom: 20px;
                    text-align: right;
                }
                
                .favorites-export-button {
                    background-color: #3b82f6;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                    transition: background-color 0.3s ease;
                }
                
                .favorites-export-button:hover {
                    background-color: #2563eb;
                }
                
                .favorites-export-options {
                    position: absolute;
                    right: 30px;
                    margin-top: 5px;
                    background-color: var(--bg-color, #ffffff);
                    border: 1px solid rgba(0, 0, 0, 0.1);
                    border-radius: 6px;
                    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
                    z-index: 1001;
                }
                
                .export-option {
                    display: block;
                    width: 100%;
                    padding: 10px 20px;
                    border: none;
                    background: none;
                    color: var(--text-color, #000000);
                    cursor: pointer;
                    text-align: left;
                    font-size: 14px;
                    transition: background-color 0.2s ease;
                }
                
                .export-option:hover {
                    background-color: rgba(59, 130, 246, 0.1);
                }
                
                .export-option:first-child {
                    border-radius: 6px 6px 0 0;
                }
                
                .export-option:last-child {
                    border-radius: 0 0 6px 6px;
                }
            `;
            document.head.appendChild(style);
        }

        createFavoriteButtons() {
            const articles = document.querySelectorAll('article, .article-item, .post-item');
            articles.forEach(article => {
                const titleElement = article.querySelector('h1, h2, h3, .article-title, .post-title');
                const linkElement = article.querySelector('a');
                
                if (titleElement && linkElement) {
                    const button = document.createElement('button');
                    button.className = 'favorite-button';
                    button.innerHTML = `
                        <svg viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    `;
                    
                    const excerptText = article.querySelector('.excerpt, .summary, p')?.textContent?.trim();
                    const articleData = {
                        id: linkElement.href,
                        title: titleElement.textContent.trim(),
                        url: linkElement.href,
                        excerpt: excerptText ? excerptText.substring(0, 100) + '...' : ''
                    };
                    
                    button.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        this.toggleFavorite(articleData);
                    });
                    
                    titleElement.parentNode.insertBefore(button, titleElement.nextSibling);
                }
            });
        }

        createFavoritesModal() {
            const modal = document.createElement('div');
            modal.className = 'favorites-modal';
            modal.innerHTML = `
                <div class="favorites-modal-content">
                    <div class="favorites-modal-header">
                        <h2>お気に入り記事</h2>
                        <button class="favorites-modal-close">&times;</button>
                    </div>
                    <div class="favorites-export-section">
                        <button class="favorites-export-button">エクスポート</button>
                        <div class="favorites-export-options" style="display: none;">
                            <button class="export-option" data-format="json">JSON形式</button>
                            <button class="export-option" data-format="csv">CSV形式</button>
                            <button class="export-option" data-format="markdown">Markdown形式</button>
                            <button class="export-option" data-format="html">HTML形式</button>
                        </div>
                    </div>
                    <div class="favorites-list-container"></div>
                </div>
            `;
            document.body.appendChild(modal);
            
            this.modal = modal;
            this.modalContent = modal.querySelector('.favorites-list-container');
            
            modal.querySelector('.favorites-modal-close').addEventListener('click', () => {
                this.hideModal();
            });
            
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal();
                }
            });
            
            // エクスポートボタンのイベントリスナー
            const exportButton = modal.querySelector('.favorites-export-button');
            const exportOptions = modal.querySelector('.favorites-export-options');
            
            exportButton.addEventListener('click', (e) => {
                e.stopPropagation();
                exportOptions.style.display = exportOptions.style.display === 'none' ? 'block' : 'none';
            });
            
            // エクスポートオプションのイベントリスナー
            modal.querySelectorAll('.export-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    const format = e.target.dataset.format;
                    this.exportFavorites(format);
                    exportOptions.style.display = 'none';
                });
            });
            
            // モーダル内でクリックしてもオプションが閉じないようにする
            modal.querySelector('.favorites-modal-content').addEventListener('click', () => {
                exportOptions.style.display = 'none';
            });
        }

        createMessageContainer() {
            const container = document.createElement('div');
            container.className = 'favorites-message';
            document.body.appendChild(container);
            this.messageContainer = container;
        }

        showMessage(message) {
            this.messageContainer.textContent = message;
            this.messageContainer.classList.add('show');
            
            setTimeout(() => {
                this.messageContainer.classList.remove('show');
            }, 3000);
        }

        attachEventListeners() {
            const fab = document.createElement('button');
            fab.className = 'favorites-fab';
            fab.innerHTML = `
                <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
            `;
            fab.addEventListener('click', () => {
                this.showModal();
            });
            document.body.appendChild(fab);
            
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.modal.classList.contains('show')) {
                    this.hideModal();
                }
            });
        }

        updateFavoriteButtons() {
            document.querySelectorAll('.favorite-button').forEach(button => {
                const article = button.closest('article, .article-item, .post-item');
                const linkElement = article?.querySelector('a');
                
                if (linkElement) {
                    const isFav = this.isFavorite(linkElement.href);
                    button.classList.toggle('is-favorite', isFav);
                }
            });
        }

        updateFavoritesList() {
            if (!this.modalContent) return;
            
            if (this.favorites.length === 0) {
                this.modalContent.innerHTML = '<div class="favorites-empty">お気に入り記事がありません</div>';
                return;
            }
            
            const list = document.createElement('ul');
            list.className = 'favorites-list';
            
            this.favorites.forEach(fav => {
                const item = document.createElement('li');
                item.className = 'favorites-list-item';
                
                const savedDate = new Date(fav.savedAt).toLocaleDateString('ja-JP');
                
                item.innerHTML = `
                    <div class="favorites-item-content">
                        <a href="${fav.url}" class="favorites-item-title">${fav.title}</a>
                        <div class="favorites-item-excerpt">${fav.excerpt}</div>
                        <div class="favorites-item-date">保存日: ${savedDate}</div>
                    </div>
                    <button class="favorite-button is-favorite" data-id="${fav.id}">
                        <svg viewBox="0 0 24 24">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                    </button>
                `;
                
                item.querySelector('.favorite-button').addEventListener('click', (e) => {
                    e.preventDefault();
                    this.toggleFavorite(fav);
                });
                
                list.appendChild(item);
            });
            
            this.modalContent.innerHTML = '';
            this.modalContent.appendChild(list);
        }

        showModal() {
            this.updateFavoritesList();
            this.modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }

        hideModal() {
            this.modal.classList.remove('show');
            document.body.style.overflow = '';
        }
        
        exportFavorites(format) {
            if (this.favorites.length === 0) {
                this.showMessage('エクスポートする記事がありません');
                return;
            }
            
            let content = '';
            let filename = `keigo-jp-favorites-${new Date().toISOString().split('T')[0]}`;
            let mimeType = 'text/plain';
            
            switch (format) {
                case 'json':
                    content = JSON.stringify(this.favorites, null, 2);
                    filename += '.json';
                    mimeType = 'application/json';
                    break;
                    
                case 'csv':
                    content = this.generateCSV();
                    filename += '.csv';
                    mimeType = 'text/csv';
                    break;
                    
                case 'markdown':
                    content = this.generateMarkdown();
                    filename += '.md';
                    mimeType = 'text/markdown';
                    break;
                    
                case 'html':
                    content = this.generateHTML();
                    filename += '.html';
                    mimeType = 'text/html';
                    break;
            }
            
            this.downloadFile(content, filename, mimeType);
            this.showMessage(`${format.toUpperCase()}形式でエクスポートしました`);
        }
        
        generateCSV() {
            const headers = ['タイトル', 'URL', '概要', '保存日'];
            const rows = this.favorites.map(fav => [
                `"${fav.title.replace(/"/g, '""')}"`,
                fav.url,
                `"${fav.excerpt.replace(/"/g, '""')}"`,
                new Date(fav.savedAt).toLocaleDateString('ja-JP')
            ]);
            
            return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
        }
        
        generateMarkdown() {
            let content = '# 敬語.jp お気に入り記事\n\n';
            content += `エクスポート日: ${new Date().toLocaleDateString('ja-JP')}\n\n`;
            
            this.favorites.forEach((fav, index) => {
                content += `## ${index + 1}. ${fav.title}\n\n`;
                content += `- **URL**: [${fav.url}](${fav.url})\n`;
                content += `- **概要**: ${fav.excerpt}\n`;
                content += `- **保存日**: ${new Date(fav.savedAt).toLocaleDateString('ja-JP')}\n\n`;
            });
            
            return content;
        }
        
        generateHTML() {
            const html = `<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>敬語.jp お気に入り記事</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #3b82f6;
            padding-bottom: 10px;
        }
        .article {
            background: white;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .article-title {
            font-size: 1.2em;
            font-weight: bold;
            margin-bottom: 10px;
        }
        .article-title a {
            color: #3b82f6;
            text-decoration: none;
        }
        .article-title a:hover {
            text-decoration: underline;
        }
        .article-excerpt {
            color: #666;
            margin-bottom: 10px;
        }
        .article-date {
            color: #999;
            font-size: 0.9em;
        }
        .export-info {
            background: #e3f2fd;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <h1>敬語.jp お気に入り記事</h1>
    <div class="export-info">
        <p>エクスポート日: ${new Date().toLocaleDateString('ja-JP')}</p>
        <p>記事数: ${this.favorites.length}件</p>
    </div>
    ${this.favorites.map(fav => `
        <div class="article">
            <div class="article-title">
                <a href="${fav.url}" target="_blank">${fav.title}</a>
            </div>
            <div class="article-excerpt">${fav.excerpt}</div>
            <div class="article-date">保存日: ${new Date(fav.savedAt).toLocaleDateString('ja-JP')}</div>
        </div>
    `).join('')}
</body>
</html>`;
            return html;
        }
        
        downloadFile(content, filename, mimeType) {
            const blob = new Blob([content], { type: mimeType + ';charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            new FavoritesManager();
        });
    } else {
        new FavoritesManager();
    }
})();