# コンポーネントテスト

このディレクトリには、コンポーネントライブラリのユニットテストが含まれています。

## テスト構成

- **Jest**: テストランナー
- **TypeScript**: 型安全なテスト
- **jsdom**: DOM環境のシミュレーション
- **@testing-library/jest-dom**: 追加のマッチャー

## テストの実行

```bash
# すべてのテストを実行
npm test

# ウォッチモードでテストを実行
npm test:watch

# カバレッジレポート付きでテストを実行
npm test:coverage

# 特定のテストファイルのみ実行
npm test StorageManager
```

## テスト構造

```
__tests__/
├── core/
│   ├── StorageManager.test.ts
│   └── ThemeManager.test.ts
└── ui/
    ├── Button.test.ts
    ├── Modal.test.ts
    └── NotificationManager.test.ts
```

## テストの書き方

### 基本的なテスト例

```typescript
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  let component: ComponentName;

  beforeEach(() => {
    // テストごとの初期化
    component = new ComponentName();
  });

  afterEach(() => {
    // テストごとのクリーンアップ
    jest.clearAllMocks();
  });

  describe('methodName', () => {
    it('should do something expected', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = component.methodName(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### DOM操作のテスト

```typescript
describe('DOM manipulation', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should update DOM correctly', () => {
    const button = new Button({ text: 'Click me' });
    button.appendTo(container);
    
    expect(container.querySelector('button')).toBeInTheDocument();
    expect(container.textContent).toContain('Click me');
  });
});
```

### 非同期処理のテスト

```typescript
it('should handle async operations', async () => {
  const onClick = jest.fn().mockResolvedValue('result');
  const button = new Button({ onClick });
  
  await button.click();
  
  expect(onClick).toHaveBeenCalled();
  expect(await onClick()).toBe('result');
});
```

### タイマーのテスト

```typescript
describe('Timer tests', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should execute after delay', () => {
    const callback = jest.fn();
    setTimeout(callback, 1000);
    
    jest.advanceTimersByTime(1000);
    
    expect(callback).toHaveBeenCalled();
  });
});
```

## モックとスタブ

### localStorage のモック

```typescript
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

global.localStorage = localStorageMock;
```

### イベントのモック

```typescript
const event = new MouseEvent('click', {
  bubbles: true,
  cancelable: true,
});

element.dispatchEvent(event);
```

## ベストプラクティス

1. **AAA パターン**: Arrange（準備）、Act（実行）、Assert（検証）の構造を使用
2. **単一責任**: 各テストは1つの動作のみをテスト
3. **独立性**: テストは他のテストに依存しない
4. **明確な名前**: テスト名は何をテストしているかを明確に記述
5. **クリーンアップ**: afterEachでリソースをクリーンアップ

## カバレッジ目標

現在の設定では、以下のカバレッジ目標が設定されています：

- ブランチ: 70%
- 関数: 70%
- 行: 70%
- ステートメント: 70%

## トラブルシューティング

### よくある問題

1. **`window is not defined`**: testEnvironmentが'node'になっている場合は'jsdom'に変更
2. **TypeScriptエラー**: @types/jestが正しくインストールされているか確認
3. **モックが機能しない**: jest.clearAllMocks()が適切に呼ばれているか確認

### デバッグ

```typescript
// コンソールログを使用したデバッグ
console.log('Current state:', component.getState());

// デバッガーを使用
debugger;

// スナップショットテスト
expect(element).toMatchSnapshot();
```