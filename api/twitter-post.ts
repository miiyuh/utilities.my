// GET /api/twitter-post?id=<post id>
//
// Twitter only lets its own pages read a tweet's details from the browser, so
// this asks Twitter's public embed service on the browser's behalf and answers
// with the tweet's media links. Nothing is stored or logged here. The media files
// themselves are fetched by the browser straight from Twitter's servers.
//
// Self-contained on purpose: Vercel runs this file as its own function, so it
// imports only types (which disappear when compiled).
import type { MediaVariant, PostMedia, XPost } from '../src/lib/twitter-media'

const SYNDICATION = 'https://cdn.syndication.twimg.com/tweet-result'
const MEDIA_HOSTS = new Set(['video.twimg.com', 'pbs.twimg.com'])

/** The token Twitter's own embed script sends with each request. */
export function syndicationToken(id: string): string {
  return ((Number(id) / 1e15) * Math.PI).toString(36).replace(/(0+|\.)/g, '')
}

interface RawVariant {
  content_type?: string
  url?: string
  bitrate?: number
}

interface RawMedia {
  type?: string
  media_url_https?: string
  original_info?: { width?: number; height?: number }
  video_info?: { duration_millis?: number; variants?: RawVariant[] }
}

interface RawTweet {
  __typename?: string
  id_str?: string
  text?: string
  user?: { name?: string; screen_name?: string }
  mediaDetails?: RawMedia[]
  quoted_tweet?: RawTweet
}

function isMediaUrl(url: string | undefined): url is string {
  if (!url) return false
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && MEDIA_HOSTS.has(u.hostname)
  } catch {
    return false
  }
}

/** The original-size copy of a photo: ".../media/abc.jpg" becomes ".../media/abc?format=jpg&name=orig". */
export function originalPhoto(url: string): string {
  const u = new URL(url)
  const match = u.pathname.match(/^(.*)\.(jpe?g|png|webp)$/i)
  if (!match) return url
  return `${u.origin}${match[1]}?format=${match[2].toLowerCase()}&name=orig`
}

function toMedia(raw: RawMedia): PostMedia | null {
  const preview = raw.media_url_https
  if (!isMediaUrl(preview)) return null
  const width = raw.original_info?.width ?? 0
  const height = raw.original_info?.height ?? 0

  if (raw.type === 'photo') {
    return { kind: 'photo', preview, width, height, variants: [{ url: originalPhoto(preview), width, height, bitrate: 0 }] }
  }
  if (raw.type !== 'video' && raw.type !== 'animated_gif') return null

  const variants: MediaVariant[] = (raw.video_info?.variants ?? [])
    .filter((v): v is RawVariant & { url: string } => v.content_type === 'video/mp4' && isMediaUrl(v.url))
    .map((v) => {
      // Sizes are in the path, as in /vid/1280x720/; a GIF has one variant at the original size.
      const size = v.url.match(/\/(\d+)x(\d+)\//)
      return {
        url: v.url,
        width: size ? Number(size[1]) : width,
        height: size ? Number(size[2]) : height,
        bitrate: v.bitrate ?? 0,
      }
    })
    .sort((a, b) => b.width * b.height - a.width * a.height || b.bitrate - a.bitrate)
  if (!variants.length) return null

  return {
    kind: raw.type === 'animated_gif' ? 'gif' : 'video',
    preview,
    width,
    height,
    durationMs: raw.video_info?.duration_millis,
    variants,
  }
}

function mediaOf(tweet: RawTweet | undefined): PostMedia[] {
  return (tweet?.mediaDetails ?? []).map(toMedia).filter((m): m is PostMedia => m !== null)
}

/** The parts of Twitter's answer the page needs, or null when it isn't a readable tweet. */
export function toPost(raw: RawTweet): XPost | null {
  if (raw.__typename !== 'Tweet' || !raw.id_str) return null
  let media = mediaOf(raw)
  let source = raw
  let fromQuote = false
  if (!media.length && raw.quoted_tweet) {
    const quoted = mediaOf(raw.quoted_tweet)
    if (quoted.length) {
      media = quoted
      source = raw.quoted_tweet
      fromQuote = true
    }
  }
  return {
    id: source.id_str ?? raw.id_str,
    author: { name: source.user?.name ?? '', handle: source.user?.screen_name ?? '' },
    text: raw.text ?? '',
    fromQuote,
    media,
  }
}

function json(body: unknown, status: number, cache: string): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache },
  })
}

const NO_STORE = 'no-store'

export async function GET(request: Request): Promise<Response> {
  const id = new URL(request.url).searchParams.get('id') ?? ''
  if (!/^\d{1,20}$/.test(id)) return json({ error: 'That isn’t a tweet link.' }, 400, NO_STORE)

  let upstream: Response
  try {
    const url = `${SYNDICATION}?id=${id}&lang=en&token=${syndicationToken(id)}`
    upstream = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000) })
  } catch {
    return json({ error: 'Twitter didn’t answer. Try again in a moment.' }, 502, NO_STORE)
  }

  if (upstream.status === 404) {
    return json({ error: 'That tweet doesn’t exist, was deleted, or is from a private account.' }, 404, 'public, s-maxage=60')
  }
  if (!upstream.ok) {
    return json({ error: 'Twitter didn’t answer. Try again in a moment.' }, 502, NO_STORE)
  }

  const raw = (await upstream.json().catch(() => ({}))) as RawTweet
  if (raw.__typename === 'TweetTombstone') {
    return json({ error: 'Twitter only shows this tweet to signed-in people, often because it’s marked sensitive.' }, 404, 'public, s-maxage=60')
  }
  const post = toPost(raw)
  if (!post) {
    return json({ error: 'That tweet doesn’t exist, was deleted, or is from a private account.' }, 404, 'public, s-maxage=60')
  }
  // Media links stay valid for a long time, so a short shared cache spares Twitter repeat requests.
  return json(post, 200, 'public, s-maxage=300, stale-while-revalidate=600')
}
