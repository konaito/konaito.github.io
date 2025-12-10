# カスタムイベントのトラッキング

Analyticsスクリプトが追加済みのWebサイトで、カスタムイベントをトラッキングする方法を説明します。

## 前提条件

- Analyticsスクリプトが既に追加されていること（`analytics.md`を参照）
- `window.MyTracker`が利用可能であること

## カスタムイベントの送信

カスタムイベントを送信するには、`window.MyTracker.push()`メソッドを使用します。

### 基本的な使い方

```javascript
// イベント名のみ
window.MyTracker.push(['event_name']);

// イベント名とペイロード（追加データ）
window.MyTracker.push(['event_name', { key: 'value' }]);
```

## 使用例

### ボタンクリックのトラッキング

```html
<button onclick="trackButtonClick()">クリック</button>

<script>
function trackButtonClick() {
  if (window.MyTracker) {
    window.MyTracker.push(['button_click', {
      button_id: 'cta_button',
      button_text: '今すぐ始める',
      page: window.location.pathname
    }]);
  }
}
</script>
```

または、より安全な方法：

```javascript
document.querySelector('.button').addEventListener('click', function() {
  if (window.MyTracker) {
    window.MyTracker.push(['button_click', {
      button_id: 'cta_button',
      button_text: this.textContent,
      page: window.location.pathname
    }]);
  }
});
```

### 購入イベントのトラッキング

```javascript
if (window.MyTracker) {
  window.MyTracker.push(['purchase', {
    transaction_id: 'TXN-12345',
    value: 5000,
    currency: 'JPY',
    items: [
      { id: 'item1', name: '商品A', price: 3000, quantity: 1 },
      { id: 'item2', name: '商品B', price: 2000, quantity: 1 }
    ]
  }]);
}
```

### フォーム送信のトラッキング

```javascript
document.getElementById('contact-form').addEventListener('submit', function(e) {
  if (window.MyTracker) {
    window.MyTracker.push(['form_submit', {
      form_id: 'contact',
      form_name: 'お問い合わせフォーム'
    }]);
  }
});
```

### スクロール深度のトラッキング

```javascript
let maxScroll = 0;
window.addEventListener('scroll', function() {
  const scrollPercent = Math.round(
    (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
  );
  
  if (scrollPercent > maxScroll && scrollPercent >= 50 && window.MyTracker) {
    maxScroll = scrollPercent;
    window.MyTracker.push(['scroll_depth', {
      depth: scrollPercent
    }]);
  }
});
```

## 注意事項

- `window.MyTracker`が利用可能になる前にイベントを送信しようとするとエラーになる可能性があります
- カスタムイベントを送信する際は、必ず`window.MyTracker`の存在を確認してから使用してください
- スクリプトは`async defer`属性が付いているため、非同期で読み込まれます

## トラブルシューティング

### イベントが送信されない場合

1. `window.MyTracker`が定義されているか確認：
   ```javascript
   console.log(window.MyTracker);
   ```
2. スクリプトが読み込まれる前に`window.MyTracker.push()`を呼んでいないか確認
3. ブラウザの開発者ツールのネットワークタブで、`/api/track`へのPOSTリクエストを確認
4. イベント送信時に`window.MyTracker`の存在チェックが正しく行われているか確認


