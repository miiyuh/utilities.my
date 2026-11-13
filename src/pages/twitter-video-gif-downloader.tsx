import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowClockwise, DownloadSimple, FileArchive, FilmStrip, GifIcon, LinkSimple, MagicWand,
  Play, ShareNetwork, ShieldCheck, SpinnerGap, X as XIcon,
} from '@phosphor-icons/react';
import { Sidebar, SidebarInset } from '@/components/ui/sidebar';
import { SidebarContent } from '@/components/sidebar-content';
import { PageHeader } from '@/components/page-header';
import { PageIntro } from '@/components/page-intro';
import { ToolMethodology } from '@/components/tool-methodology';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Hint } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { downloadBlob, humanSize } from '@/lib/image-utils';
import { canShareFile, fetchBlob, gifFrameCount, GIF_MAX_SECONDS, videoToGif, type GifSettings } from '@/lib/media-files';
import { mediaFilename, parsePostId, variantExtension, variantLabel, type MediaVariant, type PostMedia, type XPost } from '@/lib/twitter-media';
import { cn } from '@/lib/utils';
import { scrollToElement } from '@/lib/scroll-root';

type Lookup =
  | { state: 'idle' }
  | { state: 'loading'; id: string }
  | { state: 'error'; message: string }
  | { state: 'done'; post: XPost };

const KIND_LABEL = { video: 'Video', gif: 'GIF', photo: 'Photo' } as const;

const FPS_OPTIONS = [10, 15, 20, 25].map((n) => ({ value: n, label: String(n) }));

/**
 * A tall, narrow handle like the fader on a mixing desk, with a grip line
 * across it. The ::before stretches the touch area past the narrow handle.
 */
const FADER_THUMB =
  'h-6! w-3! rounded-[4px] after:absolute after:inset-x-[3px] after:top-1/2 after:h-px after:-translate-y-1/2 after:bg-black/25 before:absolute before:-inset-x-2 before:-inset-y-1.5';

/** Seconds, rounded down to the slider's 0.1 s steps, so its end sits at the end of the track. */
function toTenth(seconds: number): number {
  return Math.max(0.1, Math.floor(seconds * 10) / 10);
}
const COLOR_OPTIONS = [
  { value: 256, label: 'Best' },
  { value: 128, label: 'Good' },
  { value: 64, label: 'Smaller' },
];

