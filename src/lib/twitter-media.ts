// Twitter Video/GIF Downloader: reading tweet links, and the shape /api/twitter-post answers with.
// Kept free of browser globals so api/twitter-post.ts and the tests can import its types.

export type MediaKind = 'video' | 'gif' | 'photo'

export interface MediaVariant {
  url: string
  width: number
  height: number
  /** Bits per second; 0 for GIFs and photos. */
  bitrate: number
}

export interface PostMedia {
  kind: MediaKind
  /** Still picture shown before the video plays, or the photo itself at a small size. */
  preview: string
  width: number
  height: number
  /** Videos and GIFs only. */
  durationMs?: number
  /** Largest first. A photo has one, at its original size. */
  variants: MediaVariant[]
}

export interface XPost {
  id: string
  author: { name: string; handle: string }
  text: string
  /** The media came from the post this one quotes, because it has none of its own. */
  fromQuote: boolean
  media: PostMedia[]
}

const HOSTS = /^(?:www\.|mobile\.|m\.)?(?:x|twitter|fxtwitter|vxtwitter|fixupx|fixvx)\.com$/i

/**
 * The post id from a link someone pasted: x.com, twitter.com and the common
 * mirrors, with or without https://, tracking parameters or /photo/1 on the end.
 * A bare id works too. Returns null for anything else.
 */
export function parsePostId(input: string): string | null {
  const text = input.trim()
  if (/^\d{5,20}$/.test(text)) return text
  let url: URL
  try {
    url = new URL(/^[a-z]+:\/\//i.test(text) ? text : `https://${text}`)
  } catch {
    return null
  }
  if (!HOSTS.test(url.hostname)) return null
  const match = url.pathname.match(/\/(?:status|statuses)\/(\d{1,20})(?:\/|$)/)
  return match ? match[1] : null
}

/** A file name such as "twitter-nasa-1585341984679469056-2.mp4". */
export function mediaFilename(post: Pick<XPost, 'id' | 'author'>, index: number, total: number, ext: string): string {
  const handle = post.author.handle.replace(/[^\w]/g, '') || 'tweet'
  const part = total > 1 ? `-${index + 1}` : ''
  return `twitter-${handle}-${post.id}${part}.${ext}`
}

/** The extension a variant saves as. */
export function variantExtension(kind: MediaKind, url: string): string {
  if (kind !== 'photo') return 'mp4'
  const format = new URL(url).searchParams.get('format')
  return format === 'jpeg' ? 'jpg' : format || 'jpg'
}

/** "1080p", or "1920 × 1080" when the video isn't landscape. */
export function variantLabel(v: MediaVariant): string {
  if (!v.width || !v.height) return 'Original'
  return v.width >= v.height ? `${v.height}p` : `${v.width} × ${v.height}`
}
