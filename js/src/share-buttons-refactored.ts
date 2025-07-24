import { createButton } from './components/ui/Button';
import { defaultNotification } from './components/ui/NotificationManager';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

interface ShareService {
  name: string;
  icon: string;
  getUrl: (url: string, title: string) => string;
  color?: string;
}

class ShareButtonsManager {
  private services: ShareService[] = [
    {
      name: 'Twitter',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22.46 6c-.85.38-1.77.64-2.73.76 1-.6 1.76-1.55 2.12-2.68-.93.55-1.96.95-3.06 1.17-.88-.94-2.13-1.53-3.51-1.53-2.66 0-4.81 2.16-4.81 4.81 0 .38.04.75.13 1.1-4-.2-7.54-2.11-9.91-5.02-.41.71-.65 1.53-.65 2.4 0 1.67.85 3.14 2.14 4.01-.79-.03-1.54-.24-2.19-.6v.06c0 2.33 1.66 4.28 3.86 4.72-.4.11-.83.17-1.27.17-.31 0-.62-.03-.92-.08.62 1.91 2.39 3.3 4.5 3.34-1.65 1.29-3.73 2.06-5.99 2.06-.39 0-.77-.02-1.15-.07 2.13 1.37 4.66 2.16 7.38 2.16 8.85 0 13.69-7.33 13.69-13.69 0-.21 0-.41-.01-.62.94-.68 1.76-1.53 2.4-2.5z"/></svg>',
      getUrl: (url, title) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      color: '#1DA1F2'
    },
    {
      name: 'Facebook',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
      getUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: '#1877F2'
    },
    {
      name: 'LINE',
      icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/></svg>',
      getUrl: (url, title) => `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      color: '#00B900'
    }
  ];

  constructor() {
    this.init();
  }

  private init(): void {
    if (typeof document === 'undefined') return;
    
    document.addEventListener('DOMContentLoaded', () => {
      this.setupShareButtons();
    });
  }

  private setupShareButtons(): void {
    const containers = document.querySelectorAll('.share-buttons');
    
    containers.forEach(container => {
      const url = container.getAttribute('data-url') || window.location.href;
      const title = container.getAttribute('data-title') || document.title;
      
      // Clear existing content
      container.innerHTML = '';
      
      // Add share buttons
      this.services.forEach(service => {
        const button = createButton({
          icon: service.icon,
          variant: 'icon',
          size: 'medium',
          className: 'share-button',
          ariaLabel: `${service.name}でシェア`,
          tooltip: `${service.name}でシェア`,
          tooltipPosition: 'top',
          onClick: () => this.share(service, url, title)
        });
        
        // Apply custom styles
        const element = button.getElement();
        element.style.color = service.color || '#666';
        element.style.padding = '8px';
        
        button.appendTo(container as HTMLElement);
      });
      
      // Add native share button if supported
      if ('share' in navigator) {
        const nativeButton = createButton({
          icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>',
          variant: 'icon',
          size: 'medium',
          className: 'share-button share-native',
          ariaLabel: 'シェア',
          tooltip: 'シェア',
          tooltipPosition: 'top',
          onClick: () => this.nativeShare(url, title)
        });
        
        nativeButton.appendTo(container as HTMLElement);
      }
      
      // Add copy link button
      const copyButton = createButton({
        icon: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>',
        variant: 'icon',
        size: 'medium',
        className: 'share-button share-copy',
        ariaLabel: 'リンクをコピー',
        tooltip: 'リンクをコピー',
        tooltipPosition: 'top',
        onClick: () => this.copyLink(url)
      });
      
      copyButton.appendTo(container as HTMLElement);
    });
  }

  private share(service: ShareService, url: string, title: string): void {
    const shareUrl = service.getUrl(url, title);
    window.open(shareUrl, '_blank', 'width=600,height=400,menubar=no,toolbar=no,resizable=yes');
    
    // Track share event if analytics is available
    if (typeof window.gtag !== 'undefined') {
      window.gtag('event', 'share', {
        method: service.name,
        content_type: 'article',
        item_id: url
      });
    }
  }

  private async nativeShare(url: string, title: string): Promise<void> {
    try {
      await navigator.share({
        title: title,
        url: url
      });
      
      defaultNotification.success('シェアしました');
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
        defaultNotification.error('シェアに失敗しました');
      }
    }
  }

  private async copyLink(url: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(url);
      defaultNotification.success('リンクをコピーしました', {
        duration: 2000
      });
    } catch (error) {
      console.error('Copy failed:', error);
      
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      
      try {
        document.execCommand('copy');
        defaultNotification.success('リンクをコピーしました', {
          duration: 2000
        });
      } catch (e) {
        defaultNotification.error('コピーに失敗しました');
      }
      
      document.body.removeChild(textarea);
    }
  }

  public addService(service: ShareService): void {
    this.services.push(service);
    this.setupShareButtons();
  }

  public removeService(name: string): void {
    this.services = this.services.filter(s => s.name !== name);
    this.setupShareButtons();
  }
}

// Initialize and export
const shareButtons = new ShareButtonsManager();
(window as any).ShareButtons = shareButtons;

export default shareButtons;