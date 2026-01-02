import { getPostsByTag, getAllTags } from '@/lib/posts'
import Link from 'next/link'

export async function generateStaticParams() {
  const tags = await getAllTags()
  return tags.map((tag) => ({
    tag: tag,
  }))
}

export default async function TagPage({ params }: { params: { tag: string } }) {
  const posts = await getPostsByTag(params.tag)

  return (
    <div>
      <div className="mb-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
          ← 記事一覧に戻る
        </Link>
        <h2 className="text-3xl font-bold">
          タグ: <span className="text-blue-600">#{params.tag}</span>
        </h2>
        <p className="text-gray-600 mt-2">{posts.length}件の記事</p>
      </div>
      <div className="grid gap-6">
        {posts.map((post) => (
          <article key={post.slug} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <Link href={`/posts/${post.slug}`}>
              <h3 className="text-2xl font-semibold mb-2 text-blue-600 hover:text-blue-800">
                {post.title}
              </h3>
            </Link>
            {post.category && (
              <div className="text-sm text-gray-600 mb-2">
                カテゴリー: {post.category.join(' > ')}
              </div>
            )}
            <p className="text-gray-600 mb-4">{post.excerpt}</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {post.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/tags/${tag}`}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm hover:bg-blue-200"
                >
                  #{tag}
                </Link>
              ))}
            </div>
            <time className="text-sm text-gray-500">{post.date}</time>
          </article>
        ))}
      </div>
    </div>
  )
}
