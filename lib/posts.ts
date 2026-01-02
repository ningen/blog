import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import html from 'remark-html'
import gfm from 'remark-gfm'
import rehypeHighlight from 'rehype-highlight'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'

const postsDirectory = path.join(process.cwd(), 'posts')

export interface Post {
  slug: string
  title: string
  date: string
  excerpt: string
  tags: string[]
  category?: string[]
  content: string
}

export interface PostMeta {
  slug: string
  title: string
  date: string
  excerpt: string
  tags: string[]
  category?: string[]
}

export async function getAllPosts(): Promise<PostMeta[]> {
  // postsディレクトリが存在しない場合は空配列を返す
  if (!fs.existsSync(postsDirectory)) {
    return []
  }

  const fileNames = fs.readdirSync(postsDirectory)
  const allPostsData = fileNames
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, '')
      const fullPath = path.join(postsDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data } = matter(fileContents)

      return {
        slug,
        title: data.title || '',
        date: typeof data.date === 'string' ? data.date : (data.date ? String(data.date).split('T')[0] : ''),
        excerpt: data.excerpt || '',
        tags: data.tags || [],
        category: data.category || undefined,
      }
    })

  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export async function getPostBySlug(slug: string): Promise<Post> {
  const fullPath = path.join(postsDirectory, `${slug}.md`)
  const fileContents = fs.readFileSync(fullPath, 'utf8')
  const { data, content } = matter(fileContents)

  const processedContent = await remark()
    .use(gfm)
    .use(html, { sanitize: false })
    .process(content)

  const contentHtml = processedContent.toString()

  return {
    slug,
    title: data.title || '',
    date: typeof data.date === 'string' ? data.date : (data.date ? String(data.date).split('T')[0] : ''),
    excerpt: data.excerpt || '',
    tags: data.tags || [],
    category: data.category || undefined,
    content: contentHtml,
  }
}

export async function getPostsByTag(tag: string): Promise<PostMeta[]> {
  const allPosts = await getAllPosts()
  return allPosts.filter((post) => post.tags.includes(tag))
}

export async function getPostsByCategory(category: string[]): Promise<PostMeta[]> {
  const allPosts = await getAllPosts()
  return allPosts.filter((post) => {
    if (!post.category) return false
    return category.every((cat, index) => post.category?.[index] === cat)
  })
}

export async function getAllTags(): Promise<string[]> {
  const allPosts = await getAllPosts()
  const tags = new Set<string>()
  allPosts.forEach((post) => {
    post.tags.forEach((tag) => tags.add(tag))
  })
  return Array.from(tags).sort()
}

export async function getAllCategories(): Promise<string[][]> {
  const allPosts = await getAllPosts()
  const categories = new Set<string>()
  allPosts.forEach((post) => {
    if (post.category) {
      categories.add(JSON.stringify(post.category))
    }
  })
  return Array.from(categories).map((cat) => JSON.parse(cat))
}
