import { afterEach, describe, expect, test } from 'bun:test'
import { mediaFilename, parsePostId, variantExtension, variantLabel } from './twitter-media'
import { GET, originalPhoto, syndicationToken, toPost } from '../../api/twitter-post'
import { frameDelay } from './media-files'

describe('parsePostId', () => {
  test.each([
    ['https://x.com/nasa/status/1585341984679469056', '1585341984679469056'],
    ['https://twitter.com/nasa/status/1585341984679469056?s=20&t=abc', '1585341984679469056'],
    ['x.com/nasa/status/1585341984679469056/photo/2', '1585341984679469056'],
    ['https://mobile.twitter.com/i/web/status/1585341984679469056', '1585341984679469056'],
    ['https://fxtwitter.com/nasa/status/1585341984679469056', '1585341984679469056'],
    ['  1585341984679469056  ', '1585341984679469056'],
  ])('%s', (input, id) => {
    expect(parsePostId(input)).toBe(id)
  })

  test.each([
    'https://x.com/nasa',
    'https://example.com/nasa/status/1585341984679469056',
    'https://x.com.evil.example/a/status/1585341984679469056',
    'hello',
    '',
  ])('rejects %s', (input) => {
    expect(parsePostId(input)).toBeNull()
  })
})

describe('naming', () => {
  const post = { id: '123456', author: { name: 'NASA', handle: 'NASA' } }
  test('one file has no number, several do', () => {
    expect(mediaFilename(post, 0, 1, 'mp4')).toBe('twitter-NASA-123456.mp4')
    expect(mediaFilename(post, 1, 3, 'jpg')).toBe('twitter-NASA-123456-2.jpg')
  })
  test('extensions', () => {
    expect(variantExtension('video', 'https://video.twimg.com/a/vid/1x1/b.mp4?tag=1')).toBe('mp4')
    expect(variantExtension('photo', 'https://pbs.twimg.com/media/abc?format=png&name=orig')).toBe('png')
    expect(variantExtension('photo', 'https://pbs.twimg.com/media/abc?format=jpeg&name=orig')).toBe('jpg')
  })
  test('labels', () => {
    expect(variantLabel({ url: '', width: 1920, height: 1080, bitrate: 1 })).toBe('1080p')
    expect(variantLabel({ url: '', width: 720, height: 1280, bitrate: 1 })).toBe('720 × 1280')
  })
})

describe('api/twitter-post', () => {
  test('token matches the one X’s embed script makes', () => {
    expect(syndicationToken('1585341984679469056')).toMatch(/^[a-z0-9]+$/)
    expect(syndicationToken('1585341984679469056')).not.toContain('0')
  })

  test('original photo', () => {
    expect(originalPhoto('https://pbs.twimg.com/media/FgAbc.jpg')).toBe('https://pbs.twimg.com/media/FgAbc?format=jpg&name=orig')
  })

  const video = {
    type: 'video',
    media_url_https: 'https://pbs.twimg.com/ext_tw_video_thumb/1/pu/img/a.jpg',
    original_info: { width: 1920, height: 1080 },
    video_info: {
      duration_millis: 9301,
      variants: [
        { content_type: 'application/x-mpegURL', url: 'https://video.twimg.com/a/pl/a.m3u8' },
        { content_type: 'video/mp4', bitrate: 256000, url: 'https://video.twimg.com/a/vid/480x270/a.mp4?tag=14' },
        { content_type: 'video/mp4', bitrate: 10368000, url: 'https://video.twimg.com/a/vid/1920x1080/b.mp4?tag=14' },
        { content_type: 'video/mp4', bitrate: 1, url: 'https://evil.example/vid/4000x4000/c.mp4' },
      ],
    },
  }

  test('keeps MP4s from X’s servers, largest first', () => {
    const post = toPost({ __typename: 'Tweet', id_str: '1', text: 'hi', user: { name: 'N', screen_name: 'n' }, mediaDetails: [video] })
    expect(post?.media).toHaveLength(1)
    expect(post?.media[0].kind).toBe('video')
    expect(post?.media[0].variants.map((v) => v.height)).toEqual([1080, 270])
  })

  test('GIFs and photos', () => {
    const post = toPost({
      __typename: 'Tweet',
      id_str: '1',
      mediaDetails: [
        { type: 'animated_gif', media_url_https: 'https://pbs.twimg.com/tweet_video_thumb/a.jpg', original_info: { width: 498, height: 280 }, video_info: { variants: [{ content_type: 'video/mp4', bitrate: 0, url: 'https://video.twimg.com/tweet_video/a.mp4' }] } },
        { type: 'photo', media_url_https: 'https://pbs.twimg.com/media/b.png', original_info: { width: 10, height: 10 } },
      ],
    })
    expect(post?.media.map((m) => m.kind)).toEqual(['gif', 'photo'])
    expect(post?.media[0].variants[0]).toMatchObject({ width: 498, height: 280 })
    expect(post?.media[1].variants[0].url).toBe('https://pbs.twimg.com/media/b?format=png&name=orig')
  })

  test('falls back to the quoted post’s media', () => {
    const post = toPost({ __typename: 'Tweet', id_str: '1', quoted_tweet: { __typename: 'Tweet', id_str: '2', user: { screen_name: 'q' }, mediaDetails: [video] } })
    expect(post).toMatchObject({ id: '2', fromQuote: true, author: { handle: 'q' } })
  })

  test('a tombstone or empty answer is not a post', () => {
    expect(toPost({ __typename: 'TweetTombstone' })).toBeNull()
    expect(toPost({})).toBeNull()
  })
})

describe('GET /api/twitter-post when Twitter misbehaves', () => {
  const realFetch = globalThis.fetch
  afterEach(() => {
    globalThis.fetch = realFetch
  })

  test('a reply that times out or isn’t JSON is an uncached 502, not a cached 404', async () => {
    globalThis.fetch = (async () => new Response('not json', { status: 200 })) as unknown as typeof fetch
    const res = await GET(new Request('http://x/api/twitter-post?id=123'))
    expect(res.status).toBe(502)
    expect(res.headers.get('Cache-Control')).toBe('no-store')
  })

  test('a missing tweet is a briefly cached 404', async () => {
    globalThis.fetch = (async () => new Response('', { status: 404 })) as unknown as typeof fetch
    const res = await GET(new Request('http://x/api/twitter-post?id=123'))
    expect(res.status).toBe(404)
  })
})

describe('frameDelay', () => {
  test.each([10, 15, 20, 25])('%i fps adds up to the real length', (fps) => {
    const frames = fps * 30
    const total = Array.from({ length: frames }, (_, i) => frameDelay(i, fps)).reduce((a, b) => a + b, 0)
    expect(total).toBe(30_000)
  })

  test('every delay is a whole number of hundredths', () => {
    for (let i = 0; i < 45; i++) expect(frameDelay(i, 15) % 10).toBe(0)
  })
})
