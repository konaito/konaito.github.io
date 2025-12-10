# ERR_BLOCKED_BY_CLIENT エラー分析と対策

## 概要

`ERR_BLOCKED_BY_CLIENT`は、ブラウザのクライアント側（拡張機能やブラウザ設定）によってリソースの読み込みがブロックされた際に発生するエラーです。特に、Analyticsトラッキングスクリプトなどの外部リソースが広告ブロッカーやプライバシー拡張機能によってブロックされる場合によく見られます。

## エラーの発生メカニズム

### ブロッキングの仕組み

広告ブロッカーやプライバシー拡張機能は、以下の方法でリソースをブロックします：

1. **フィルターリストによる検出**
   - 拡張機能は、既知の広告サーバーやトラッキングスクリプトのURLパターンを保持したフィルターリストを使用
   - ページ読み込み時に、各リクエストのURLをこのリストと照合
   - マッチした場合、ブラウザのネットワークレイヤーでリクエストをブロック

2. **パターンマッチング**
   - URLに特定のキーワード（`analytics`, `tracking`, `ad`, `tracker`など）が含まれている場合にブロック
   - ドメイン名が既知のトラッキングサービスと一致する場合にブロック

3. **要素の非表示**
   - HTMLに直接埋め込まれた広告要素に対しては、CSSを注入して非表示にする

### エラーの発生タイミング

```
ページ読み込み
  ↓
スクリプトタグの検出
  ↓
URLのフィルターリスト照合
  ↓
マッチ → ネットワークレイヤーでブロック
  ↓
ERR_BLOCKED_BY_CLIENT エラー発生
```

## 主な原因

### 1. 広告ブロッカー拡張機能

最も一般的な原因です。以下のような拡張機能が該当します：

- **uBlock Origin**: オープンソースの広告ブロッカー、非常に強力
- **AdBlock Plus**: 人気の広告ブロッカー
- **AdBlock**: シンプルな広告ブロッカー
- **AdGuard**: 多機能な広告ブロッカー

### 2. プライバシー拡張機能

トラッキングを防ぐことを目的とした拡張機能：

- **Privacy Badger**: EFFが開発したプライバシー保護ツール
- **Ghostery**: トラッキングスクリプトを検出・ブロック
- **DuckDuckGo Privacy Essentials**: プライバシー保護機能

### 3. ブラウザの組み込み機能

一部のブラウザには、標準でトラッキングブロック機能が組み込まれています：

- **Brave Browser**: デフォルトでトラッキングをブロック
- **Firefox**: Enhanced Tracking Protection機能
- **Safari**: Intelligent Tracking Prevention (ITP)

### 4. 企業のファイアウォール/プロキシ設定

企業ネットワークでは、セキュリティポリシーによりトラッキングスクリプトがブロックされる場合があります。

### 5. DNSレベルのブロック

Pi-holeなどのDNSレベルの広告ブロッカーも原因となる可能性があります。

## 診断方法

### ブラウザコンソールでの確認

開発者ツール（F12）のコンソールタブで、以下のようなエラーが表示されます：

```
GET https://analytics.fybe.jp/tracker.js net::ERR_BLOCKED_BY_CLIENT
```

### ネットワークタブでの確認

1. 開発者ツールのネットワークタブを開く
2. ページを再読み込み
3. `tracker.js`のリクエストを確認
4. ステータスが「(blocked:other)」または「(failed)net::ERR_BLOCKED_BY_CLIENT」と表示される

### 診断コードの実装

以下のような診断コードを実装することで、ブロックの原因を特定できます：

```javascript
(function() {
    var scriptUrl = 'https://analytics.fybe.jp/tracker.js';
    var diagnostics = {
        url: scriptUrl,
        blocked: false,
        reason: null,
        method: null
    };

    // fetchで確認
    fetch(scriptUrl, { method: 'HEAD', mode: 'no-cors' })
        .then(function() {
            diagnostics.method = 'fetch (no-cors) - 成功';
            loadScript();
        })
        .catch(function(error) {
            diagnostics.method = 'fetch (no-cors) - 失敗';
            diagnostics.reason = error.message || 'Unknown error';
            loadScript();
        });

    function loadScript() {
        try {
            var script = document.createElement('script');
            script.src = scriptUrl;
            script.async = true;
            script.defer = true;
            
            script.onerror = function(event) {
                diagnostics.blocked = true;
                diagnostics.method = diagnostics.method || 'script tag';
                diagnostics.reason = 'ERR_BLOCKED_BY_CLIENT (onerrorイベント)';
                reportDiagnostics();
            };
            
            script.onload = function() {
                diagnostics.blocked = false;
                diagnostics.reason = '正常に読み込まれました';
                reportDiagnostics();
            };
            
            setTimeout(function() {
                if (!diagnostics.reason) {
                    diagnostics.blocked = true;
                    diagnostics.reason = 'タイムアウト';
                    reportDiagnostics();
                }
            }, 5000);
            
            document.head.appendChild(script);
        } catch (e) {
            diagnostics.blocked = true;
            diagnostics.reason = '例外: ' + e.message;
            reportDiagnostics();
        }
    }

    function reportDiagnostics() {
        console.group('🔍 Analyticsスクリプト診断結果');
        console.log('URL:', diagnostics.url);
        console.log('ブロック状態:', diagnostics.blocked ? '❌ ブロックされています' : '✅ 読み込み成功');
        console.log('検出方法:', diagnostics.method);
        console.log('理由:', diagnostics.reason);
        console.groupEnd();
    }
})();
```

