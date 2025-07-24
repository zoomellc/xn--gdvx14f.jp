(function() {
    'use strict';

    const CardInteractions = {
        init() {
            this.setupCardHoverEffects();
            this.setupTiltEffect();
            this.setupRippleEffect();
            this.setupCardLoadAnimation();
        },

        setupCardHoverEffects() {
            const cards = document.querySelectorAll('.article-card');
            
            cards.forEach(card => {
                card.addEventListener('mouseenter', (e) => {
                    this.animateCardHover(card, e);
                });

                card.addEventListener('mouseleave', (e) => {
                    this.resetCardHover(card, e);
                });

                card.addEventListener('mousemove', (e) => {
                    this.updateCardPerspective(card, e);
                });
            });
        },

        animateCardHover(card, event) {
            const rect = card.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            const ripple = document.createElement('div');
            ripple.classList.add('card-ripple');
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            card.appendChild(ripple);

            setTimeout(() => ripple.remove(), 600);
        },

        resetCardHover(card, event) {
            card.style.transform = '';
            const image = card.querySelector('img');
            if (image) {
                image.style.transform = '';
            }
        },

        setupTiltEffect() {
            if (window.innerWidth < 1024 || !window.matchMedia('(hover: hover)').matches) {
                return;
            }

            const cards = document.querySelectorAll('.article-card');
            
            cards.forEach(card => {
                card.addEventListener('mousemove', (e) => {
                    const rect = card.getBoundingClientRect();
                    const centerX = rect.left + rect.width / 2;
                    const centerY = rect.top + rect.height / 2;
                    
                    const angleX = (e.clientY - centerY) / (rect.height / 2);
                    const angleY = (e.clientX - centerX) / (rect.width / 2);
                    
                    const tiltX = angleX * 3;
                    const tiltY = angleY * 3;
                    
                    card.style.transform = `perspective(1000px) rotateX(${-tiltX}deg) rotateY(${tiltY}deg) translateZ(10px)`;
                });

                card.addEventListener('mouseleave', () => {
                    card.style.transform = '';
                });
            });
        },

        updateCardPerspective(card, event) {
            const rect = card.getBoundingClientRect();
            const x = (event.clientX - rect.left) / rect.width;
            const y = (event.clientY - rect.top) / rect.height;
            
            const image = card.querySelector('img');
            if (image) {
                const moveX = (x - 0.5) * 20;
                const moveY = (y - 0.5) * 20;
                image.style.transform = `translate(${moveX}px, ${moveY}px) scale(1.1)`;
            }
        },

        setupRippleEffect() {
            const cards = document.querySelectorAll('.article-card');
            
            cards.forEach(card => {
                card.addEventListener('click', function(e) {
                    const rect = this.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    
                    const ripple = document.createElement('span');
                    ripple.classList.add('click-ripple');
                    ripple.style.left = x + 'px';
                    ripple.style.top = y + 'px';
                    
                    this.appendChild(ripple);
                    
                    setTimeout(() => ripple.remove(), 1000);
                });
            });
        },

        setupCardLoadAnimation() {
            const observerOptions = {
                threshold: 0.1,
                rootMargin: '50px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach((entry, index) => {
                    if (entry.isIntersecting && !entry.target.classList.contains('card-animated')) {
                        setTimeout(() => {
                            entry.target.classList.add('card-animated');
                            entry.target.style.animationDelay = `${index * 50}ms`;
                        }, index * 50);
                    }
                });
            }, observerOptions);

            const cards = document.querySelectorAll('.article-card');
            cards.forEach(card => observer.observe(card));
        }
    };

    window.CardInteractions = CardInteractions;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => CardInteractions.init());
    } else {
        CardInteractions.init();
    }

    document.addEventListener('turbo:load', () => CardInteractions.init());
    document.addEventListener('htmx:afterSwap', () => CardInteractions.init());
})();