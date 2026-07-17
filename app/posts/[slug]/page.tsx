import { getPostBySlug, getAllPosts } from '@/lib/posts'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export async function generateStaticParams() {
  const posts = await getAllPosts()
  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params
    const post = await getPostBySlug(slug)

    return (
      <article className="bg-white rounded-lg shadow-md p-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold mb-4">{post.title}</h1>
          {post.category && (
            <div className="text-sm text-gray-600 mb-2">
              カテゴリー: {post.category.join(' > ')}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-4">
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
          <time className="text-gray-500">{post.date}</time>
        </header>
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
        <div className="mt-12 pt-6 border-t">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← 記事一覧に戻る
          </Link>
        </div>
      </article>
    )
  } catch (error) {
    notFound()
  }
}