## 対策と回避方法

### 1. プロキシ経由での配信

スクリプトを自分のドメイン経由で配信することで、ブロックを回避できる可能性があります：

```html
<!-- 自分のドメイン経由で配信 -->
<script src="https://yourdomain.com/analytics/tracker.js" async defer></script>
```

**実装方法**:
- サーバー側でプロキシを設定し、`/analytics/tracker.js`へのリクエストを`https://analytics.fybe.jp/tracker.js`に転送
- NginxやApacheのリバースプロキシ設定を使用

### 2. サブドメインの使用

専用のサブドメインを設定し、トラッキング関連のキーワードを避けた名前を使用：

```html
<!-- 例: analyticsではなく、別の名前を使用 -->
<script src="https://metrics.yourdomain.com/tracker.js" async defer></script>
```

**注意**: `analytics`や`tracking`などのキーワードを含むサブドメイン名は避ける

### 3. サーバーサイドタグ管理

サーバーサイドでタグを管理することで、クライアント側でのブロックを回避：

- Google Tag Manager Server-Side
- 自社サーバーでのタグ管理システム構築

### 4. カスタムローダーの使用

スクリプト名を変更し、標準的な命名規則を避ける：

```javascript
// 例: tracker.js ではなく、別の名前に変更
<script src="https://yourdomain.com/assets/app.js" async defer></script>
```

### 5. プライバシー重視のAnalyticsツールの使用

広告ブロッカーにブロックされにくい、プライバシー重視のAnalyticsツールを検討：

- **Umami**: オープンソース、プライバシー重視
- **Simple Analytics**: プライバシー重視のAnalytics
- **Plausible Analytics**: GDPR準拠、軽量

### 6. エラーハンドリングの実装

ブロックされてもページの動作に影響しないよう、適切なエラーハンドリングを実装：

```javascript
(function() {
    try {
        var script = document.createElement('script');
        script.src = 'https://analytics.fybe.jp/tracker.js';
        script.async = true;
        script.defer = true;
        script.onerror = function() {
            // エラーを静かに処理（ブロックされてもページは正常に動作）
        };
        script.onload = function() {
            // 正常に読み込まれた場合の処理
        };
        document.head.appendChild(script);
    } catch (e) {
        // エラーを無視
    }
})();
```

## ブロック率の推定

実際のユーザーのうち、どの程度が広告ブロッカーを使用しているかを推定する方法：

### ダミースクリプトによる検出

```javascript
// 広告ブロッカーがブロックする可能性の高いダミースクリプト
var adBlockDetected = false;
var testScript = document.createElement('script');
testScript.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
testScript.onerror = function() {
    adBlockDetected = true;
    // ブロックされている場合の処理
};
testScript.onload = function() {
    adBlockDetected = false;
    // ブロックされていない場合の処理
};
document.head.appendChild(testScript);
```

## 注意事項

### 1. 完全な回避は困難

高度な広告ブロッカーは、様々なパターンを検出するため、完全にブロックを回避することは困難です。

### 2. ユーザー体験への影響

ブロックを回避しようとする試みは、ユーザーのプライバシー設定に反する可能性があり、ユーザー体験を損なう可能性があります。

### 3. 法的・倫理的考慮

- プライバシーポリシーでトラッキングの使用を明記する
- ユーザーにオプトアウトの選択肢を提供する
- GDPR、CCPAなどのプライバシー規制に準拠する

### 4. データの不完全性を認識

広告ブロッカーを使用しているユーザーのデータは収集できないため、Analyticsデータは不完全であることを認識する必要があります。

## 推奨される対応

1. **エラーハンドリングの実装**: ブロックされてもページが正常に動作するようにする
2. **データの不完全性を認識**: ブロックされたユーザーのデータは収集できないことを理解する
3. **プライバシー重視のアプローチ**: 可能であれば、プライバシー重視のAnalyticsツールを検討する
4. **透明性の確保**: トラッキングの使用をプライバシーポリシーで明記する

## 参考リンク

- [uBlock Origin - GitHub](https://github.com/gorhill/uBlock)
- [Privacy Badger - EFF](https://privacybadger.org/)
- [Simple Analytics - Bypass Ad Blockers](https://docs.simpleanalytics.com/bypass-ad-blockers)
- [Umami - Bypass Ad Blockers](https://umami.is/docs/bypass-ad-blockers)

## まとめ

`ERR_BLOCKED_BY_CLIENT`エラーは、広告ブロッカーやプライバシー拡張機能が正常に機能している証拠です。このエラーを完全に回避することは困難ですが、適切なエラーハンドリングを実装することで、ブロックされてもページが正常に動作するようにできます。

重要なのは、データの不完全性を認識し、ユーザーのプライバシー選択を尊重することです。
