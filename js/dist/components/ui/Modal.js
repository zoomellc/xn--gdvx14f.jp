var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
export class Modal {
    constructor(options = {}) {
        this.container = null;
        this.overlay = null;
        this.modal = null;
        this.isOpen = false;
        this.previousFocus = null;
        this.handleEscape = (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.close();
            }
        };
        this.options = Object.assign({ closeOnOverlay: true, closeOnEscape: true, width: 'auto', maxWidth: '600px', confirmText: '確認', cancelText: 'キャンセル', showCloseButton: true, showFooter: true }, options);
        this.init();
    }
    init() {
        if (typeof document === 'undefined')
            return;
        this.createModalStructure();
        this.attachEventListeners();
    }
    createModalStructure() {
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
    updateModalContent() {
        if (!this.modal)
            return;
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
            `}
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
    attachEventListeners() {
        if (!this.modal || !this.overlay)
            return;
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
            confirmBtn.addEventListener('click', () => __awaiter(this, void 0, void 0, function* () {
                if (this.options.onConfirm) {
                    try {
                        yield this.options.onConfirm();
                        this.close();
                    }
                    catch (error) {
                        console.error('Modal confirm error:', error);
                    }
                }
                else {
                    this.close();
                }
            }));
        }
        if (this.options.closeOnOverlay) {
            this.overlay.addEventListener('click', () => this.close());
        }
        if (this.options.closeOnEscape) {
            document.addEventListener('keydown', this.handleEscape);
        }
    }
    open() {
        if (!this.container || !this.overlay || !this.modal || this.isOpen)
            return;
        this.previousFocus = document.activeElement;
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
        const focusableElements = this.modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        if (focusableElements.length > 0) {
            focusableElements[0].focus();
        }
        if (this.options.onOpen) {
            this.options.onOpen();
        }
    }
    close() {
        if (!this.container || !this.overlay || !this.modal || !this.isOpen)
            return;
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
    setOptions(options) {
        this.options = Object.assign(Object.assign({}, this.options), options);
        this.updateModalContent();
    }
    setContent(content) {
        this.options.content = content;
        this.updateModalContent();
    }
    setTitle(title) {
        this.options.title = title;
        this.updateModalContent();
    }
    destroy() {
        this.close();
        if (this.options.closeOnEscape) {
            document.removeEventListener('keydown', this.handleEscape);
        }
        if (this.container) {
            this.container.remove();
        }
    }
}
export function createModal(options) {
    return new Modal(options);
}
export function confirm(message, options = {}) {
    return new Promise((resolve) => {
        const modal = new Modal(Object.assign({ title: '確認', content: message, onConfirm: () => resolve(true), onCancel: () => resolve(false) }, options));
        modal.open();
    });
}
export function alert(message, options = {}) {
    return new Promise((resolve) => {
        const modal = new Modal(Object.assign({ title: 'お知らせ', content: message, showFooter: true, onConfirm: () => resolve(), cancelText: '' }, options));
        modal.open();
    });
}
//# sourceMappingURL=Modal.js.map