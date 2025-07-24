(function() {
    'use strict';

    const SkeletonLoader = {
        init() {
            this.setupIntersectionObserver();
            this.setupDynamicContentLoader();
            this.setupImageLazyLoading();
        },

        createSkeletonCard() {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-card bg-white w-full p-3 lg:max-w-full lg:flex mt-5 dark:bg-warmgray-900 overflow-hidden relative';
            skeleton.innerHTML = `
                <div class="skeleton-image skeleton-shimmer ${window.siteParams?.post?.thumbnail_width || 'w-full'} ${window.siteParams?.post?.thumbnail_height || 'h-48'} lg:h-44"></div>
                <div class="relative pl-4 p-2 justify-between leading-normal max-w-full w-full">
                    <div class="skeleton-title skeleton-shimmer h-7 w-4/5 mb-2 rounded"></div>
                    <div class="skeleton-text space-y-2 pb-5">
                        <div class="skeleton-line skeleton-shimmer h-4 w-full rounded"></div>
                        <div class="skeleton-line skeleton-shimmer h-4 w-full rounded"></div>
                        <div class="skeleton-line skeleton-shimmer h-4 w-3/4 rounded"></div>
                    </div>
                    <div class="skeleton-date skeleton-shimmer h-4 w-24 absolute right-0 bottom-0 rounded"></div>
                </div>
            `;
            return skeleton;
        },

        createSkeletonWidget() {
            const skeleton = document.createElement('div');
            skeleton.className = 'skeleton-widget bg-white p-4 mb-4 dark:bg-warmgray-900 rounded-lg';
            skeleton.innerHTML = `
                <div class="skeleton-widget-title skeleton-shimmer h-6 w-32 mb-4 rounded"></div>
                <div class="space-y-3">
                    <div class="skeleton-widget-item skeleton-shimmer h-4 w-full rounded"></div>
                    <div class="skeleton-widget-item skeleton-shimmer h-4 w-5/6 rounded"></div>
                    <div class="skeleton-widget-item skeleton-shimmer h-4 w-4/5 rounded"></div>
                    <div class="skeleton-widget-item skeleton-shimmer h-4 w-full rounded"></div>
                </div>
            `;
            return skeleton;
        },

        setupIntersectionObserver() {
            const articleList = document.getElementById('articleList');
            if (!articleList) return;

            const existingArticles = articleList.querySelectorAll('article').length;
            if (existingArticles === 0) {
                for (let i = 0; i < 5; i++) {
                    articleList.appendChild(this.createSkeletonCard());
                }
            }

            const observer = new IntersectionObserver(
                (entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const skeleton = entry.target;
                            if (skeleton.classList.contains('skeleton-card')) {
                                setTimeout(() => {
                                    skeleton.style.opacity = '0';
                                    skeleton.style.transform = 'scale(0.95)';
                                    setTimeout(() => skeleton.remove(), 300);
                                }, 100);
                            }
                        }
                    });
                },
                { rootMargin: '50px' }
            );

            document.querySelectorAll('.skeleton-card').forEach(card => {
                observer.observe(card);
            });
        },

        setupDynamicContentLoader() {
            const widgets = document.querySelectorAll('[data-widget-lazy]');
            
            widgets.forEach(widget => {
                const skeleton = this.createSkeletonWidget();
                widget.appendChild(skeleton);

                const loadWidget = () => {
                    setTimeout(() => {
                        skeleton.classList.add('skeleton-fade-out');
                        setTimeout(() => skeleton.remove(), 300);
                    }, 300);
                };

                if ('IntersectionObserver' in window) {
                    const observer = new IntersectionObserver(
                        (entries) => {
                            entries.forEach(entry => {
                                if (entry.isIntersecting) {
                                    loadWidget();
                                    observer.unobserve(entry.target);
                                }
                            });
                        },
                        { rootMargin: '100px' }
                    );
                    observer.observe(widget);
                } else {
                    loadWidget();
                }
            });
        },

        setupImageLazyLoading() {
            const images = document.querySelectorAll('img[loading="lazy"]');
            
            images.forEach(img => {
                if (!img.complete) {
                    img.classList.add('skeleton-image-loading');
                    
                    const wrapper = img.parentElement;
                    if (wrapper && !wrapper.querySelector('.skeleton-image-overlay')) {
                        const overlay = document.createElement('div');
                        overlay.className = 'skeleton-image-overlay skeleton-shimmer';
                        wrapper.style.position = 'relative';
                        wrapper.appendChild(overlay);
                    }

                    img.addEventListener('load', () => {
                        img.classList.remove('skeleton-image-loading');
                        img.classList.add('skeleton-image-loaded');
                        const overlay = img.parentElement?.querySelector('.skeleton-image-overlay');
                        if (overlay) {
                            overlay.classList.add('skeleton-fade-out');
                            setTimeout(() => overlay.remove(), 300);
                        }
                    });

                    img.addEventListener('error', () => {
                        img.classList.remove('skeleton-image-loading');
                        const overlay = img.parentElement?.querySelector('.skeleton-image-overlay');
                        if (overlay) overlay.remove();
                    });
                }
            });
        },

        showContentSkeleton(container, count = 3) {
            container.innerHTML = '';
            for (let i = 0; i < count; i++) {
                container.appendChild(this.createSkeletonCard());
            }
        },

        hideContentSkeleton(container) {
            const skeletons = container.querySelectorAll('.skeleton-card');
            skeletons.forEach((skeleton, index) => {
                setTimeout(() => {
                    skeleton.classList.add('skeleton-fade-out');
                    setTimeout(() => skeleton.remove(), 300);
                }, index * 50);
            });
        }
    };

    window.SkeletonLoader = SkeletonLoader;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => SkeletonLoader.init());
    } else {
        SkeletonLoader.init();
    }

    document.addEventListener('htmx:beforeRequest', (event) => {
        const target = event.detail.target;
        if (target.id === 'articleList') {
            SkeletonLoader.showContentSkeleton(target);
        }
    });

    document.addEventListener('htmx:afterOnLoad', (event) => {
        const target = event.detail.target;
        if (target.id === 'articleList') {
            SkeletonLoader.hideContentSkeleton(target);
            SkeletonLoader.setupImageLazyLoading();
        }
    });
})();