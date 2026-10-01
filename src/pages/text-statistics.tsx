import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { ChartBar, UploadSimple } from 'phosphor-react';
import { Sidebar, SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { SidebarContent } from '@/components/sidebar-content';
import { PageHeader } from '@/components/page-header';
import { PageIntro } from '@/components/page-intro';
import { ToolMethodology } from '@/components/tool-methodology';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ClearButton } from '@/components/ui/clear-button';
import { CopyButton } from '@/components/ui/copy-button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToolSettings } from '@/hooks/use-tool-settings';
import { LIMITS, computeStats, easeLabel, formatDuration, type StatsOptions } from '@/lib/text-stats';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'textstats.input';

function loadDraft(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export default function TextStatisticsPage() {
  const { formatNumber } = useToolSettings();
  const n = (v: number) => formatNumber(v, 1);
  const [text, setText] = useState(loadDraft);
  const [opts, setOpts] = useState<StatsOptions>({ countNumbers: true, ignoreCommonWords: true });
  const [selection, setSelection] = useState<[number, number]>([0, 0]);
  const fileRef = useRef<HTMLInputElement>(null);
  const deferred = useDeferredValue(text);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, text);
    } catch {
      // Storage unavailable (private window): the draft just isn't kept.
    }
  }, [text]);

  const stats = useMemo(() => computeStats(deferred, opts), [deferred, opts]);
  const selected = selection[1] > selection[0] ? text.slice(selection[0], selection[1]) : '';
  const selStats = useMemo(() => (selected.trim() ? computeStats(selected, opts) : null), [selected, opts]);

  const trackSelection = (el: HTMLTextAreaElement) => setSelection([el.selectionStart ?? 0, el.selectionEnd ?? 0]);
  const importFile = async (file: File) => {
    setText((await file.text()).replace(/\r\n?/g, '\n'));
    setSelection([0, 0]);
  };

  const summary = () =>
    [
      `Words: ${n(stats.words)}`,
      `Characters: ${n(stats.characters)} (${n(stats.charactersNoSpaces)} without spaces)`,
      `Sentences: ${n(stats.sentences)}`,
      `Paragraphs: ${n(stats.paragraphs)}`,
      `Reading time: ${formatDuration(stats.readingSeconds)}`,
      `Speaking time: ${formatDuration(stats.speakingSeconds)}`,
    ].join('\n');

  const headline = [
    { label: 'Words', value: n(stats.words) },
    { label: 'Characters', value: n(stats.characters) },
    { label: 'Reading time', value: formatDuration(stats.readingSeconds) },
    { label: 'Speaking time', value: formatDuration(stats.speakingSeconds) },
  ];

  const details = [
    { label: 'Characters without spaces', value: n(stats.charactersNoSpaces) },
    { label: 'Sentences', value: n(stats.sentences) },
    { label: 'Paragraphs', value: n(stats.paragraphs) },
    { label: 'Lines', value: n(stats.lines) },
    { label: 'Different words', value: n(stats.uniqueWords) },
    { label: 'Average word length', value: `${n(stats.avgWordLength)} letters` },
    { label: 'Longest word', value: stats.longestWord || 'None yet' },
  ];

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={ChartBar} title="Text Statistics" />
        <div className="flex flex-col p-4 lg:p-8">
          <div className="mx-auto w-full max-w-7xl space-y-8">
            <PageIntro title="Text Statistics">Count words, characters and reading time as you type, and check your text fits the length a post or page allows.</PageIntro>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:items-start">
              <Card className="minimal-card lg:sticky lg:top-20">
                <CardHeader className="pb-3">
                  <CardTitle className="font-headline text-lg">Your text</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".txt,.md,text/plain,text/markdown"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.currentTarget.files?.[0];
                        if (f) void importFile(f);
                        e.currentTarget.value = '';
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                      <UploadSimple className="h-4 w-4" /> Open a text file
                    </Button>
                    <CopyButton value={summary} label="Copy summary" size="sm" toastTitle="Copied" toastDescription="The summary is on your clipboard." disabled={!text.trim()} />
                    <ClearButton
                      onClear={() => {
                        setText('');
                        setSelection([0, 0]);
                      }}
                      hasContent={Boolean(text.trim())}
                      className="ml-auto"
                      confirmTitle="Clear your text?"
                      confirmDescription="This removes the text you entered. It can't be undone."
                      confirmLabel="Clear text"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="stats-input" className="sr-only">Text to analyse</Label>
                    <Textarea
                      id="stats-input"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      onSelect={(e) => trackSelection(e.currentTarget)}
                      placeholder="Paste or type your text here…"
                      className="min-h-[320px] resize-y text-base sm:text-sm"
                    />
                    <p className="min-h-4 text-xs text-muted-foreground tabular-nums" aria-live="polite">
                      {selStats ? `Selection: ${n(selStats.words)} ${selStats.words === 1 ? 'word' : 'words'} · ${n(selStats.characters)} characters` : 'Select part of the text to count just that part.'}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Switch id="stats-numbers" checked={opts.countNumbers} onCheckedChange={(v) => setOpts((p) => ({ ...p, countNumbers: v }))} className="mt-0.5" />
                      <Label htmlFor="stats-numbers" className="cursor-pointer font-normal">Count numbers as words</Label>
                    </div>
                    <div className="flex items-start gap-3">
                      <Switch id="stats-common" checked={opts.ignoreCommonWords} onCheckedChange={(v) => setOpts((p) => ({ ...p, ignoreCommonWords: v }))} className="mt-0.5" aria-describedby="stats-common-hint" />
                      <div>
                        <Label htmlFor="stats-common" className="cursor-pointer font-normal">Leave everyday words out of top words</Label>
                        <p id="stats-common-hint" className="text-xs text-muted-foreground">Skips words like “the”, “and”, “yang” and “dan”. The word count is unaffected.</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="minimal-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-headline text-lg">At a glance</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-5">
                    <dl className="grid grid-cols-2 gap-3">
                      {headline.map((s) => (
                        <div key={s.label} className="rounded-md bg-muted p-3">
                          <dt className="text-xs text-muted-foreground">{s.label}</dt>
                          <dd className="font-headline text-2xl font-semibold tabular-nums">{s.value}</dd>
                        </div>
                      ))}
                    </dl>
                    <dl className="divide-y divide-border text-sm">
                      {details.map((d) => (
                        <div key={d.label} className="flex items-baseline justify-between gap-4 py-2">
                          <dt className="text-muted-foreground">{d.label}</dt>
                          <dd className="min-w-0 break-all text-right font-medium tabular-nums">{d.value}</dd>
                        </div>
                      ))}
                    </dl>
                    <p className="text-xs text-muted-foreground">Times assume reading at about 200 words a minute and speaking at about 130.</p>
                  </CardContent>
                </Card>

                <Card className="minimal-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-headline text-lg">Will it fit?</CardTitle>
                    <p className="text-sm text-muted-foreground">Your {n(stats.characters)} characters against common limits.</p>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {LIMITS.map((l) => {
                        const over = stats.characters - l.max;
                        const pct = Math.min(100, (stats.characters / l.max) * 100);
                        return (
                          <li key={l.id} className="space-y-1">
                            <div className="flex items-baseline justify-between gap-3 text-sm">
                              <span>{l.label}</span>
                              <span className={cn('tabular-nums', over > 0 ? 'font-medium text-warning' : 'text-muted-foreground')}>
                                {over > 0 ? `${n(over)} over` : `${n(-over)} left`} <span className="text-muted-foreground">/ {n(l.max)}</span>
                              </span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                              <div className={cn('h-full rounded-full', over > 0 ? 'bg-warning' : 'bg-primary')} style={{ width: `${pct}%` }} />
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                    <p className="mt-4 text-xs text-muted-foreground">Counted as plain characters. Some platforms count links and emoji differently, and they change their limits from time to time.</p>
                  </CardContent>
                </Card>

                <Card className="minimal-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-headline text-lg">Top words</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats.topWords.length ? (
                      <ol className="space-y-1.5 text-sm">
                        {stats.topWords.slice(0, 10).map((w, i) => (
                          <li key={w.word} className="flex items-center gap-3">
                            <span className="w-5 text-right text-xs text-muted-foreground tabular-nums">{i + 1}</span>
                            <span className="min-w-0 flex-1 break-all font-medium">{w.word}</span>
                            <span className="relative h-1.5 w-24 overflow-hidden rounded-full bg-muted" aria-hidden>
                              <span className="absolute inset-y-0 left-0 rounded-full bg-primary" style={{ width: `${(w.count / stats.topWords[0].count) * 100}%` }} />
                            </span>
                            <span className="w-10 text-right tabular-nums text-muted-foreground">{n(w.count)}</span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <p className="text-sm text-muted-foreground">The words you use most will show here.</p>
                    )}
                  </CardContent>
                </Card>

                <Card className="minimal-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-headline text-lg">Readability</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    {stats.readingEase == null ? (
                      <p className="text-muted-foreground">Write at least 30 words to get a readability score.</p>
                    ) : (
                      <p>
                        <span className="font-headline text-2xl font-semibold tabular-nums">{stats.readingEase}</span>{' '}
                        <span className="font-medium">{easeLabel(stats.readingEase)}</span>
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Flesch reading ease, from 0 (very hard) to 100 (very easy). It's built for English, so treat it as a rough guide for other languages.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
        <ToolMethodology />
      </SidebarInset>
    </>
  );
}
