// Fetching media into memory with progress, turning a video into a GIF, and
// sharing the result. Everything here runs on the device; the GIF
// encoder loads only when it's used.

/**
 * Downloads a file into memory, reporting progress from 0 to 1 when the size is known.
 * No Referer is sent: Twitter's video servers refuse requests that say they came
 * from another site. That's also why previews play from memory rather than
 * from a link, since a <video> element can't leave the Referer out.
 */
export async function fetchBlob(url: string, onProgress?: (fraction: number) => void, signal?: AbortSignal): Promise<Blob> {
  const response = await fetch(url, { signal, referrerPolicy: 'no-referrer' })
  if (!response.ok) throw new Error(`Twitter answered ${response.status}. The file may have been removed.`)
  const total = Number(response.headers.get('Content-Length')) || 0
  const type = response.headers.get('Content-Type') ?? ''
  if (!response.body || !total || !onProgress) return response.blob()

  const reader = response.body.getReader()
  const chunks: Uint8Array<ArrayBuffer>[] = []
  let received = 0
  for (;;) {
    // Chunks arrive one after another; there's nothing to run in parallel.
    // oxlint-disable-next-line no-await-in-loop
    const { done, value } = await reader.read()
    if (done) break
    chunks.push(value)
    received += value.length
    onProgress(Math.min(1, received / total))
  }
  return new Blob(chunks, { type })
}

/** The most that goes into one GIF: past this the file gets too big to be useful. */
export const GIF_MAX_SECONDS = 30

export interface GifSettings {
  /** Seconds from the start of the video. */
  start: number
  end: number
  fps: number
  /** Output width in pixels; never larger than the video. */
  width: number
  /** Palette size per frame, up to 256. Fewer colours make a smaller file. */
  colors: number
}

export interface GifOptions extends GifSettings {
  onProgress?: (fraction: number) => void
  signal?: AbortSignal
}

/** How many frames a GIF with these settings has. */
export function gifFrameCount({ start, end, fps }: Pick<GifSettings, 'start' | 'end' | 'fps'>): number {
  const seconds = Math.min(Math.max(0, end - start), GIF_MAX_SECONDS)
  return Math.max(1, Math.floor(seconds * fps))
}

function seek(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('The video stopped responding while making the GIF.')), 10_000)
    video.addEventListener(
      'seeked',
      () => {
        clearTimeout(timer)
        resolve()
      },
      { once: true }
    )
    video.currentTime = time
  })
}

/** Draws the chosen part of the video frame by frame and encodes it as a looping GIF. */
export async function videoToGif(video: Blob, opts: GifOptions): Promise<Blob> {
  const { start, end, fps, colors, onProgress, signal } = opts
  const { GIFEncoder, quantize, applyPalette } = await import('gifenc')
  const src = URL.createObjectURL(video)
  const el = document.createElement('video')
  el.muted = true
  el.playsInline = true
  el.preload = 'auto'
  try {
    await new Promise<void>((resolve, reject) => {
      el.addEventListener('loadeddata', () => resolve(), { once: true })
      el.addEventListener('error', () => reject(new Error('This browser can’t open the video to make a GIF.')), { once: true })
      el.src = src
    })
    const width = Math.max(1, Math.min(Math.round(opts.width), el.videoWidth))
    const height = Math.max(1, Math.round((el.videoHeight * width) / el.videoWidth))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) throw new Error('Canvas is not available in this browser.')

    const last = Math.max(0, (el.duration || end) - 0.01)
    // The settings may ask for more than the video holds; stop at its real end.
    const frames = gifFrameCount({ start, end: Math.min(end, el.duration || end), fps })
    // GIF delays are in hundredths of a second, so round to tens of milliseconds.
    const delay = Math.max(20, Math.round(100 / fps) * 10)
    const gif = GIFEncoder()
    for (let i = 0; i < frames; i++) {
      signal?.throwIfAborted()
      // Frames depend on seeking in order, so they can't run in parallel. The
      // middle of each frame's slot is used: seeking to the time the video is
      // already at may never finish.
      // oxlint-disable-next-line no-await-in-loop
      await seek(el, Math.min(start + (i + 0.5) / fps, last))
      ctx.drawImage(el, 0, 0, width, height)
      const { data } = ctx.getImageData(0, 0, width, height)
      const palette = quantize(data, colors)
      gif.writeFrame(applyPalette(data, palette), width, height, { palette, delay })
      onProgress?.((i + 1) / frames)
    }
    gif.finish()
    return new Blob([gif.bytes().slice()], { type: 'image/gif' })
  } finally {
    el.removeAttribute('src')
    el.load()
    URL.revokeObjectURL(src)
  }
}

/** Whether the device's share sheet takes this file (phones, mostly), for saving to Photos or sending on. */
export function canShareFile(file: File): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })
}
