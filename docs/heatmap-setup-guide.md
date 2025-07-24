# ヒートマップツール セットアップガイド

このガイドでは、敬語.jpサイトにヒートマップトラッキングを設定する方法を説明します。

## 対応ヒートマップサービス

### 1. Hotjar（推奨）
最も人気のあるヒートマップツール。無料プランあり。

**設定方法：**
```toml
[params.heatmap]
  provider = "hotjar"
  hotjarId = "YOUR_HOTJAR_ID"  # Hotjar Site IDに置き換え
  privacyControls = true
```

**Hotjar IDの取得方法：**
1. [Hotjar](https://www.hotjar.com/)でアカウント作成
2. サイトを追加
3. Settings → Sites & Organizations → Site IDをコピー

### 2. Microsoft Clarity（無料）
Microsoftの無料ヒートマップツール。

**設定方法：**
```toml
[params.heatmap]
  provider = "clarity"
  clarityId = "YOUR_CLARITY_ID"  # Clarity Project IDに置き換え
  privacyControls = true
```

**Clarity IDの取得方法：**
1. [Microsoft Clarity](https://clarity.microsoft.com/)でアカウント作成
2. プロジェクトを作成
3. Settings → Setup → Project IDをコピー

### 3. FullStory（エンタープライズ向け）
高度な分析機能を持つエンタープライズ向けツール。

**設定方法：**
```toml
[params.heatmap]
  provider = "fullstory"
  fullstoryOrgId = "YOUR_ORG_ID"  # FullStory Org IDに置き換え
  privacyControls = true
```

### 4. Crazy Egg
A/Bテスト機能も備えたヒートマップツール。

**設定方法：**
```toml
[params.heatmap]
  provider = "crazyegg"
  crazyeggAccount = "YOUR_ACCOUNT_NUMBER"  # 8桁のアカウント番号
  privacyControls = true
```

### 5. Lucky Orange
リアルタイムビジター追跡機能付き。

**設定方法：**
```toml
[params.heatmap]
  provider = "luckyorange"
  luckyorangeId = "YOUR_SITE_ID"  # Lucky Orange Site ID
  privacyControls = true
```

### 6. Mouseflow
フォーム分析機能が充実。

**設定方法：**
```toml
[params.heatmap]
  provider = "mouseflow"
  mouseflowId = "YOUR_PROJECT_ID"  # Mouseflow Project ID
  privacyControls = true
```

### 7. カスタムヒートマップトラッカー（無料・軽量）
プライバシー重視の自前実装。データはローカルストレージに保存。

**設定方法：**
```toml
[params.heatmap]
  provider = "custom"
  enabled = true
  sampleRate = 0.1  # 10%のユーザーをサンプリング
  trackClicks = true
  trackMouseMovement = false  # パフォーマンスのためデフォルトはfalse
  trackScroll = true
  trackTouch = true
  debug = false  # 本番環境ではfalse
  # endpoint = "https://your-api.com/heatmap"  # 外部APIを使う場合
  mouseMoveThrottle = 50  # マウス移動の記録間隔（ミリ秒）
  scrollThrottle = 100  # スクロールの記録間隔（ミリ秒）
  batchSize = 50  # バッチサイズ
  flushInterval = 5000  # データ送信間隔（ミリ秒）
  privacyControls = true
```

## カスタムヒートマップトラッカーの機能

### 収集データ
- **クリック位置**：クリックされた座標と要素情報
- **スクロール深度**：ユーザーがどこまでスクロールしたか
- **マウス移動**：マウスの動きのパターン（オプション）
- **タッチ操作**：モバイルでのタッチ位置
- **セッション情報**：ページURL、ビューポートサイズ、デバイス情報

### データの確認方法

ブラウザのコンソールで以下を実行：

```javascript
// ヒートマップデータの取得
const data = window.heatmapInstance.getHeatmapData();
console.log(data);

// データのエクスポート（JSON形式でダウンロード）
const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
const url = URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = 'heatmap-data.json';
a.click();

// データのクリア
window.heatmapInstance.clearData();
```

### デバッグモード

開発時はデバッグモードを有効にすると、クリック位置やスクロール状況が視覚的に表示されます：

```toml
[params.heatmap]
  provider = "custom"
  debug = true  # デバッグモード有効
```

## プライバシー設定

### オプトアウト機能

すべてのヒートマップツールでオプトアウト機能を提供：

```javascript
// ユーザーがヒートマップトラッキングを無効化
window.disableHeatmapTracking();
```

### プライバシーポリシーへの記載例

```
当サイトでは、ユーザー体験の向上のため、ヒートマップツールを使用して
以下の情報を収集しています：

- ページ上でのクリック位置
- スクロールの深さ
- ページ滞在時間
- 使用デバイスの種類

収集された情報は匿名化され、個人を特定することはできません。
ヒートマップトラッキングを無効にしたい場合は、以下の手順に従ってください：

1. ブラウザの開発者ツールを開く（F12キー）
2. コンソールタブを選択
3. window.disableHeatmapTracking() を入力してEnter

または、お問い合わせフォームからご連絡ください。
```

## パフォーマンスへの影響

各ツールのパフォーマンス影響度：

| ツール | スクリプトサイズ | 初期化時間 | 継続的な負荷 |
|--------|-----------------|------------|--------------|
| Custom | ~11KB | <10ms | 極小 |
| Hotjar | ~60KB | ~50ms | 小 |
| Clarity | ~40KB | ~30ms | 小 |
| FullStory | ~80KB | ~100ms | 中 |
| Crazy Egg | ~50KB | ~40ms | 小 |
| Lucky Orange | ~70KB | ~80ms | 中 |
| Mouseflow | ~65KB | ~60ms | 中 |

## ベストプラクティス

### 1. サンプリング率の調整
トラフィックが多いサイトでは、サンプリング率を下げてコストを削減：

```toml
sampleRate = 0.05  # 5%のユーザーのみトラッキング
```

### 2. 不要な機能の無効化
マウス移動追跡はデータ量が多いため、必要な場合のみ有効化：

```toml
trackMouseMovement = false
```

### 3. プライバシーファースト
常にプライバシーコントロールを有効化：

```toml
privacyControls = true
```

### 4. A/Bテストとの併用
ヒートマップデータをA/Bテストの結果分析に活用

## データ分析のヒント

### クリックマップの解釈
- **クリックが集中している場所**：ユーザーの関心が高い
- **クリックされない重要な要素**：デザイン改善が必要
- **クリックできない要素へのクリック**：UIの誤解を生んでいる

### スクロールマップの活用
- **25%地点での離脱**：ファーストビューの改善が必要
- **50%以降の急激な減少**：コンテンツの構成を見直す
- **最下部までのスクロール率**：コンテンツの魅力度を測る

### モバイルとデスクトップの比較
- タッチターゲットのサイズ確認
- スクロール深度の違いを分析
- デバイス別のUI最適化

## トラブルシューティング

### データが記録されない
1. 広告ブロッカーを一時的に無効化
2. ブラウザのコンソールでエラーを確認
3. config.tomlの設定を再確認

### パフォーマンスが低下する
1. サンプリング率を下げる
2. マウス移動追跡を無効化
3. throttle値を増やす

### プライバシー規制への対応
1. GDPRやCCPAに準拠したプライバシーポリシーを用意
2. オプトイン/オプトアウト機能を実装
3. データの保存期間を明記

---

ヒートマップツールの設定に関する質問は、お問い合わせページからご連絡ください。