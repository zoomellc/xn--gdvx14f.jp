export type ButtonVariant = 'primary' | 'secondary' | 'text' | 'icon';
export type ButtonSize = 'small' | 'medium' | 'large';

export interface ButtonOptions {
  text?: string;
  icon?: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  disabled?: boolean;
  loading?: boolean;
  ariaLabel?: string;
  onClick?: (event: MouseEvent) => void | Promise<void>;
  href?: string;
  target?: string;
  tooltip?: string;
  tooltipPosition?: 'top' | 'bottom' | 'left' | 'right';
}

export class Button {
  private element: HTMLButtonElement | HTMLAnchorElement;
  private options: ButtonOptions;
  private isLoading: boolean = false;

  constructor(options: ButtonOptions) {
    this.options = {
      variant: 'primary',
      size: 'medium',
      disabled: false,
      loading: false,
      ...options
    };

    this.element = this.createElement();
    this.applyStyles();
    this.attachEventListeners();
    
    if (this.options.loading) {
      this.setLoading(true);
    }
  }

  private createElement(): HTMLButtonElement | HTMLAnchorElement {
    const isLink = !!this.options.href;
    const element = document.createElement(isLink ? 'a' : 'button') as HTMLButtonElement | HTMLAnchorElement;
    
    if (isLink && this.options.href) {
      (element as HTMLAnchorElement).href = this.options.href;
      if (this.options.target) {
        (element as HTMLAnchorElement).target = this.options.target;
      }
    }
    
    element.className = this.buildClassName();
    
    if (this.options.ariaLabel) {
      element.setAttribute('aria-label', this.options.ariaLabel);
    }
    
    if (this.options.disabled && !isLink) {
      (element as HTMLButtonElement).disabled = true;
    }
    
    if (this.options.tooltip) {
      element.title = this.options.tooltip;
      this.setupTooltip();
    }
    
    this.updateContent();
    
    return element;
  }

  private buildClassName(): string {
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

  private applyStyles(): void {
    const baseStyles: Record<string, string> = {
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

  private getSizeStyles(): Record<string, string> {
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

  private getVariantStyles(): Record<string, string> {
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

  private updateContent(): void {
    const parts: string[] = [];
    
    if (this.isLoading) {
      parts.push(this.getLoadingSpinner());
    } else {
      if (this.options.icon) {
        parts.push(this.options.icon);
      }
      if (this.options.text) {
        parts.push(`<span>${this.options.text}</span>`);
      }
    }
    
    this.element.innerHTML = parts.join('');
  }

  private getLoadingSpinner(): string {
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

  private attachEventListeners(): void {
    if (this.options.onClick) {
      this.element.addEventListener('click', async (event) => {
        if (this.options.disabled || this.isLoading) {
          event.preventDefault();
          return;
        }
        
        if (this.options.onClick) {
          try {
            this.setLoading(true);
            await this.options.onClick(event as MouseEvent);
          } finally {
            this.setLoading(false);
          }
        }
      });
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

  private setupTooltip(): void {
    if (!this.options.tooltip) return;
    
    let tooltip: HTMLElement | null = null;
    
    this.element.addEventListener('mouseenter', () => {
      if (tooltip) return;
      
      tooltip = document.createElement('div');
      tooltip.className = 'btn-tooltip';
      tooltip.textContent = this.options.tooltip!;
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
        if (tooltip) tooltip.style.opacity = '1';
      });
    });
    
    this.element.addEventListener('mouseleave', () => {
      if (tooltip) {
        tooltip.style.opacity = '0';
        setTimeout(() => {
          tooltip?.remove();
          tooltip = null;
        }, 200);
      }
    });
  }

  setLoading(loading: boolean): void {
    this.isLoading = loading;
    this.options.loading = loading;
    
    if (loading) {
      if (this.element instanceof HTMLButtonElement) {
        this.element.disabled = true;
      }
    } else {
      if (this.element instanceof HTMLButtonElement) {
        this.element.disabled = this.options.disabled || false;
      }
    }
    
    this.element.className = this.buildClassName();
    this.updateContent();
  }

  setDisabled(disabled: boolean): void {
    this.options.disabled = disabled;
    
    if (this.element instanceof HTMLButtonElement) {
      this.element.disabled = disabled;
    }
    
    this.element.className = this.buildClassName();
    this.element.style.opacity = disabled ? '0.6' : '1';
    this.element.style.cursor = disabled ? 'not-allowed' : 'pointer';
  }

  setText(text: string): void {
    this.options.text = text;
    this.updateContent();
  }

  setIcon(icon: string): void {
    this.options.icon = icon;
    this.updateContent();
  }

  getElement(): HTMLButtonElement | HTMLAnchorElement {
    return this.element;
  }

  appendTo(container: HTMLElement): void {
    container.appendChild(this.element);
  }

  remove(): void {
    this.element.remove();
  }
}

export function createButton(options: ButtonOptions): Button {
  return new Button(options);
}