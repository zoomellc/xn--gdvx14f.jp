var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class Button {
    constructor(options) {
        this.isLoading = false;
        this.options = Object.assign({ variant: 'primary', size: 'medium', disabled: false, loading: false }, options);
        this.element = this.createElement();
        this.applyStyles();
        this.attachEventListeners();
        if (this.options.loading) {
            this.setLoading(true);
        }
    }
    createElement() {
        const isLink = !!this.options.href;
        const element = document.createElement(isLink ? 'a' : 'button');
        if (isLink && this.options.href) {
            element.href = this.options.href;
            if (this.options.target) {
                element.target = this.options.target;
            }
        }
        element.className = this.buildClassName();
        if (this.options.ariaLabel) {
            element.setAttribute('aria-label', this.options.ariaLabel);
        }
        if (this.options.disabled && !isLink) {
            element.disabled = true;
        }
        if (this.options.tooltip) {
            element.title = this.options.tooltip;
            this.setupTooltip();
        }
        this.updateContent();
        return element;
    }
    buildClassName() {
        const classes = [
            'btn',
            `btn-${this.options.variant}`,
            `btn-${this.options.size}`,
            this.options.className || ''
        ];
        if (this.options.disabled) {
            classes.push('btn-disabled');
        }
        if (this.options.loading) {
            classes.push('btn-loading');
        }
        if (this.options.icon && !this.options.text) {
            classes.push('btn-icon-only');
        }
        return classes.filter(Boolean).join(' ');
    }
    applyStyles() {
        const baseStyles = {
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            border: 'none',
            borderRadius: '4px',
            cursor: this.options.disabled ? 'not-allowed' : 'pointer',
            textDecoration: 'none',
            transition: 'all 0.2s ease',
            fontFamily: 'inherit',
            fontWeight: '500',
            lineHeight: '1',
            position: 'relative',
            userSelect: 'none'
        };
        const sizeStyles = this.getSizeStyles();
        const variantStyles = this.getVariantStyles();
        Object.assign(this.element.style, baseStyles, sizeStyles, variantStyles);
        if (this.options.disabled) {
            this.element.style.opacity = '0.6';
        }
    }
    getSizeStyles() {
        const sizes = {
            small: {
                padding: '6px 12px',
                fontSize: '12px',
                height: '28px'
            },
            medium: {
                padding: '8px 16px',
                fontSize: '14px',
                height: '36px'
            },
            large: {
                padding: '12px 24px',
                fontSize: '16px',
                height: '44px'
            }
        };
        return sizes[this.options.size || 'medium'];
    }
    getVariantStyles() {
        const variants = {
            primary: {
                backgroundColor: '#1976d2',
                color: '#ffffff'
            },
            secondary: {
                backgroundColor: '#ffffff',
                color: '#1976d2',
                border: '1px solid #1976d2'
            },
            text: {
                backgroundColor: 'transparent',
                color: '#1976d2',
                padding: '8px'
            },
            icon: {
                backgroundColor: 'transparent',
                color: 'inherit',
                padding: '8px',
                minWidth: 'auto'
            }
        };
        return variants[this.options.variant || 'primary'];
    }
    updateContent() {
        const parts = [];
        if (this.isLoading) {
            parts.push(this.getLoadingSpinner());
        }
        else {
            if (this.options.icon) {
                parts.push(this.options.icon);
            }
            if (this.options.text) {
                parts.push(`<span>${this.options.text}</span>`);
            }
        }
        this.element.innerHTML = parts.join('');
    }
    getLoadingSpinner() {
        return `
      <svg class="btn-spinner" width="16" height="16" viewBox="0 0 16 16" style="animation: spin 1s linear infinite;">
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="30 10"></circle>
      </svg>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    }
    attachEventListeners() {
        if (this.options.onClick) {
            this.element.addEventListener('click', (event) => __awaiter(this, void 0, void 0, function* () {
                if (this.options.disabled || this.isLoading) {
                    event.preventDefault();
                    return;
                }
                if (this.options.onClick) {
                    try {
                        this.setLoading(true);
                        yield this.options.onClick(event);
                    }
                    finally {
                        this.setLoading(false);
                    }
                }
            }));
        }
        this.element.addEventListener('mouseenter', () => {
            if (!this.options.disabled) {
                this.element.style.filter = 'brightness(0.9)';
            }
        });
        this.element.addEventListener('mouseleave', () => {
            this.element.style.filter = '';
        });
    }
    setupTooltip() {
        if (!this.options.tooltip)
            return;
        let tooltip = null;
        this.element.addEventListener('mouseenter', () => {
            if (tooltip)
                return;
            tooltip = document.createElement('div');
            tooltip.className = 'btn-tooltip';
            tooltip.textContent = this.options.tooltip;
            tooltip.style.cssText = `
        position: absolute;
        background-color: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        white-space: nowrap;
        z-index: 1000;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.2s;
      `;
            document.body.appendChild(tooltip);
            const rect = this.element.getBoundingClientRect();
            const tooltipRect = tooltip.getBoundingClientRect();
            const positions = {
                top: {
                    top: `${rect.top - tooltipRect.height - 8}px`,
                    left: `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`
                },
                bottom: {
                    top: `${rect.bottom + 8}px`,
                    left: `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`
                },
                left: {
                    top: `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`,
                    left: `${rect.left - tooltipRect.width - 8}px`
                },
                right: {
                    top: `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`,
                    left: `${rect.right + 8}px`
                }
            };
            const position = positions[this.options.tooltipPosition || 'top'];
            Object.assign(tooltip.style, position);
            requestAnimationFrame(() => {
                if (tooltip)
                    tooltip.style.opacity = '1';
            });
        });
        this.element.addEventListener('mouseleave', () => {
            if (tooltip) {
                tooltip.style.opacity = '0';
                setTimeout(() => {
                    tooltip === null || tooltip === void 0 ? void 0 : tooltip.remove();
                    tooltip = null;
                }, 200);
            }
        });
    }
    setLoading(loading) {
        this.isLoading = loading;
        this.options.loading = loading;
        if (loading) {
            if (this.element instanceof HTMLButtonElement) {
                this.element.disabled = true;
            }
        }
        else {
            if (this.element instanceof HTMLButtonElement) {
                this.element.disabled = this.options.disabled || false;
            }
        }
        this.element.className = this.buildClassName();
        this.updateContent();
    }
    setDisabled(disabled) {
        this.options.disabled = disabled;
        if (this.element instanceof HTMLButtonElement) {
            this.element.disabled = disabled;
        }
        this.element.className = this.buildClassName();
        this.element.style.opacity = disabled ? '0.6' : '1';
        this.element.style.cursor = disabled ? 'not-allowed' : 'pointer';
    }
    setText(text) {
        this.options.text = text;
        this.updateContent();
    }
    setIcon(icon) {
        this.options.icon = icon;
        this.updateContent();
    }
    getElement() {
        return this.element;
    }
    appendTo(container) {
        container.appendChild(this.element);
    }
    remove() {
        this.element.remove();
    }
}
export function createButton(options) {
    return new Button(options);
}
//# sourceMappingURL=Button.js.map