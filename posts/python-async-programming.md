---
title: Pythonの非同期プログラミング入門
date: 2026-01-01
excerpt: asyncioを使った効率的な非同期処理の実装方法を解説します
tags: [Python, async-programming, asyncio]
category: [バックエンド, Python]
---

# Pythonの非同期プログラミング入門

Pythonの`asyncio`ライブラリを使うと、I/O待機時間を有効活用した効率的なプログラムを書くことができます。

## 基本的な非同期関数

`async def`で非同期関数を定義し、`await`で非同期処理の完了を待ちます。

```python
import asyncio

async def fetch_data(url):
    print(f"Fetching {url}...")
    await asyncio.sleep(1)  # ネットワークI/Oのシミュレーション
    return f"Data from {url}"

async def main():
    result = await fetch_data("https://example.com")
    print(result)

# 実行
asyncio.run(main())
```

## 複数のタスクを並行実行

`asyncio.gather()`を使うと、複数の非同期タスクを同時に実行できます。

```python
async def fetch_multiple():
    urls = [
        "https://example.com/1",
        "https://example.com/2",
        "https://example.com/3",
    ]

    tasks = [fetch_data(url) for url in urls]
    results = await asyncio.gather(*tasks)

    for result in results:
        print(result)

asyncio.run(fetch_multiple())
```

## 実践的な例：Web APIの並行アクセス

実際のWebアプリケーションでは、複数のAPIエンドポイントに同時にアクセスすることがよくあります。

```python
import aiohttp
import asyncio

async def fetch_user(session, user_id):
    async with session.get(f"https://api.example.com/users/{user_id}") as response:
        return await response.json()

async def fetch_all_users(user_ids):
    async with aiohttp.ClientSession() as session:
        tasks = [fetch_user(session, uid) for uid in user_ids]
        users = await asyncio.gather(*tasks)
        return users

# 使用例
user_ids = [1, 2, 3, 4, 5]
users = asyncio.run(fetch_all_users(user_ids))
print(users)
```

## エラーハンドリング

非同期処理でも通常のtry-exceptでエラー処理ができます。

```python
async def safe_fetch(url):
    try:
        result = await fetch_data(url)
        return result
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None
```

## まとめ

Pythonの非同期プログラミングを使うことで、I/O待ち時間を有効活用し、アプリケーションのパフォーマンスを大幅に向上させることができます。特にWebスクレイピングやAPI連携などで威力を発揮します。
