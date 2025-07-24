export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface NotificationOptions {
  duration?: number;
  position?: 'top' | 'bottom' | 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  persistent?: boolean;
  className?: string;
  onClick?: () => void;
}

export class NotificationManager {
  private container: HTMLElement | null = null;
  private notifications: Map<string, HTMLElement> = new Map();
  private defaultOptions: NotificationOptions = {
    duration: 3000,
    position: 'top',
    persistent: false
  };

  constructor(options: Partial<NotificationOptions> = {}) {
    this.defaultOptions = { ...this.defaultOptions, ...options };
    this.init();
  }

  private init(): void {
    if (typeof document === 'undefined') return;

    this.container = document.getElementById('notification-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'notification-container';
      this.container.className = 'notification-container';
      this.applyContainerStyles();
      document.body.appendChild(this.container);
    }
  }

  private applyContainerStyles(): void {
    if (!this.container) return;
    
    const position = this.defaultOptions.position || 'top';
    const styles: Record<string, string> = {
      position: 'fixed',
      zIndex: '9999',
      pointerEvents: 'none',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      padding: '20px'
    };

    switch (position) {
      case 'top':
        styles.top = '0';
        styles.left = '50%';
        styles.transform = 'translateX(-50%)';
        break;
      case 'bottom':
        styles.bottom = '0';
        styles.left = '50%';
        styles.transform = 'translateX(-50%)';
        break;
      case 'top-right':
        styles.top = '0';
        styles.right = '0';
        break;
      case 'top-left':
        styles.top = '0';
        styles.left = '0';
        break;
      case 'bottom-right':
        styles.bottom = '0';
        styles.right = '0';
        break;
      case 'bottom-left':
        styles.bottom = '0';
        styles.left = '0';
        break;
    }

    Object.assign(this.container.style, styles);
  }

  show(
    message: string,
    type: NotificationType = 'info',
    options: NotificationOptions = {}
  ): string {
    const mergedOptions = { ...this.defaultOptions, ...options };
    const id = `notification-${Date.now()}`;
    
    const notification = this.createNotification(id, message, type, mergedOptions);
    
    if (!this.container) {
      this.init();
    }
    
    if (this.container) {
      this.container.appendChild(notification);
      this.notifications.set(id, notification);

      requestAnimationFrame(() => {
        notification.classList.add('notification-show');
      });

      if (!mergedOptions.persistent) {
        setTimeout(() => {
          this.hide(id);
        }, mergedOptions.duration);
      }
    }

    return id;
  }

  private createNotification(
    id: string,
    message: string,
    type: NotificationType,
    options: NotificationOptions
  ): HTMLElement {
    const notification = document.createElement('div');
    notification.id = id;
    notification.className = `notification notification-${type} ${options.className || ''}`;
    
    const styles: Record<string, string> = {
      padding: '12px 20px',
      borderRadius: '4px',
      backgroundColor: this.getBackgroundColor(type),
      color: '#fff',
      fontSize: '14px',
      lineHeight: '1.5',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      pointerEvents: 'auto',
      cursor: options.onClick ? 'pointer' : 'default',
      opacity: '0',
      transform: 'translateY(-20px)',
      transition: 'all 0.3s ease',
      maxWidth: '400px',
      wordWrap: 'break-word'
    };

    Object.assign(notification.style, styles);

    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="flex: 1;">${message}</span>
        ${options.persistent ? '<button class="notification-close" style="background: none; border: none; color: #fff; cursor: pointer; font-size: 16px; padding: 0; margin-left: 10px;">&times;</button>' : ''}
      </div>
    `;

    if (options.onClick) {
      notification.addEventListener('click', (e) => {
        if (!(e.target as HTMLElement).classList.contains('notification-close')) {
          options.onClick!();
        }
      });
    }

    if (options.persistent) {
      const closeBtn = notification.querySelector('.notification-close');
      if (closeBtn) {
        closeBtn.addEventListener('click', () => this.hide(id));
      }
    }

    return notification;
  }

  private getBackgroundColor(type: NotificationType): string {
    const colors = {
      success: '#4caf50',
      error: '#f44336',
      warning: '#ff9800',
      info: '#2196f3'
    };
    return colors[type];
  }

  hide(id: string): void {
    const notification = this.notifications.get(id);
    if (!notification) return;

    notification.classList.remove('notification-show');
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-20px)';

    setTimeout(() => {
      notification.remove();
      this.notifications.delete(id);
    }, 300);
  }

  hideAll(): void {
    this.notifications.forEach((_, id) => this.hide(id));
  }

  success(message: string, options?: NotificationOptions): string {
    return this.show(message, 'success', options);
  }

  error(message: string, options?: NotificationOptions): string {
    return this.show(message, 'error', options);
  }

  warning(message: string, options?: NotificationOptions): string {
    return this.show(message, 'warning', options);
  }

  info(message: string, options?: NotificationOptions): string {
    return this.show(message, 'info', options);
  }
}

export const defaultNotification = new NotificationManager();