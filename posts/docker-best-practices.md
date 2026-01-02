---
title: Dockerのベストプラクティス2026
date: 2025-12-30
excerpt: 本番環境で使えるDockerイメージの作成と運用のベストプラクティスを紹介します
tags: [Docker, DevOps, コンテナ, インフラ]
category: [インフラ, Docker]
---

# Dockerのベストプラクティス2026

Dockerコンテナを本番環境で運用する際の重要なベストプラクティスをまとめました。

## マルチステージビルドの活用

マルチステージビルドを使うことで、イメージサイズを大幅に削減できます。

```dockerfile
# ビルドステージ
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

# 実行ステージ
FROM node:20-alpine

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

USER node
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## .dockerignoreの活用

不要なファイルをイメージに含めないようにします。

```
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.DS_Store
```

## セキュリティのベストプラクティス

### rootユーザーを使わない

```dockerfile
FROM node:20-alpine

# 専用ユーザーの作成
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

WORKDIR /app
COPY --chown=nodejs:nodejs . .

# 一般ユーザーに切り替え
USER nodejs

CMD ["node", "index.js"]
```

### イメージのスキャン

```bash
# Trivyでイメージの脆弱性スキャン
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy image myapp:latest
```

## レイヤーキャッシュの最適化

変更頻度の低いコマンドを先に実行することで、ビルド時間を短縮できます。

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# 依存関係のインストール（キャッシュされやすい）
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコード（変更頻度が高い）
COPY . .

CMD ["python", "app.py"]
```

## ヘルスチェックの設定

```dockerfile
FROM node:20-alpine

WORKDIR /app
COPY . .

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

CMD ["node", "server.js"]
```

## docker-compose.ymlの例

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_PASSWORD_FILE=/run/secrets/db_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    secrets:
      - db_password

volumes:
  postgres_data:

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

## まとめ

これらのベストプラクティスに従うことで、セキュアで効率的なDockerコンテナ環境を構築できます。特にマルチステージビルドとセキュリティ設定は必須です。