function formatDuration(ms: number): string {
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** "0:04.5", to a tenth of a second, for picking part of a clip. */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

/** Rough file size from the bitrate, so people can pick a quality knowingly. */
function estimateSize(v: MediaVariant, durationMs?: number): string | null {
  if (!v.bitrate || !durationMs) return null;
  return `about ${humanSize((v.bitrate / 8) * (durationMs / 1000))}`;
}

/** The smallest copy at least as wide as the GIF will be, so less is downloaded. */
function variantForWidth(media: PostMedia, width: number): MediaVariant {
  const wide = media.variants.filter((v) => v.width >= width);
  return wide[wide.length - 1] ?? media.variants[0];
}

/** The video's length when Twitter doesn't say (it usually doesn't for GIFs), read from the file. */
function readDuration(video: Blob): Promise<number> {
  return new Promise((resolve) => {
    const src = URL.createObjectURL(video);
    const el = document.createElement('video');
    el.preload = 'metadata';
    el.muted = true;
    const done = (d: number) => {
      URL.revokeObjectURL(src);
      resolve(d);
    };
    el.addEventListener('loadedmetadata', () => done(Number.isFinite(el.duration) ? el.duration : 0), { once: true });
    el.addEventListener('error', () => done(0), { once: true });
    el.src = src;
  });
}

type GetBlob = (url: string, onProgress?: (p: number) => void, signal?: AbortSignal) => Promise<Blob>;

/**
 * Small copies kept in memory per card, so the preview and the GIF maker
 * don't download the same file twice. Full-size downloads skip it.
 */
function useBlobCache(): GetBlob {
  const cache = useRef(new Map<string, Blob>());
  return useCallback(async (url, onProgress, signal) => {
    const hit = cache.current.get(url);
    if (hit) return hit;
    const blob = await fetchBlob(url, onProgress, signal);
    cache.current.set(url, blob);
    return blob;
  }, []);
}

/**
 * The poster with a play button. Pressing it loads the smallest copy into
 * memory and plays it from there: Twitter refuses to stream to other sites.
 */
function MotionPreview({ media, index, getBlob }: { media: PostMedia; index: number; getBlob: GetBlob }) {
  const { toast } = useToast();
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState<number | null>(null);
  useEffect(() => () => {
    if (src) URL.revokeObjectURL(src);
  }, [src]);
  const isGif = media.kind === 'gif';
  const label = `${KIND_LABEL[media.kind]} ${index + 1} from the tweet`;
  const aspectRatio = media.width && media.height ? `${media.width} / ${media.height}` : undefined;

  const play = async () => {
    setLoading(0);
    try {
      const blob = await getBlob(media.variants[media.variants.length - 1].url, setLoading);
      setSrc(URL.createObjectURL(blob));
    } catch (err) {
      const message = friendlyError(err);
      if (message) toast({ title: 'Couldn’t play that', description: message, variant: 'destructive' });
    } finally {
      setLoading(null);
    }
  };

  if (src) {
    return (
      // Twitter doesn't share captions with embeds, so there's no track to add.
      // oxlint-disable-next-line jsx-a11y/media-has-caption
      <video
        src={src}
        autoPlay
        controls
        playsInline
        loop={isGif}
        muted={isGif}
        className="max-h-[min(55svh,32rem)] w-full object-contain"
        style={{ aspectRatio }}
        aria-label={label}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => void play()}
      disabled={loading !== null}
      className="group relative flex w-full items-center justify-center focus-visible:outline-none"
      aria-label={`Play ${label.toLowerCase()}`}
    >
      <img src={media.preview} alt="" className="max-h-[min(55svh,32rem)] w-full object-contain" style={{ aspectRatio }} />
      <span className="absolute inset-0 flex items-center justify-center bg-black/10 transition-colors duration-quick group-hover:bg-black/25">
        <span className="flex size-14 items-center justify-center rounded-full bg-black/60 text-white shadow-lg ring-white/70 backdrop-blur-sm group-focus-visible:ring-3">
          {loading === null ? (
            <Play className="size-6 translate-x-px" weight="fill" aria-hidden />
          ) : (
            <span className="text-xs font-medium tabular-nums">{Math.round(loading * 100)}%</span>
          )}
        </span>
      </span>
    </button>
  );
}

function friendlyError(err: unknown): string {
  if (err instanceof DOMException && err.name === 'AbortError') return '';
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'You’re offline. This tool needs the internet to reach Twitter.';
  if (err instanceof TypeError) return 'Couldn’t reach Twitter. Check your connection and try again.';
  return err instanceof Error ? err.message : 'Something went wrong. Try again.';
}

/** A short set of choices, all visible and one tap away. Radio buttons underneath, so arrow keys work. */
function Choice({ legend, options, value, onChange, disabled }: {
  legend: string;
  options: { value: number; label: string }[];
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const name = useId();
  const selected = options.findIndex((o) => o.value === value);
  const n = options.length;
  return (
    <fieldset disabled={disabled} className="min-w-0 disabled:opacity-60">
      <legend className="mb-2 text-sm font-medium text-foreground">{legend}</legend>
      <div className="relative grid auto-cols-fr grid-flow-col gap-1 rounded-xl bg-muted p-1">
        {/* One highlight that slides to the chosen option, like the tabs. The
            options share the width equally (minus the 0.25rem padding and gaps),
            and a percentage translate moves it by its own width plus one gap. */}
        {selected >= 0 && (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1 bottom-1 left-1 rounded-lg bg-background shadow-sm transition-[translate] duration-fast ease-smooth-out motion-reduce:transition-none"
            style={{ width: `calc((100% - 0.5rem - ${n - 1} * 0.25rem) / ${n})`, translate: `calc(${selected} * (100% + 0.25rem)) 0` }}
          />
        )}
        {options.map((o) => (
          // `relative` keeps the hidden radio inside its label. Without it, focusing
          // the radio scrolled the page frame to wherever the radio ended up.
          <label key={o.value} className="relative cursor-pointer">
            <input type="radio" name={name} className="peer sr-only" checked={o.value === value} onChange={() => onChange(o.value)} />
            <span className="block rounded-lg px-2 py-2 text-center sm:py-1.5 text-sm whitespace-nowrap text-muted-foreground tabular-nums transition-colors duration-quick peer-checked:text-foreground peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 hover:text-foreground">
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

function ProgressBar({ label, progress, onCancel }: { label: string; progress: number; onCancel: () => void }) {
  return (
    <output className="block space-y-2" aria-live="polite">
      <div className="flex items-center justify-between text-sm">
        <span className="inline-flex items-center gap-2 text-muted-foreground">
          <SpinnerGap className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> {label}…
        </span>
        <span className="tabular-nums text-muted-foreground">{Math.round(progress * 100)}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-[width] duration-150" style={{ width: `${progress * 100}%` }} />
      </div>
      <Button variant="ghost" size="sm" onClick={onCancel}>
        <XIcon className="h-4 w-4" aria-hidden /> Cancel
      </Button>
    </output>
  );
}

/** Abortable jobs with progress, one at a time. A new job cancels the one before it. */
function useJob() {
  const [busy, setBusy] = useState<{ label: string; progress: number } | null>(null);
  const abort = useRef<AbortController | null>(null);
  useEffect(() => () => abort.current?.abort(), []);
  const run = useCallback(async (label: string, job: (signal: AbortSignal, report: (label: string, p: number) => void) => Promise<void>) => {
    abort.current?.abort();
    const controller = new AbortController();
    abort.current = controller;
    setBusy({ label, progress: 0 });
    try {
      await job(controller.signal, (l, p) => setBusy({ label: l, progress: p }));
      return true;
    } finally {
      if (abort.current === controller) {
        abort.current = null;
        setBusy(null);
      }
    }
  }, []);
  return { busy, run, cancel: () => abort.current?.abort() };
}

interface GifResult {
  file: File;
  url: string;
  width: number;
  height: number;
  /** The settings it was made with, to tell when they've changed since. */
  key: string;
}

function GifMaker({ post, media, index, total, getBlob }: { post: XPost; media: PostMedia; index: number; total: number; getBlob: GetBlob }) {
  const { toast } = useToast();
  const { busy, run, cancel } = useJob();
  const sourceWidth = media.variants[0].width || media.width || 480;
  const widthOptions = useMemo(() => {
    const sizes = [...new Set([320, 480, 640, sourceWidth].filter((w) => w <= sourceWidth))].sort((a, b) => a - b);
    return sizes.map((w) => ({ value: w, label: w === sourceWidth ? 'Full' : `${w}` }));
  }, [sourceWidth]);

  const [duration, setDuration] = useState(media.durationMs ? toTenth(media.durationMs / 1000) : 0);
  const [settings, setSettings] = useState<GifSettings>(() => {
    const d = media.durationMs ? toTenth(media.durationMs / 1000) : GIF_MAX_SECONDS;
    return { start: 0, end: Math.min(d, GIF_MAX_SECONDS), fps: 15, width: Math.min(480, sourceWidth), colors: 256 };
  });
  const set = (patch: Partial<GifSettings>) => setSettings((s) => ({ ...s, ...patch }));

  // Twitter rarely gives a GIF's length, so read it from the file before showing the range.
  useEffect(() => {
    if (duration) return;
    let live = true;
    getBlob(media.variants[media.variants.length - 1].url)
      .then(readDuration)
      .then((seconds) => {
        if (!live || !seconds) return;
        const d = toTenth(seconds);
        setDuration(d);
        setSettings((s) => ({ ...s, end: Math.min(d, GIF_MAX_SECONDS) }));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [duration, media, getBlob]);

  const [result, setResult] = useState<GifResult | null>(null);
  useEffect(() => () => {
    if (result) URL.revokeObjectURL(result.url);
  }, [result]);

  const key = JSON.stringify(settings);
  const stale = result !== null && result.key !== key;
  const frames = gifFrameCount(settings);
  const span = settings.end - settings.start;
  const outWidth = Math.min(settings.width, sourceWidth);
  const outHeight = Math.round((outWidth * (media.height || sourceWidth)) / (media.width || sourceWidth));

  const onRange = (value: number | readonly number[]) => {
    if (!Array.isArray(value)) return;
    let [start, end] = value as [number, number];
    // Keep at most GIF_MAX_SECONDS between the ends, moving whichever end wasn't dragged.
    if (end - start > GIF_MAX_SECONDS) {
      if (start !== settings.start) end = start + GIF_MAX_SECONDS;
      else start = end - GIF_MAX_SECONDS;
    }
    set({ start, end: Math.max(end, start + 0.1) });
  };

  const make = async () => {
    try {
      await run('Making GIF', async (signal, report) => {
        const variant = variantForWidth(media, settings.width);
        // Kept in memory, so changing a setting doesn't download the video again.
        const fetchShare = 0.3;
        const video = await getBlob(variant.url, (p) => report('Downloading the video', p * fetchShare), signal);
        const gif = await videoToGif(video, { ...settings, signal, onProgress: (p) => report('Making GIF', fetchShare + p * (1 - fetchShare)) });
        const file = new File([gif], mediaFilename(post, index, total, 'gif'), { type: 'image/gif' });
        setResult({ file, url: URL.createObjectURL(file), width: outWidth, height: outHeight, key });
      });
    } catch (err) {
      const message = friendlyError(err);
      if (message) toast({ title: 'Couldn’t make the GIF', description: message, variant: 'destructive' });
    }
  };

  const share = async () => {
    if (!result) return;
    try {
      await navigator.share({ files: [result.file] });
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        toast({ title: 'Couldn’t share the GIF', description: 'Download it instead.', variant: 'destructive' });
      }
    }
  };

  const disabled = !!busy;
  return (
    // A container, so the settings sit side by side whenever the panel is wide
    // enough, whatever the screen: the card's column, not the window, decides.
    <section aria-labelledby={`gif-title-${index}`} className="@container space-y-4 rounded-xl border bg-background/60 p-3 sm:p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 id={`gif-title-${index}`} className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <GifIcon className="h-4 w-4" aria-hidden /> Make a GIF
        </h3>
        {media.kind === 'gif' && <p className="text-xs text-muted-foreground">The MP4 is smaller and sharper; a .gif works everywhere.</p>}
      </div>

      {duration > 0.3 && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <Label id={`gif-range-${index}`}>Part of the clip</Label>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatTime(settings.start)} to {formatTime(settings.end)} · {span.toFixed(1)} s
            </span>
          </div>
          <div className="px-1.5">
            <Slider
              value={[settings.start, settings.end]}
              min={0}
              max={duration}
              step={0.1}
              minStepsBetweenValues={1}
              onValueChange={onRange}
              disabled={disabled}
              aria-labelledby={`gif-range-${index}`}
              className="py-2.5"
              thumbClassName={FADER_THUMB}
            />
          </div>
          {duration > GIF_MAX_SECONDS && (
            <p className="text-xs text-muted-foreground">A GIF can be up to {GIF_MAX_SECONDS} seconds long.</p>
          )}
        </div>
      )}

      <div className="grid gap-x-4 gap-y-3 @md:grid-cols-2">
        <Choice legend="Frame rate (fps)" options={FPS_OPTIONS} value={settings.fps} onChange={(fps) => set({ fps })} disabled={disabled} />
        <Choice legend="Colours" options={COLOR_OPTIONS} value={settings.colors} onChange={(colors) => set({ colors })} disabled={disabled} />
        {widthOptions.length > 1 && (
          <div className="@md:col-span-2">
            <Choice legend="Width (px)" options={widthOptions} value={settings.width} onChange={(width) => set({ width })} disabled={disabled} />
          </div>
        )}
      </div>

      {busy ? (
        <ProgressBar label={busy.label} progress={busy.progress} onCancel={cancel} />
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground tabular-nums">
            {duration ? `${outWidth} × ${outHeight} · ${frames} frames` : 'Reading the clip’s length…'}
          </p>
          {/* Until the length is known (Twitter rarely gives it for GIFs), the range is a guess. */}
          <Button onClick={() => void make()} disabled={!duration} variant={result && !stale ? 'outline' : 'default'} className="max-sm:h-10 max-sm:w-full">
            {result ? <ArrowClockwise className="h-4 w-4" aria-hidden /> : <MagicWand className="h-4 w-4" aria-hidden />}
            {result ? 'Make GIF again' : 'Make GIF'}
          </Button>
        </div>
      )}

      {result && (
        // The finished GIF beside its buttons, so it doesn't push the page down.
        <div className="flex flex-col gap-3 border-t pt-4 @sm:flex-row @sm:items-center">
          <div className="flex shrink-0 justify-center rounded-lg bg-muted p-1.5">
            <img
              src={result.url}
              alt={`GIF made from ${KIND_LABEL[media.kind].toLowerCase()} ${index + 1}`}
              className={cn('max-h-48 w-auto max-w-full rounded-md @sm:max-h-28 @sm:max-w-40', stale && 'opacity-60')}
            />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm text-muted-foreground tabular-nums">
              {humanSize(result.file.size)} · {result.width} × {result.height}
            </p>
            {stale && <p className="text-xs text-foreground">Settings changed. Make it again to see them.</p>}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => downloadBlob(result.file, result.file.name)} className="max-sm:h-10 max-sm:flex-1">
                <DownloadSimple className="h-4 w-4" aria-hidden /> Download GIF
              </Button>
              {canShareFile(result.file) && (
                <Button variant="outline" onClick={() => void share()} className="max-sm:h-10 max-sm:flex-1">
                  <ShareNetwork className="h-4 w-4" aria-hidden /> Share
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function MediaCard({ post, media, index, total }: { post: XPost; media: PostMedia; index: number; total: number }) {
  const { toast } = useToast();
  const { busy, run, cancel } = useJob();
  const [quality, setQuality] = useState(media.variants[0].url);
  const getBlob = useBlobCache();

  const variant = media.variants.find((v) => v.url === quality) ?? media.variants[0];
  const isMotion = media.kind !== 'photo';
  const aspectRatio = media.width && media.height ? `${media.width} / ${media.height}` : undefined;

  const save = async () => {
    try {
      await run('Downloading', async (signal, report) => {
        const blob = await fetchBlob(variant.url, (p) => report('Downloading', p), signal);
        downloadBlob(blob, mediaFilename(post, index, total, variantExtension(media.kind, variant.url)));
      });
    } catch (err) {
      const message = friendlyError(err);
      if (message) toast({ title: 'Couldn’t save that', description: message, variant: 'destructive' });
    }
  };

  const qualityItems = media.variants.map((v) => {
    const size = estimateSize(v, media.durationMs);
    return { value: v.url, label: size ? `${variantLabel(v)} (${size})` : variantLabel(v) };
  });

  return (
    // Preview on the left and everything you can do with it on the right, so a
    // whole item fits on screen; stacked on phones. overflow-visible lets the
    // preview stay in view (sticky) while the settings beside it scroll.
    <Card className="w-full overflow-visible py-0 shadow-sm">
      <div className="grid gap-4 p-3 sm:p-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:gap-6 lg:p-5">
        <div className="flex items-center justify-center overflow-hidden rounded-lg bg-muted lg:sticky lg:top-4 lg:self-start">
          {media.kind === 'photo' ? (
            <img
              src={`${media.preview}?name=medium`}
              alt={total > 1 ? `${index + 1} of ${total} from the tweet` : 'From the tweet'}
              className="max-h-[min(55svh,32rem)] w-auto max-w-full object-contain"
              style={{ aspectRatio }}
            />
          ) : (
            <MotionPreview media={media} index={index} getBlob={getBlob} />
          )}
        </div>

        <div className="min-w-0 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 text-sm">
              <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                {KIND_LABEL[media.kind]}
                {total > 1 && <span className="text-muted-foreground">{index + 1} of {total}</span>}
              </span>
              {media.width > 0 && <span className="text-muted-foreground tabular-nums">{media.width} × {media.height}</span>}
              {media.durationMs != null && media.kind === 'video' && (
                <span className="text-muted-foreground tabular-nums">{formatDuration(media.durationMs)}</span>
              )}
            </div>
            <Hint label="Copy link">
              <CopyButton
                value={variant.url}
                label=""
                size="icon"
                variant="ghost"
                className="shrink-0 max-sm:size-10"
                aria-label="Copy link"
                icon={<LinkSimple className="h-4 w-4" aria-hidden />}
                toastTitle="Link copied"
                toastDescription={`The ${KIND_LABEL[media.kind].toLowerCase()}’s direct link is on the clipboard.`}
              />
            </Hint>
          </div>

          {busy ? (
            <ProgressBar label={busy.label} progress={busy.progress} onCancel={cancel} />
          ) : (
            <div className="flex flex-col gap-2 sm:flex-row">
              {media.kind === 'video' && media.variants.length > 1 && (
                <Select items={qualityItems} value={quality} onValueChange={setQuality}>
                  <SelectTrigger aria-label="Quality" className="w-full max-sm:h-10 sm:flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {qualityItems.map((q) => (
                      <SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button onClick={() => void save()} className="max-sm:h-10 sm:shrink-0">
                <DownloadSimple className="h-4 w-4" aria-hidden />
                {media.kind === 'photo' ? 'Download photo' : 'Download MP4'}
              </Button>
            </div>
          )}

          {isMotion && <GifMaker post={post} media={media} index={index} total={total} getBlob={getBlob} />}
        </div>
      </div>
    </Card>
  );
}

export default function TwitterVideoGifDownloaderPage() {
  const { toast } = useToast();
  const [link, setLink] = useState('');
  const [lookup, setLookup] = useState<Lookup>({ state: 'idle' });
  const [zipping, setZipping] = useState(false);
  const request = useRef<AbortController | null>(null);
  /** The tweet last looked up, so the same link isn't looked up twice as you type. */
  const lastId = useRef<string | null>(null);

  const find = useCallback(async (input: string) => {
    const id = parsePostId(input);
    if (!id) {
      setLookup({ state: 'error', message: 'That doesn’t look like a tweet link. It should look like twitter.com/name/status/123… or x.com/name/status/123…' });
      return;
    }
    lastId.current = id;
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setLookup({ state: 'loading', id });
    try {
      // No referrer: only the tweet's number goes to the server, not this page's address.
      const response = await fetch(`/api/twitter-post?id=${id}`, { signal: controller.signal, referrerPolicy: 'no-referrer' });
      const body: unknown = await response.json().catch(() => null);
      const error = body && typeof body === 'object' && 'error' in body ? String(body.error) : null;
      if (!response.ok || !body || error) throw new Error(error ?? 'Twitter didn’t answer. Try again in a moment.');
      const post = body as XPost;
      if (!post.media?.length) throw new Error('That tweet has no videos, GIFs or photos.');
      setLookup({ state: 'done', post });
    } catch (err) {
      const message = friendlyError(err);
      if (message) setLookup({ state: 'error', message });
    }
  }, []);

  // Deliberately no ?url= link handoff: the full link, tracking parameters and
  // all, would reach the server and analytics with the page request, when only
  // the tweet's number is meant to leave the device.
  useEffect(() => () => request.current?.abort(), []);

  // There's no button: a pasted link is looked up at once (onPaste below), and
  // a typed one once typing pauses, since a half-typed id is also a valid one.
  useEffect(() => {
    const id = parsePostId(link);
    if (!id || id === lastId.current) return;
    const timer = setTimeout(() => void find(link), 600);
    return () => clearTimeout(timer);
  }, [link, find]);

  // Enter looks it up again, which also retries after an error.
  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void find(link);
  };

  const downloadAll = async (post: XPost) => {
    setZipping(true);
    try {
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      const files = await Promise.all(post.media.map((m) => fetchBlob(m.variants[0].url)));
      files.forEach((blob, i) => {
        const m = post.media[i];
        zip.file(mediaFilename(post, i, post.media.length, variantExtension(m.kind, m.variants[0].url)), blob);
      });
      downloadBlob(await zip.generateAsync({ type: 'blob' }), `twitter-${post.author.handle || 'tweet'}-${post.id}.zip`);
    } catch (err) {
      const message = friendlyError(err);
      if (message) toast({ title: 'Couldn’t save the files', description: message, variant: 'destructive' });
    } finally {
      setZipping(false);
    }
  };

  const loading = lookup.state === 'loading';
  const post = lookup.state === 'done' ? lookup.post : null;

  // Bring a found tweet into view, so its media is on screen without scrolling to it.
  const resultsRef = useRef<HTMLElement>(null);
  const postId = post?.id;
  useEffect(() => {
    // 16px of room: less than the 32px gap above the results, so the link box scrolls fully out of view.
    if (postId && resultsRef.current) scrollToElement(resultsRef.current, undefined, 16);
  }, [postId]);

  return (
    <>
      <Sidebar collapsible="icon" variant="inset" side="left">
        <SidebarContent />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={FilmStrip} title="Twitter Video/GIF Downloader" />
        <div className="flex flex-col p-4 lg:p-8">
          <div className="mx-auto w-full max-w-7xl space-y-8">
            <PageIntro title="Twitter Video/GIF Downloader">Paste a tweet link and save its videos, GIFs and photos at the best quality there is. Turn a GIF or clip into a real .gif, with the frame rate, size and length you want.</PageIntro>

            <Card className="w-full shadow-sm">
              <CardContent className="space-y-3">
                <form onSubmit={onSubmit} className="space-y-2">
                  <Label htmlFor="post-link">Tweet link</Label>
                  <div className="relative">
                    <Input
                      id="post-link"
                      type="url"
                      inputMode="url"
                      autoComplete="off"
                      spellCheck={false}
                      placeholder="https://twitter.com/name/status/1234567890"
                      value={link}
                      onChange={(e) => setLink(e.target.value)}
                      onPaste={(e) => {
                        const pasted = e.clipboardData.getData('text').trim();
                        if (parsePostId(pasted)) {
                          e.preventDefault();
                          setLink(pasted);
                          void find(pasted);
                        }
                      }}
                      enterKeyHint="search"
                      className="h-11 pr-10 text-base sm:text-sm"
                      aria-invalid={lookup.state === 'error' || undefined}
                      aria-describedby="post-link-note"
                    />
                    {loading && (
                      <SpinnerGap className="pointer-events-none absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground motion-reduce:animate-none" aria-hidden />
                    )}
                  </div>
                </form>
                {lookup.state === 'error' && (
                  <p className="text-sm text-destructive" role="alert">{lookup.message}</p>
                )}
                <p id="post-link-note" className="flex items-start gap-2 text-xs text-muted-foreground">
                  <ShieldCheck className="mt-px h-4 w-4 shrink-0" aria-hidden />
                  <span>
                    Paste a link from twitter.com or x.com and it opens straight away. Works with public tweets. To read the tweet, this tool asks Twitter through our server, which keeps nothing.
                    Files then come straight from Twitter to your device, and GIFs are made on it. <Link to="/privacy" className="underline underline-offset-2 hover:text-foreground">Privacy</Link>
                  </span>
                </p>
              </CardContent>
            </Card>

            {loading && (
              <output className="flex items-center gap-2 text-sm text-muted-foreground">
                <SpinnerGap className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> Looking up the tweet…
              </output>
            )}

            {post && (
              <section ref={resultsRef} aria-label="Media in the tweet" className="scroll-mt-4 space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {post.author.name} <span className="font-normal text-muted-foreground">@{post.author.handle}</span>
                    </p>
                    {post.fromQuote && <p className="text-xs text-muted-foreground">From the tweet it quotes.</p>}
                    {post.text && <p className="line-clamp-3 max-w-3xl text-sm text-pretty break-words text-muted-foreground">{post.text}</p>}
                  </div>
                  {post.media.length > 1 && (
                    <Button variant="outline" onClick={() => void downloadAll(post)} disabled={zipping} className="max-sm:h-10 max-sm:w-full">
                      {zipping ? <SpinnerGap className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden /> : <FileArchive className="h-4 w-4" aria-hidden />}
                      Download all (.zip)
                    </Button>
                  )}
                </div>
                <div className="space-y-6">
                  {post.media.map((m, i) => (
                    <MediaCard key={m.variants[0].url} post={post} media={m} index={i} total={post.media.length} />
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
        <ToolMethodology />
      </SidebarInset>
    </>
  );
}
