export interface ModalOptions {
  title?: string;
  content?: string | HTMLElement;
  footer?: string | HTMLElement;
  className?: string;
  closeOnOverlay?: boolean;
  closeOnEscape?: boolean;
  width?: string;
  maxWidth?: string;
  onOpen?: () => void;
  onClose?: () => void;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCloseButton?: boolean;
  showFooter?: boolean;
}

export class Modal {
  private container: HTMLElement | null = null;
  private overlay: HTMLElement | null = null;
  private modal: HTMLElement | null = null;
  private options: ModalOptions;
  private isOpen: boolean = false;
  private previousFocus: HTMLElement | null = null;

  constructor(options: ModalOptions = {}) {
    this.options = {
      closeOnOverlay: true,
      closeOnEscape: true,
      width: 'auto',
      maxWidth: '600px',
      confirmText: '確認',
      cancelText: 'キャンセル',
      showCloseButton: true,
      showFooter: true,
      ...options
    };
    
    this.init();
  }

  private init(): void {
    if (typeof document === 'undefined') return;

    this.createModalStructure();
    this.attachEventListeners();
  }

  private createModalStructure(): void {
    this.container = document.createElement('div');
    this.container.className = 'modal-container';
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: none;
      z-index: 10000;
    `;

    this.overlay = document.createElement('div');
    this.overlay.className = 'modal-overlay';
    this.overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      opacity: 0;
      transition: opacity 0.3s ease;
    `;

    this.modal = document.createElement('div');
    this.modal.className = `modal ${this.options.className || ''}`;
    this.modal.setAttribute('role', 'dialog');
    this.modal.setAttribute('aria-modal', 'true');
    this.modal.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      background-color: #fff;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      width: ${this.options.width};
      max-width: ${this.options.maxWidth};
      max-height: 90vh;
      overflow: hidden;
      opacity: 0;
      transition: all 0.3s ease;
    `;

    this.updateModalContent();

    this.container.appendChild(this.overlay);
    this.container.appendChild(this.modal);
    document.body.appendChild(this.container);
  }

  private updateModalContent(): void {
    if (!this.modal) return;

    let headerHTML = '';
    if (this.options.title || this.options.showCloseButton) {
      headerHTML = `
        <div class="modal-header" style="
          padding: 20px;
          border-bottom: 1px solid #e0e0e0;
          display: flex;
          align-items: center;
          justify-content: space-between;
        ">
          ${this.options.title ? `<h2 class="modal-title" style="margin: 0; font-size: 18px; font-weight: 600;">${this.options.title}</h2>` : '<div></div>'}
          ${this.options.showCloseButton ? `
            <button class="modal-close" aria-label="閉じる" style="
              background: none;
              border: none;
              font-size: 24px;
              cursor: pointer;
              color: #666;
              padding: 0;
              width: 30px;
              height: 30px;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: color 0.2s;
            ">&times;</button>
          ` : ''}
        </div>
      `;
    }

    const bodyHTML = `
      <div class="modal-body" style="
        padding: 20px;
        overflow-y: auto;
        max-height: calc(90vh - ${this.options.showFooter ? '140px' : '80px'});
      ">
        ${typeof this.options.content === 'string' ? this.options.content : ''}
      </div>
    `;

    let footerHTML = '';
    if (this.options.showFooter && (this.options.footer || this.options.onConfirm || this.options.onCancel)) {
      footerHTML = `
        <div class="modal-footer" style="
          padding: 20px;
          border-top: 1px solid #e0e0e0;
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        ">
          ${this.options.footer ? 
            (typeof this.options.footer === 'string' ? this.options.footer : '') :
            `
              ${this.options.onCancel ? `
                <button class="modal-cancel" style="
                  padding: 8px 16px;
                  border: 1px solid #ccc;
                  background-color: #fff;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 14px;
                  transition: all 0.2s;
                ">${this.options.cancelText}</button>
              ` : ''}
              ${this.options.onConfirm ? `
                <button class="modal-confirm" style="
                  padding: 8px 16px;
                  border: none;
                  background-color: #1976d2;
                  color: #fff;
                  border-radius: 4px;
                  cursor: pointer;
                  font-size: 14px;
                  transition: all 0.2s;
                ">${this.options.confirmText}</button>
              ` : ''}
            `
          }
        </div>
      `;
    }

    this.modal.innerHTML = headerHTML + bodyHTML + footerHTML;

    if (typeof this.options.content !== 'string' && this.options.content) {
      const body = this.modal.querySelector('.modal-body');
      if (body) {
        body.innerHTML = '';
        body.appendChild(this.options.content);
      }
    }

    if (typeof this.options.footer !== 'string' && this.options.footer && this.options.showFooter) {
      const footer = this.modal.querySelector('.modal-footer');
      if (footer) {
        footer.innerHTML = '';
        footer.appendChild(this.options.footer);
      }
    }
  }

  private attachEventListeners(): void {
    if (!this.modal || !this.overlay) return;

    const closeBtn = this.modal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    const cancelBtn = this.modal.querySelector('.modal-cancel');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        if (this.options.onCancel) {
          this.options.onCancel();
        }
        this.close();
      });
    }

    const confirmBtn = this.modal.querySelector('.modal-confirm');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', async () => {
        if (this.options.onConfirm) {
          try {
            await this.options.onConfirm();
            this.close();
          } catch (error) {
            console.error('Modal confirm error:', error);
          }
        } else {
          this.close();
        }
      });
    }

    if (this.options.closeOnOverlay) {
      this.overlay.addEventListener('click', () => this.close());
    }

    if (this.options.closeOnEscape) {
      document.addEventListener('keydown', this.handleEscape);
    }
  }

  private handleEscape = (e: KeyboardEvent): void => {
    if (e.key === 'Escape' && this.isOpen) {
      this.close();
    }
  };

  open(): void {
    if (!this.container || !this.overlay || !this.modal || this.isOpen) return;

    this.previousFocus = document.activeElement as HTMLElement;
    
    this.container.style.display = 'block';
    
    requestAnimationFrame(() => {
      if (this.overlay && this.modal) {
        this.overlay.style.opacity = '1';
        this.modal.style.opacity = '1';
        this.modal.style.transform = 'translate(-50%, -50%) scale(1)';
      }
    });

    this.isOpen = true;
    document.body.style.overflow = 'hidden';

    const focusableElements = this.modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }

    if (this.options.onOpen) {
      this.options.onOpen();
    }
  }

  close(): void {
    if (!this.container || !this.overlay || !this.modal || !this.isOpen) return;

    this.overlay.style.opacity = '0';
    this.modal.style.opacity = '0';
    this.modal.style.transform = 'translate(-50%, -50%) scale(0.9)';

    setTimeout(() => {
      if (this.container) {
        this.container.style.display = 'none';
      }
      
      this.isOpen = false;
      document.body.style.overflow = '';

      if (this.previousFocus) {
        this.previousFocus.focus();
      }

      if (this.options.onClose) {
        this.options.onClose();
      }
    }, 300);
  }

  setOptions(options: Partial<ModalOptions>): void {
    this.options = { ...this.options, ...options };
    this.updateModalContent();
  }

  setContent(content: string | HTMLElement): void {
    this.options.content = content;
    this.updateModalContent();
  }

  setTitle(title: string): void {
    this.options.title = title;
    this.updateModalContent();
  }

  destroy(): void {
    this.close();
    if (this.options.closeOnEscape) {
      document.removeEventListener('keydown', this.handleEscape);
    }
    if (this.container) {
      this.container.remove();
    }
  }
}

export function createModal(options: ModalOptions): Modal {
  return new Modal(options);
}

export function confirm(message: string, options: Partial<ModalOptions> = {}): Promise<boolean> {
  return new Promise((resolve) => {
    const modal = new Modal({
      title: '確認',
      content: message,
      onConfirm: () => resolve(true),
      onCancel: () => resolve(false),
      ...options
    });
    modal.open();
  });
}

export function alert(message: string, options: Partial<ModalOptions> = {}): Promise<void> {
  return new Promise((resolve) => {
    const modal = new Modal({
      title: 'お知らせ',
      content: message,
      showFooter: true,
      onConfirm: () => resolve(),
      cancelText: '',
      ...options
    });
    modal.open();
  });
}