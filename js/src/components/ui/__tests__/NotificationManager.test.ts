import { NotificationManager } from '../NotificationManager';

describe('NotificationManager', () => {
  let notificationManager: NotificationManager;
  let container: HTMLElement | null;

  beforeEach(() => {
    notificationManager = new NotificationManager();
    container = document.getElementById('notification-container');
  });

  afterEach(() => {
    // Clean up any notifications
    if (container) {
      container.remove();
    }
    jest.clearAllTimers();
  });

  describe('constructor', () => {
    it('should create notification container', () => {
      new NotificationManager();
      const newContainer = document.getElementById('notification-container');
      
      expect(newContainer).toBeTruthy();
      expect(newContainer?.className).toBe('notification-container');
      expect(newContainer?.style.position).toBe('fixed');
    });

    it('should use existing container if present', () => {
      const existingContainer = document.createElement('div');
      existingContainer.id = 'notification-container';
      document.body.appendChild(existingContainer);

      new NotificationManager();
      
      expect(document.querySelectorAll('#notification-container').length).toBe(1);
    });

    it('should apply custom default options', () => {
      new NotificationManager({
        duration: 5000,
        position: 'bottom-right'
      });
      
      const customContainer = document.getElementById('notification-container');
      expect(customContainer?.style.bottom).toBe('0px');
      expect(customContainer?.style.right).toBe('0px');
    });
  });

  describe('show', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should create and display notification', () => {
      const id = notificationManager.show('Test message', 'info');
      
      const notification = document.getElementById(id);
      expect(notification).toBeTruthy();
      expect(notification?.textContent).toContain('Test message');
      expect(notification?.classList.contains('notification-info')).toBe(true);
    });

    it('should auto-hide notification after duration', () => {
      const id = notificationManager.show('Auto hide', 'info', { duration: 3000 });
      
      const notification = document.getElementById(id);
      expect(notification).toBeTruthy();
      
      jest.advanceTimersByTime(3000);
      
      // After hide animation
      jest.advanceTimersByTime(300);
      
      expect(document.getElementById(id)).toBeFalsy();
    });

    it('should show persistent notification', () => {
      const id = notificationManager.show('Persistent', 'info', { persistent: true });
      
      jest.advanceTimersByTime(10000);
      
      const notification = document.getElementById(id);
      expect(notification).toBeTruthy();
      expect(notification?.querySelector('.notification-close')).toBeTruthy();
    });

    it('should handle click event', () => {
      const onClick = jest.fn();
      const id = notificationManager.show('Clickable', 'info', { onClick });
      
      const notification = document.getElementById(id);
      notification?.click();
      
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should close persistent notification on close button click', () => {
      const id = notificationManager.show('Close me', 'info', { persistent: true });
      
      const notification = document.getElementById(id);
      const closeBtn = notification?.querySelector('.notification-close') as HTMLElement;
      closeBtn?.click();
      
      jest.advanceTimersByTime(300);
      
      expect(document.getElementById(id)).toBeFalsy();
    });

    it('should apply custom className', () => {
      const id = notificationManager.show('Custom class', 'info', { 
        className: 'custom-notification' 
      });
      
      const notification = document.getElementById(id);
      expect(notification?.classList.contains('custom-notification')).toBe(true);
    });
  });

  describe('notification types', () => {
    it('should show success notification', () => {
      const id = notificationManager.success('Success!');
      
      const notification = document.getElementById(id);
      expect(notification?.classList.contains('notification-success')).toBe(true);
      expect(notification?.style.backgroundColor).toBe('rgb(76, 175, 80)');
    });

    it('should show error notification', () => {
      const id = notificationManager.error('Error!');
      
      const notification = document.getElementById(id);
      expect(notification?.classList.contains('notification-error')).toBe(true);
      expect(notification?.style.backgroundColor).toBe('rgb(244, 67, 54)');
    });

    it('should show warning notification', () => {
      const id = notificationManager.warning('Warning!');
      
      const notification = document.getElementById(id);
      expect(notification?.classList.contains('notification-warning')).toBe(true);
      expect(notification?.style.backgroundColor).toBe('rgb(255, 152, 0)');
    });

    it('should show info notification', () => {
      const id = notificationManager.info('Info!');
      
      const notification = document.getElementById(id);
      expect(notification?.classList.contains('notification-info')).toBe(true);
      expect(notification?.style.backgroundColor).toBe('rgb(33, 150, 243)');
    });
  });

  describe('hide', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should hide specific notification', () => {
      const id = notificationManager.show('Hide me', 'info');
      
      notificationManager.hide(id);
      
      const notification = document.getElementById(id);
      expect(notification?.style.opacity).toBe('0');
      
      jest.advanceTimersByTime(300);
      
      expect(document.getElementById(id)).toBeFalsy();
    });

    it('should handle hiding non-existent notification', () => {
      expect(() => {
        notificationManager.hide('non-existent');
      }).not.toThrow();
    });
  });

  describe('hideAll', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should hide all notifications', () => {
      const id1 = notificationManager.show('First', 'info');
      const id2 = notificationManager.show('Second', 'error');
      const id3 = notificationManager.show('Third', 'success');
      
      notificationManager.hideAll();
      
      jest.advanceTimersByTime(300);
      
      expect(document.getElementById(id1)).toBeFalsy();
      expect(document.getElementById(id2)).toBeFalsy();
      expect(document.getElementById(id3)).toBeFalsy();
    });
  });

  describe('position options', () => {
    const positions = [
      { position: 'top', expectedStyles: { top: '0px', left: '50%' } },
      { position: 'bottom', expectedStyles: { bottom: '0px', left: '50%' } },
      { position: 'top-right', expectedStyles: { top: '0px', right: '0px' } },
      { position: 'top-left', expectedStyles: { top: '0px', left: '0px' } },
      { position: 'bottom-right', expectedStyles: { bottom: '0px', right: '0px' } },
      { position: 'bottom-left', expectedStyles: { bottom: '0px', left: '0px' } }
    ];

    positions.forEach(({ position, expectedStyles }) => {
      it(`should position container at ${position}`, () => {
        new NotificationManager({ position: position as any });
        const container = document.getElementById('notification-container');
        
        Object.entries(expectedStyles).forEach(([prop, value]) => {
          expect(container?.style[prop as any]).toBe(value);
        });
      });
    });
  });

  describe('animation', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should animate notification on show', () => {
      const id = notificationManager.show('Animated', 'info');
      
      const notification = document.getElementById(id);
      expect(notification?.style.opacity).toBe('0');
      expect(notification?.style.transform).toBe('translateY(-20px)');
      
      // After requestAnimationFrame
      jest.runAllTimers();
      
      expect(notification?.classList.contains('notification-show')).toBe(true);
    });
  });
});