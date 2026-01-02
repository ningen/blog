# 技術ブログ

Next.js 14とTypeScriptで構築した個人技術ブログシステムです。

## 主な機能

- 📝 Markdownで記事を書ける
- 🏷️ タグによる記事の分類
- 📂 カテゴリーの階層構造（親子関係）
- 💻 シンタックスハイライト付きコードブロック
- 🎨 Tailwind CSSによる美しいデザイン
- ⚡ Next.js 14 App Routerによる高速なページ遷移

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで http://localhost:3000 を開きます。

## 記事の作成

`posts/` ディレクトリにMarkdownファイルを作成します。

### Frontmatterの形式

```markdown
---
title: 記事のタイトル
date: 2026-01-02
excerpt: 記事の要約（一覧ページで表示されます）
tags: [Next.js, React, TypeScript]
category: [フロントエンド, React]
---

# 記事の本文

ここに記事の内容を書きます。
```

### Frontmatterのフィールド説明

- `title`: 記事のタイトル（必須）
- `date`: 公開日（YYYY-MM-DD形式、必須）
- `excerpt`: 記事の要約文（一覧ページで表示）
- `tags`: タグの配列（複数指定可能）
- `category`: カテゴリーの配列（階層構造、例: [親カテゴリー, 子カテゴリー]）

### コードブロックの使用例

バッククォート3つでコードブロックを作成し、言語名を指定するとシンタックスハイライトが適用されます。

````markdown
```typescript
const greeting: string = "Hello, World!"
console.log(greeting)
```
````

対応言語: JavaScript, TypeScript, Python, Go, Rust, Docker, YAML, JSON など

## プロジェクト構成

```
.
├── app/                # Next.js App Router
│   ├── layout.tsx     # 共通レイアウト
│   ├── page.tsx       # トップページ（記事一覧）
│   ├── posts/         # 記事詳細ページ
│   └── tags/          # タグページ
├── lib/
│   └── posts.ts       # 記事データ取得ロジック
├── posts/             # Markdown記事ファイル
└── public/            # 静的ファイル
```

## ビルド

```bash
# 本番ビルド
npm run build

# 本番サーバーの起動
npm start
```

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS
- **Markdown処理**: gray-matter, remark, rehype
- **シンタックスハイライト**: rehype-highlight

## ライセンス

MIT