# コンポーネントライブラリ

このディレクトリには、敬語.jpサイトで使用される再利用可能なコンポーネントが含まれています。

## ディレクトリ構造

```
components/
├── core/           # コア機能コンポーネント
│   ├── StorageManager.ts    # LocalStorage管理
│   └── ThemeManager.ts      # テーマ管理
├── ui/             # UIコンポーネント
│   ├── Button.ts            # ボタンコンポーネント
│   ├── Modal.ts             # モーダルダイアログ
│   └── NotificationManager.ts # 通知システム
└── features/       # 機能コンポーネント（今後追加予定）
```

## 使用方法

### 1. StorageManager

```typescript
import { StorageManager } from './components/core/StorageManager';

const storage = new StorageManager({ prefix: 'myapp_' });

// データを保存
storage.set('user', { name: '田中太郎', role: 'admin' });

// データを取得
const user = storage.get('user');

// TTL付きで保存（5分間）
storage.set('token', 'abc123', 5 * 60 * 1000);

// すべてのデータを取得
const allData = storage.getAll();
```

### 2. ThemeManager

```typescript
import { defaultThemeManager } from './components/core/ThemeManager';

// テーマを切り替え
defaultThemeManager.toggle();

// 特定のテーマを設定
defaultThemeManager.setTheme('dark');

// 現在のテーマを取得
const currentTheme = defaultThemeManager.getTheme();
```

### 3. NotificationManager

```typescript
import { defaultNotification } from './components/ui/NotificationManager';

// 成功通知
defaultNotification.success('保存しました');

// エラー通知
defaultNotification.error('エラーが発生しました', {
  duration: 5000,
  persistent: true
});

// 情報通知
defaultNotification.info('新しいメッセージがあります', {
  position: 'top-right',
  onClick: () => console.log('Clicked!')
});
```

### 4. Modal

```typescript
import { createModal, confirm } from './components/ui/Modal';

// 基本的なモーダル
const modal = createModal({
  title: 'お知らせ',
  content: '本当に削除しますか？',
  onConfirm: async () => {
    await deleteItem();
    console.log('削除しました');
  },
  onCancel: () => {
    console.log('キャンセルしました');
  }
});

modal.open();

// 確認ダイアログ
const result = await confirm('本当に実行しますか？');
if (result) {
  // ユーザーが確認した場合の処理
}
```

### 5. Button

```typescript
import { createButton } from './components/ui/Button';

// 基本的なボタン
const button = createButton({
  text: 'クリック',
  variant: 'primary',
  onClick: async () => {
    await doSomething();
  }
});

// アイコン付きボタン
const shareButton = createButton({
  icon: '<svg>...</svg>',
  text: 'シェア',
  variant: 'secondary',
  tooltip: 'この記事をシェア',
  onClick: () => shareArticle()
});

// ボタンを要素に追加
button.appendTo(document.getElementById('button-container'));
```

## 既存コードの移行例

### Before (旧コード)
```javascript
// dark-mode.js
(function() {
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.classList.add(savedTheme);
  
  window.toggleDarkMode = function() {
    const current = localStorage.getItem('theme') || 'light';
    const newTheme = current === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.remove(current);
    document.documentElement.classList.add(newTheme);
  };
})();
```

### After (新コード)
```typescript
// dark-mode-refactored.ts
import { defaultThemeManager } from './components/core/ThemeManager';

// グローバル関数を提供（後方互換性のため）
window.toggleDarkMode = () => {
  defaultThemeManager.toggle();
};
```

## 開発ガイドライン

1. **TypeScript使用**: すべてのコンポーネントはTypeScriptで記述
2. **単一責任の原則**: 各コンポーネントは1つの明確な責任を持つ
3. **設定可能性**: オプションパラメータで柔軟にカスタマイズ可能
4. **後方互換性**: 既存のコードとの互換性を保つ
5. **アクセシビリティ**: ARIA属性やキーボード操作をサポート

## 今後の追加予定

- **FormValidator**: フォームバリデーション
- **DataTable**: データテーブルコンポーネント
- **Carousel**: カルーセル/スライダー
- **Tabs**: タブコンポーネント
- **Accordion**: アコーディオンコンポーネント