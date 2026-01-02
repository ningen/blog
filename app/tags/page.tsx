import { getAllTags, getAllPosts } from '@/lib/posts'
import Link from 'next/link'

export default async function TagsPage() {
  const tags = await getAllTags()
  const allPosts = await getAllPosts()

  // 各タグの記事数を計算
  const tagCounts = tags.map((tag) => ({
    tag,
    count: allPosts.filter((post) => post.tags.includes(tag)).length,
  }))

  return (
    <div>
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← 記事一覧に戻る
        </Link>
        <h2 className="text-3xl font-bold">すべてのタグ</h2>
      </div>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-wrap gap-3">
          {tagCounts.map(({ tag, count }) => (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full hover:bg-blue-200 transition-colors"
            >
              #{tag} ({count})
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
