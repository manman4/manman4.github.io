# manman4.github.io

GitHub Pages で公開する静的サイトです。HTML・CSS・CSV はそのまま管理し、
JavaScript は TypeScript から生成します。

## 開発

Node.js 22 と npm を使用します。

```sh
npm ci
npm run check
npm run build
npm test
```

`src/main.ts` はブラウザー用、`scripts/*.ts` は Node.js 用です。
`build/` はコンパイル結果、`dist/` は配信用ファイルで、どちらも Git 管理対象外です。
ビルド後は `python3 -m http.server 8000 --directory dist` でプレビューできます。

## カードの静的 HTML 更新

`data/missing_numbers.csv` の最新行を `index.html` に反映します。

```sh
npm run update:card
npm run build
```

## 公開

`main` への push 時に GitHub Actions が依存関係をインストールし、
TypeScript をビルドして `dist/` を GitHub Pages に配信します。

CSV の形式検証、エラー時の表示維持、更新失敗時の HTML 保護、配信対象の限定を
`npm test` で検証します。CI でもテスト成功後に配信します。
`dist/` はビルドごとに作り直すため、手作業でファイルを保存しないでください。
