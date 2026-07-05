import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { remark } from 'remark'
import gfm from 'remark-gfm'
import remarkRehype from 'remark-rehype'
import rehypePrettyCode from 'rehype-pretty-code'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeStringify from 'rehype-stringify'

const postsDirectory = path.join(process.cwd(), 'posts')
const supportedPostExtensions = ['.md', '.org'] as const

type PostExtension = (typeof supportedPostExtensions)[number]

interface PostSource {
  slug: string
  extension: PostExtension
  fullPath: string
}

interface ParsedPostData {
  title?: unknown
  date?: unknown
  excerpt?: unknown
  tags?: unknown
  category?: unknown
}

/**
 * タグに日本語（マルチバイト文字）が含まれているかチェック
 * 含まれている場合はエラーをスロー
 */
function validateTagsAreAsciiOnly(tags: string[]) {
  // 日本語文字を検出する正規表現（ひらがな、カタカナ、漢字、全角記号など）
  const japaneseRegex = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/

  const invalidTags = tags.filter(tag => japaneseRegex.test(tag))

  if (invalidTags.length > 0) {
    throw new Error(
      `❌ Build Error: Tags must not contain Japanese characters.\n` +
      `Found invalid tags: ${invalidTags.join(', ')}\n` +
      `Please use English or ASCII-only characters for tags.\n` +
      `Example: "Web開発" → "web-development", "非同期処理" → "async-programming"`
    )
  }
}

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

function getPostSources(): PostSource[] {
  if (!fs.existsSync(postsDirectory)) {
    return []
  }

  return fs.readdirSync(postsDirectory)
    .map((fileName) => {
      const extension = path.extname(fileName)
      if (!isSupportedPostExtension(extension)) {
        return undefined
      }

      return {
        slug: path.basename(fileName, extension),
        extension,
        fullPath: path.join(postsDirectory, fileName),
      }
    })
    .filter((source): source is PostSource => source !== undefined)
}

function isSupportedPostExtension(extension: string): extension is PostExtension {
  return supportedPostExtensions.includes(extension as PostExtension)
}

function getPostSourceBySlug(slug: string): PostSource {
  const matches = getPostSources().filter((source) => source.slug === slug)

  if (matches.length === 0) {
    throw new Error(`Post not found: ${slug}`)
  }

  if (matches.length > 1) {
    throw new Error(`Duplicate post slug found: ${slug}`)
  }

  return matches[0]
}

function normalizeDate(date: unknown): string {
  return typeof date === 'string' ? date : (date ? String(date).split('T')[0] : '')
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map(String)
  }

  if (typeof value === 'string') {
    return value.split(/[,\s]+/).map((item) => item.trim()).filter(Boolean)
  }

  return []
}

function normalizeOptionalStringArray(value: unknown): string[] | undefined {
  const values = normalizeStringArray(value)
  return values.length > 0 ? values : undefined
}

function normalizePostMeta(slug: string, data: ParsedPostData): PostMeta {
  return {
    slug,
    title: typeof data.title === 'string' ? data.title : '',
    date: normalizeDate(data.date),
    excerpt: typeof data.excerpt === 'string' ? data.excerpt : '',
    tags: normalizeStringArray(data.tags),
    category: normalizeOptionalStringArray(data.category),
  }
}

function parseOrgArray(value: string | undefined): string[] | undefined {
  if (!value) {
    return undefined
  }

  const trimmed = value.trim()
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed.slice(1, -1).split(',').map((item) => item.trim()).filter(Boolean)
  }

  if (trimmed.startsWith(':') && trimmed.endsWith(':')) {
    return trimmed.split(':').map((item) => item.trim()).filter(Boolean)
  }

  return trimmed.split(/[,\s]+/).map((item) => item.trim()).filter(Boolean)
}

