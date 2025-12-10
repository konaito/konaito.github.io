# Analytics トラッキングスクリプト

このプロジェクトは、Webサイトに簡単に組み込めるアナリティクストラッキングスクリプトを提供します。

## クイックスタート

### 1. スクリプトタグの追加

トラッキングを開始するには、あなたのWebサイトのHTMLに以下のスクリプトタグを追加してください：

```html
<script src="https://analytics.fybe.jp/tracker.js" async defer></script>
```

**推奨配置場所**: `</head>`タグの直前、または`</body>`タグの直前

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>あなたのサイト</title>
  
  <!-- トラッキングスクリプト -->
  <script src="https://analytics.fybe.jp/tracker.js" async defer></script>
</head>
<body>
  <!-- あなたのコンテンツ -->
</body>
</html>
```

### 2. 自動トラッキング

スクリプトを追加するだけで、以下の情報が自動的に収集されます：

- **ページビュー**: ページが読み込まれるたびに自動送信
- **URL**: 現在のページURL
- **Origin**: トラッキング対象のサイトのオリジン
- **Referrer**: リファラー情報
- **セッションID**: ブラウザセッションを識別するID（LocalStorageに保存）
- **User Agent**: ブラウザ情報
- **Geo Country**: 国コード（利用可能な場合）

## カスタムイベントの送信

カスタムイベントを送信するには、`window.MyTracker.push()`メソッドを使用します：

### 基本的な使い方

```javascript
// イベント名のみ
window.MyTracker.push(['event_name']);

// イベント名とペイロード（追加データ）
window.MyTracker.push(['event_name', { key: 'value' }]);
```

### 使用例

#### ボタンクリックのトラッキング

```html
<button onclick="trackButtonClick()">クリック</button>

<script>
function trackButtonClick() {
  window.MyTracker.push(['button_click', {
    button_id: 'cta_button',
    button_text: '今すぐ始める',
    page: window.location.pathname
  }]);
}
</script>
```

#### 購入イベントのトラッキング

```javascript
window.MyTracker.push(['purchase', {
  transaction_id: 'TXN-12345',
  value: 5000,
  currency: 'JPY',
  items: [
    { id: 'item1', name: '商品A', price: 3000, quantity: 1 },
    { id: 'item2', name: '商品B', price: 2000, quantity: 1 }
  ]
}]);
```

#### フォーム送信のトラッキング

```javascript
document.getElementById('contact-form').addEventListener('submit', function(e) {
  window.MyTracker.push(['form_submit', {
    form_id: 'contact',
    form_name: 'お問い合わせフォーム'
  }]);
});
```

#### スクロール深度のトラッキング

```javascript
let maxScroll = 0;
window.addEventListener('scroll', function() {
  const scrollPercent = Math.round(
    (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
  );
  
  if (scrollPercent > maxScroll && scrollPercent >= 50) {
    maxScroll = scrollPercent;
    window.MyTracker.push(['scroll_depth', {
      depth: scrollPercent
    }]);
  }
});
```

## データの確認

トラッキングされたデータは、以下のURLでダッシュボードを確認できます：

**ダッシュボード**: https://analytics.fybe.jp

ダッシュボードでは以下の情報を確認できます：

- ページビュー数
- イベントの種類別集計
- オリジン（ドメイン）別の統計
- 期間別のグラフ表示
- 訪問者テーブル

## 技術的な詳細

### API エンドポイント

トラッキングスクリプトは、以下のエンドポイントにデータを送信します：

```
POST https://analytics.fybe.jp/api/track
```

### 送信データ形式

```json
{
  "event_name": "pageview",
  "url": "https://example.com/page",
  "origin": "https://example.com",
  "referrer": "https://google.com",
  "session_id": "abc123xyz",
  "payload": {
    "custom_key": "custom_value"
  }
}
```

### CORS設定

APIはCORSを有効にしており、任意のドメインからのリクエストを受け付けます。本番環境では、必要に応じて特定のドメインに制限することを推奨します。

### セッション管理

セッションIDはLocalStorageに保存され、ブラウザを閉じるまで維持されます。新しいセッションは、LocalStorageがクリアされた場合、または30分間の非アクティブ後に生成されます。

## トラブルシューティング

### スクリプトが読み込まれない

1. ブラウザのコンソールでエラーを確認してください
2. ネットワークタブで`tracker.js`の読み込み状況を確認してください
3. `https://analytics.fybe.jp/tracker.js`に直接アクセスして、スクリプトが利用可能か確認してください

### イベントが送信されない

1. ブラウザの開発者ツールのネットワークタブで、`/api/track`へのPOSTリクエストを確認してください
2. `window.MyTracker`が定義されているか確認してください：
   ```javascript
   console.log(window.MyTracker);
   ```
3. スクリプトが読み込まれる前に`window.MyTracker.push()`を呼んでいないか確認してください

### データがダッシュボードに表示されない

1. APIリクエストが成功しているか（ステータスコード204）確認してください
2. ダッシュボードで正しいオリジン（ドメイン）を選択しているか確認してください
3. 時間範囲のフィルターを確認してください

## プライバシーとコンプライアンス

このトラッキングスクリプトは以下の情報を収集します：

- ページURL
- リファラー
- User Agent
- 国コード（利用可能な場合）
- カスタムイベントデータ

**個人を特定できる情報（PII）は収集しません**。ただし、プライバシーポリシーにトラッキングの使用を明記することを推奨します。

## サポート

問題や質問がある場合は、GitHubのIssuesで報告してください。

