import { defaultThemeManager } from './components/core/ThemeManager';
import { defaultNotification } from './components/ui/NotificationManager';

(() => {
  // 既存の設定を維持しながら、新しいThemeManagerを使用
  const themeManager = defaultThemeManager;

  // グローバル関数を提供（後方互換性のため）
  (window as any).toggleDarkMode = () => {
    themeManager.toggle();
    
    // ユーザーへのフィードバック
    const currentTheme = themeManager.getTheme();
    const messages = {
      light: 'ライトモードに切り替えました',
      dark: 'ダークモードに切り替えました',
      auto: 'システム設定に従うモードに切り替えました'
    };
    
    defaultNotification.info(messages[currentTheme], {
      duration: 2000,
      position: 'top-right'
    });
  };

  // カスタムテーマの例（将来の拡張用）
  // ThemeManager.addCustomTheme('sepia', {
  //   'bg-primary': '#f4f1e8',
  //   'text-primary': '#5c4b3a',
  //   'border-color': '#d4c5b9'
  // });

  // デバッグ情報の提供
  if (process.env.NODE_ENV === 'development') {
    console.log('[ThemeManager] Initialized', {
      currentTheme: themeManager.getTheme(),
      effectiveTheme: themeManager.getEffectiveThemeValue(),
      available: themeManager.isAvailable()
    });
  }
})();