function parseOrgPost(fileContents: string): { data: ParsedPostData, content: string } {
  const meta = new Map<string, string>()
  const contentLines: string[] = []
  let inMetadata = true

  for (const line of fileContents.split(/\r?\n/)) {
    const keyword = line.match(/^#\+([A-Z_]+):\s*(.*)$/i)

    if (inMetadata && keyword) {
      meta.set(keyword[1].toLowerCase(), keyword[2].trim())
      continue
    }

    if (line.trim() !== '' && !keyword) {
      inMetadata = false
    }

    if (!keyword) {
      contentLines.push(line)
    }
  }

  const tags = parseOrgArray(meta.get('tags')) ?? parseOrgArray(meta.get('filetags')) ?? []

  return {
    data: {
      title: meta.get('title') || '',
      date: meta.get('date') || '',
      excerpt: meta.get('excerpt') || meta.get('description') || '',
      tags,
      category: parseOrgArray(meta.get('category')),
    },
    content: orgToMarkdown(contentLines.join('\n').trim()),
  }
}

function orgToMarkdown(content: string): string {
  const markdownLines: string[] = []
  let sourceLanguage: string | undefined
  let inQuote = false

  for (const line of content.split(/\r?\n/)) {
    const sourceStart = line.match(/^#\+begin_src\s+(\S+)/i)
    if (sourceStart) {
      sourceLanguage = sourceStart[1]
      markdownLines.push(`\`\`\`${sourceLanguage}`)
      continue
    }

    if (/^#\+end_src/i.test(line)) {
      sourceLanguage = undefined
      markdownLines.push('```')
      continue
    }

    if (sourceLanguage) {
      markdownLines.push(line)
      continue
    }

    if (/^#\+begin_quote/i.test(line)) {
      inQuote = true
      continue
    }

    if (/^#\+end_quote/i.test(line)) {
      inQuote = false
      markdownLines.push('')
      continue
    }

    if (/^#\+/.test(line)) {
      continue
    }

    const heading = line.match(/^(\*+)\s+(.*)$/)
    if (heading) {
      markdownLines.push(`${'#'.repeat(heading[1].length)} ${convertOrgInline(heading[2])}`)
      continue
    }

    const convertedLine = convertOrgInline(line)
    markdownLines.push(inQuote && convertedLine ? `> ${convertedLine}` : convertedLine)
  }

  return markdownLines.join('\n')
}

function convertOrgInline(value: string): string {
  return value
    .replace(/\[\[([^\]]+)\]\[([^\]]+)\]\]/g, (_match, target: string, label: string) => {
      const normalizedTarget = normalizeOrgLinkTarget(target)
      return isImageLinkTarget(normalizedTarget)
        ? `![${label}](${normalizedTarget})`
        : `[${label}](${normalizedTarget})`
    })
    .replace(/\[\[([^\]]+)\]\]/g, (_match, target: string) => {
      const normalizedTarget = normalizeOrgLinkTarget(target)
      return isImageLinkTarget(normalizedTarget)
        ? `![](${normalizedTarget})`
        : `[${normalizedTarget}](${normalizedTarget})`
    })
    .replace(/(^|[\s([{「『、。])=([^=\n]+)=($|[\s.,;:!?)}\]、。])/g, (_match, before: string, content: string, after: string) => {
      return `${before}<code>${escapeHtml(content)}</code>${after}`
    })
    .replace(/(^|[\s([{「『、。])~([^~\n]+)~($|[\s.,;:!?)}\]、。])/g, (_match, before: string, content: string, after: string) => {
      return `${before}<code>${escapeHtml(content)}</code>${after}`
    })
    .replace(/(^|[\s([{「『、。])\*([^*\n]+)\*($|[\s.,;:!?)}\]、。])/g, '$1<strong>$2</strong>$3')
    .replace(/(^|[\s([{「『、。])\/([^/\n]+)\/($|[\s.,;:!?)}\]、。])/g, '$1<em>$2</em>$3')
}

function normalizeOrgLinkTarget(target: string): string {
  return target.replace(/^file:/, '')
}

function isImageLinkTarget(target: string): boolean {
  return /\.(avif|gif|jpe?g|png|svg|webp)$/i.test(target)
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

async function renderMarkdownToHtml(content: string): Promise<string> {
  const processedContent = await remark()
    .use(gfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings)
    .use(rehypePrettyCode, {
      theme: 'github-dark',
      keepBackground: true,
    })
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content)

  return processedContent.toString()
}

export async function getAllPosts(): Promise<PostMeta[]> {
  const allPostsData = getPostSources()
    .map((source) => {
      const fileContents = fs.readFileSync(source.fullPath, 'utf8')
      const { data } = source.extension === '.org' ? parseOrgPost(fileContents) : matter(fileContents)
      return normalizePostMeta(source.slug, data)
    })

  return allPostsData.sort((a, b) => (a.date < b.date ? 1 : -1))
}

export async function getPostBySlug(slug: string): Promise<Post> {
  const source = getPostSourceBySlug(slug)
  const fileContents = fs.readFileSync(source.fullPath, 'utf8')
  const { data, content } = source.extension === '.org' ? parseOrgPost(fileContents) : matter(fileContents)
  const contentHtml = await renderMarkdownToHtml(content)
  const meta = normalizePostMeta(slug, data)

  return {
    ...meta,
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
  const tagArray = Array.from(tags).sort()

  // タグのバリデーション：日本語が含まれていたらエラー
  validateTagsAreAsciiOnly(tagArray)

  return tagArray
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
