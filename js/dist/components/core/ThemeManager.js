import { StorageManager } from './StorageManager';
export class ThemeManager {
    constructor(config = {}) {
        this.mediaQuery = null;
        this.config = Object.assign({ storageKey: 'theme', defaultTheme: 'auto', onChange: () => { } }, config);
        this.storage = new StorageManager({ prefix: 'keigo_theme_' });
        this.systemTheme = this.getSystemTheme();
        this.currentTheme = this.loadTheme();
        this.init();
    }
    init() {
        if (typeof window === 'undefined')
            return;
        this.applyTheme();
        this.setupSystemThemeListener();
        this.setupToggleButton();
    }
    getSystemTheme() {
        if (typeof window === 'undefined')
            return 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    loadTheme() {
        const saved = this.storage.get(this.config.storageKey);
        return saved || this.config.defaultTheme;
    }
    saveTheme(theme) {
        this.storage.set(this.config.storageKey, theme);
    }
    setupSystemThemeListener() {
        if (typeof window === 'undefined')
            return;
        this.mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = (e) => {
            this.systemTheme = e.matches ? 'dark' : 'light';
            if (this.currentTheme === 'auto') {
                this.applyTheme();
            }
        };
        if (this.mediaQuery.addEventListener) {
            this.mediaQuery.addEventListener('change', handleChange);
        }
        else {
            this.mediaQuery.addListener(handleChange);
        }
    }
    applyTheme() {
        const effectiveTheme = this.getEffectiveTheme();
        document.documentElement.classList.remove('light', 'dark');
        document.documentElement.classList.add(effectiveTheme);
        document.documentElement.setAttribute('data-theme', effectiveTheme);
        this.updateToggleButton(effectiveTheme);
        this.config.onChange(this.currentTheme);
    }
    getEffectiveTheme() {
        return this.currentTheme === 'auto' ? this.systemTheme : this.currentTheme;
    }
    setupToggleButton() {
        const button = document.getElementById('dark-mode-toggle');
        if (!button)
            return;
        button.addEventListener('click', () => this.toggle());
        const effectiveTheme = this.getEffectiveTheme();
        this.updateToggleButton(effectiveTheme);
    }
    updateToggleButton(theme) {
        const button = document.getElementById('dark-mode-toggle');
        if (!button)
            return;
        const icons = {
            light: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 18c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6zm0-10c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4z"/>
        <path d="M13 1h-2v3h2V1zm0 19h-2v3h2v-3zM4 11H1v2h3v-2zm19 0h-3v2h3v-2z"/>
        <path transform="rotate(-45 6.343 6.343)" d="M5.343 5.343h2v2h-2z"/>
        <path transform="rotate(-45 17.657 17.657)" d="M16.657 16.657h2v2h-2z"/>
        <path transform="rotate(45 6.343 17.657)" d="M5.343 16.657h2v2h-2z"/>
        <path transform="rotate(45 17.657 6.343)" d="M16.657 5.343h2v2h-2z"/>
      </svg>`,
            dark: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9c0-.46-.04-.92-.1-1.36-.98 1.37-2.58 2.26-4.4 2.26-3 0-5.4-2.4-5.4-5.4 0-1.81.89-3.42 2.26-4.4-.44-.06-.9-.1-1.36-.1z"/>
      </svg>`
        };
        button.innerHTML = icons[theme];
        button.setAttribute('aria-label', theme === 'light' ? 'ダークモードに切り替え' : 'ライトモードに切り替え');
    }
    setTheme(theme) {
        this.currentTheme = theme;
        this.saveTheme(theme);
        this.applyTheme();
    }
    getTheme() {
        return this.currentTheme;
    }
    getEffectiveThemeValue() {
        return this.getEffectiveTheme();
    }
    toggle() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.setTheme(themes[nextIndex]);
    }
    isAvailable() {
        return this.storage.isAvailable();
    }
    static addCustomTheme(name, cssVariables) {
        const style = document.createElement('style');
        style.textContent = `
      [data-theme="${name}"] {
        ${Object.entries(cssVariables)
            .map(([key, value]) => `--${key}: ${value};`)
            .join('\n')}
      }
    `;
        document.head.appendChild(style);
    }
}
export const defaultThemeManager = new ThemeManager();
//# sourceMappingURL=ThemeManager.js.map