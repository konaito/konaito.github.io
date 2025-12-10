# Analyticsスクリプトの追加

WebサイトにAnalyticsトラッキングスクリプトを追加し、ページビューを自動的にトラッキングできるようにします。

## 前提条件

- `index.html`または対象となるHTMLファイルが存在すること
- インターネット接続が利用可能であること（外部スクリプトを読み込むため）

## 手順

### 1. トラッキングスクリプトの追加

対象のHTMLファイルの`</head>`タグの直前、または`</body>`タグの直前に以下のスクリプトタグを追加します：

```html
<script src="https://analytics.fybe.jp/analytics.js" async defer></script>
```

**推奨配置場所**: `</head>`タグの直前

#### 実装例

```html
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>あなたのサイト</title>
  
  <!-- トラッキングスクリプト -->
  <script src="https://analytics.fybe.jp/analytics.js" async defer></script>
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

### 3. 適用の確認

1. ブラウザでHTMLファイルを開く
2. 開発者ツールのネットワークタブを開く
3. `analytics.js`が正常に読み込まれているか確認
4. `/api/track`へのPOSTリクエストが送信されているか確認（ステータスコード204が期待される）

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

### セッション管理

セッションIDはLocalStorageに保存され、ブラウザを閉じるまで維持されます。新しいセッションは、LocalStorageがクリアされた場合、または30分間の非アクティブ後に生成されます。

## 注意事項

- スクリプトは`async defer`属性が付いているため、非同期で読み込まれます
- プライバシーポリシーにトラッキングの使用を明記することを推奨します
- このトラッキングスクリプトは個人を特定できる情報（PII）は収集しません

## トラブルシューティング

### スクリプトが読み込まれない場合

1. ブラウザのコンソールでエラーを確認
2. ネットワークタブで`analytics.js`の読み込み状況を確認
3. `https://analytics.fybe.jp/analytics.js`に直接アクセスして、スクリプトが利用可能か確認

### データがダッシュボードに表示されない場合

1. APIリクエストが成功しているか（ステータスコード204）確認
2. ダッシュボードで正しいオリジン（ドメイン）を選択しているか確認
3. 時間範囲のフィルターを確認


