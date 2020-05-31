# README #

## AWG.js

Windows用MML音源ドライバ AWG のWeb Audio API 対応版です。
AWG -> awgsoft.com

## AWGの機能

* MMLベースのモジュラーシンセ
* OSC(サイン波,矩形波, etc.) + ADSR EG をほぼ無制限に使用可能
* FM変調

## 環境
* npm(node.js) + typescript + webpack
* Web Audio API (Audio Worklet)
* Chromeのみ対応

## 利用方法

### HTMLからの使用

#### webpack ビルド
```
npm run build
```

#### 基本的な使い方
`./dist/awg.js` をHTMLからリンク

```
Awg.load(mml, options);
Awg.play();
```

詳細はAWG UIリポジトリを参照

### node.jsからの使用
Selenium等でのブラウザレスな再生に対応予定


## ライセンス

Apache License 2.0

## MMLマニュアル
準備中

