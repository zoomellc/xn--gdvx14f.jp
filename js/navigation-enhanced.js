(function() {
    'use strict';

    const NavigationEnhanced = {
        elements: {
            header: null,
            nav: null,
            hamburger: null,
            mobileMenu: null,
            dropdowns: [],
            searchBtn: null,
            lastScrollTop: 0,
            isSticky: false,
            ticking: false
        },

        config: {
            stickyOffset: 100,
            hideOnScrollDown: true,
            animationDuration: 300,
            breakpoint: 768
        },

        init() {
            this.cacheElements();
            if (!this.elements.header) return;

            this.setupStickyHeader();
            this.setupMegaMenu();
            this.setupMobileNavigation();
            this.setupAccessibility();
            this.setupScrollProgress();
            this.bindEvents();
        },

        cacheElements() {
            this.elements.header = document.querySelector('header[role="banner"]');
            this.elements.nav = document.querySelector('nav[role="navigation"]');
            this.elements.hamburger = document.getElementById('hamburgerbtn');
            this.elements.mobileMenu = document.getElementById('mobileMenu');
            this.elements.dropdowns = document.querySelectorAll('.dropdown');
            this.elements.searchBtn = document.querySelector('.search-toggle-btn');
        },

        setupStickyHeader() {
            const header = this.elements.header;
            if (!header) return;

            const placeholder = document.createElement('div');
            placeholder.classList.add('header-placeholder');
            placeholder.style.display = 'none';
            header.parentNode.insertBefore(placeholder, header.nextSibling);

            this.elements.placeholder = placeholder;
        },

        setupMegaMenu() {
            this.elements.dropdowns.forEach(dropdown => {
                const toggle = dropdown.querySelector('.dropdown-toggle');
                const menu = dropdown.querySelector('.dropdown-menu');
                
                if (!toggle || !menu) return;

                menu.classList.add('mega-menu');
                
                const megaContent = this.createMegaMenuContent(dropdown);
                if (megaContent) {
                    menu.innerHTML = '';
                    menu.appendChild(megaContent);
                }

                toggle.addEventListener('mouseenter', () => this.showMegaMenu(dropdown));
                dropdown.addEventListener('mouseleave', () => this.hideMegaMenu(dropdown));
                
                toggle.addEventListener('focus', () => this.showMegaMenu(dropdown));
                menu.addEventListener('focusout', (e) => {
                    setTimeout(() => {
                        if (!dropdown.contains(document.activeElement)) {
                            this.hideMegaMenu(dropdown);
                        }
                    }, 100);
                });
            });
        },

        createMegaMenuContent(dropdown) {
            const megaWrapper = document.createElement('div');
            megaWrapper.classList.add('mega-menu-wrapper', 'grid', 'grid-cols-1', 'md:grid-cols-3', 'gap-6', 'p-6');

            const categories = [
                {
                    title: '基礎から学ぶ',
                    items: [
                        { name: '敬語の基本', url: '/basics/', icon: '📚' },
                        { name: '尊敬語', url: '/sonkeigo/', icon: '🙏' },
                        { name: '謙譲語', url: '/kenjougo/', icon: '🤝' },
                        { name: '丁寧語', url: '/teineigo/', icon: '💬' }
                    ]
                },
                {
                    title: 'シーン別',
                    items: [
                        { name: 'ビジネス', url: '/business/', icon: '💼' },
                        { name: '電話対応', url: '/phone/', icon: '📞' },
                        { name: 'メール', url: '/email/', icon: '✉️' },
                        { name: '接客', url: '/service/', icon: '🏪' }
                    ]
                },
                {
                    title: '学習ツール',
                    items: [
                        { name: 'クイズ', url: '/quiz/', icon: '🎯' },
                        { name: '変換ツール', url: '/converter/', icon: '🔄' },
                        { name: '例文集', url: '/examples/', icon: '📝' },
                        { name: 'よくある間違い', url: '/mistakes/', icon: '⚠️' }
                    ]
                }
            ];

            categories.forEach(category => {
                const column = document.createElement('div');
                column.classList.add('mega-menu-column');

                const title = document.createElement('h3');
                title.classList.add('font-semibold', 'text-gray-900', 'mb-3');
                title.textContent = category.title;
                column.appendChild(title);

                const list = document.createElement('ul');
                list.classList.add('space-y-2');

                category.items.forEach(item => {
                    const li = document.createElement('li');
                    const link = document.createElement('a');
                    link.href = item.url;
                    link.classList.add('flex', 'items-center', 'space-x-2', 'text-gray-600', 'hover:text-blue-600', 'transition-colors');
                    
                    const icon = document.createElement('span');
                    icon.textContent = item.icon;
                    icon.classList.add('text-lg');
                    
                    const text = document.createElement('span');
                    text.textContent = item.name;
                    
                    link.appendChild(icon);
                    link.appendChild(text);
                    li.appendChild(link);
                    list.appendChild(li);
                });

                column.appendChild(list);
                megaWrapper.appendChild(column);
            });

            return megaWrapper;
        },

        showMegaMenu(dropdown) {
            const menu = dropdown.querySelector('.dropdown-menu');
            if (!menu) return;

            menu.style.opacity = '0';
            menu.style.transform = 'translateY(-10px)';
            menu.classList.remove('hidden');

            requestAnimationFrame(() => {
                menu.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                menu.style.opacity = '1';
                menu.style.transform = 'translateY(0)';
            });

            dropdown.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'true');
        },

        hideMegaMenu(dropdown) {
            const menu = dropdown.querySelector('.dropdown-menu');
            if (!menu) return;

            menu.style.opacity = '0';
            menu.style.transform = 'translateY(-10px)';

            setTimeout(() => {
                menu.classList.add('hidden');
            }, 300);

            dropdown.querySelector('.dropdown-toggle')?.setAttribute('aria-expanded', 'false');
        },

        setupMobileNavigation() {
            const mobileMenu = this.elements.mobileMenu;
            if (!mobileMenu) return;

            const backdrop = document.createElement('div');
            backdrop.classList.add('mobile-menu-backdrop', 'fixed', 'inset-0', 'bg-black', 'bg-opacity-50', 'z-40', 'hidden');
            document.body.appendChild(backdrop);
            this.elements.backdrop = backdrop;

            backdrop.addEventListener('click', () => this.toggleMobileMenu(false));

            this.setupSwipeGestures();
        },

        setupSwipeGestures() {
            let touchStartX = 0;
            let touchEndX = 0;

            document.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            document.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                this.handleSwipe();
            }, { passive: true });

            this.handleSwipe = () => {
                const swipeThreshold = 50;
                const diff = touchEndX - touchStartX;

                if (Math.abs(diff) > swipeThreshold) {
                    if (diff > 0 && touchStartX < 50) {
                        this.toggleMobileMenu(true);
                    } else if (diff < 0 && this.elements.mobileMenu.classList.contains('active')) {
                        this.toggleMobileMenu(false);
                    }
                }
            };
        },

        toggleMobileMenu(show) {
            const mobileMenu = this.elements.mobileMenu;
            const hamburger = this.elements.hamburger;
            const backdrop = this.elements.backdrop;

            if (show === undefined) {
                show = !mobileMenu.classList.contains('active');
            }

            if (show) {
                mobileMenu.classList.add('active');
                backdrop.classList.remove('hidden');
                document.body.style.overflow = 'hidden';
                hamburger?.setAttribute('aria-expanded', 'true');
                hamburger?.setAttribute('aria-label', 'メニューを閉じる');
                
                const hamburgerIcon = hamburger?.querySelector('.hamburger-icon');
                if (hamburgerIcon) {
                    hamburgerIcon.classList.add('active');
                }
            } else {
                mobileMenu.classList.remove('active');
                backdrop.classList.add('hidden');
                document.body.style.overflow = '';
                hamburger?.setAttribute('aria-expanded', 'false');
                hamburger?.setAttribute('aria-label', 'メニューを開く');
                
                const hamburgerIcon = hamburger?.querySelector('.hamburger-icon');
                if (hamburgerIcon) {
                    hamburgerIcon.classList.remove('active');
                }
            }
        },

        setupAccessibility() {
            const nav = this.elements.nav;
            if (!nav) return;

            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    this.toggleMobileMenu(false);
                    this.elements.dropdowns.forEach(dropdown => this.hideMegaMenu(dropdown));
                }
            });

            this.elements.dropdowns.forEach(dropdown => {
                const toggle = dropdown.querySelector('.dropdown-toggle');
                if (toggle) {
                    toggle.addEventListener('keydown', (e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            const isExpanded = toggle.getAttribute('aria-expanded') === 'true';
                            if (isExpanded) {
                                this.hideMegaMenu(dropdown);
                            } else {
                                this.showMegaMenu(dropdown);
                            }
                        }
                    });
                }
            });
        },

        setupScrollProgress() {
            const progressBar = document.createElement('div');
            progressBar.classList.add('scroll-progress-bar');
            progressBar.innerHTML = '<div class="scroll-progress-fill"></div>';
            this.elements.header.appendChild(progressBar);

            this.updateScrollProgress();
        },

        updateScrollProgress() {
            const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
            const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
            const scrolled = (winScroll / height) * 100;
            
            const progressFill = document.querySelector('.scroll-progress-fill');
            if (progressFill) {
                progressFill.style.width = scrolled + '%';
            }
        },

        bindEvents() {
            this.elements.hamburger?.addEventListener('click', () => this.toggleMobileMenu());

            window.addEventListener('scroll', () => {
                if (!this.elements.ticking) {
                    window.requestAnimationFrame(() => {
                        this.handleScroll();
                        this.updateScrollProgress();
                        this.elements.ticking = false;
                    });
                    this.elements.ticking = true;
                }
            });

            window.addEventListener('resize', this.debounce(() => {
                if (window.innerWidth >= this.config.breakpoint) {
                    this.toggleMobileMenu(false);
                }
            }, 250));
        },

        handleScroll() {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            const header = this.elements.header;
            const placeholder = this.elements.placeholder;

            if (scrollTop > this.config.stickyOffset) {
                if (!this.elements.isSticky) {
                    this.elements.isSticky = true;
                    header.classList.add('sticky-nav');
                    placeholder.style.display = 'block';
                    placeholder.style.height = header.offsetHeight + 'px';
                }

                if (this.config.hideOnScrollDown) {
                    if (scrollTop > this.elements.lastScrollTop) {
                        header.classList.add('nav-hidden');
                    } else {
                        header.classList.remove('nav-hidden');
                    }
                }
            } else {
                if (this.elements.isSticky) {
                    this.elements.isSticky = false;
                    header.classList.remove('sticky-nav', 'nav-hidden');
                    placeholder.style.display = 'none';
                }
            }

            this.elements.lastScrollTop = scrollTop;
        },

        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => NavigationEnhanced.init());
    } else {
        NavigationEnhanced.init();
    }

    window.NavigationEnhanced = NavigationEnhanced;
})();