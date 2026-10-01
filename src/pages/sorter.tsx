import { useMemo, useRef, useState } from 'react';
import {
  ArrowCounterClockwise,
  ArrowsDownUp,
  Eraser,
  Copy as CopyIcon,
  DownloadSimple,
  ListNumbers,
  Rows,
  Shuffle,
  SortAscending,
  TextAlignLeft,
  UploadSimple,
} from 'phosphor-react';
import { Sidebar, SidebarInset, SidebarRail } from '@/components/ui/sidebar';
import { SidebarContent } from '@/components/sidebar-content';
import { PageHeader } from '@/components/page-header';
import { PageIntro } from '@/components/page-intro';
import { ToolMethodology } from '@/components/tool-methodology';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip } from '@/components/ui/chip';
import { ClearButton } from '@/components/ui/clear-button';
import { CopyButton } from '@/components/ui/copy-button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NumberInput } from '@/components/ui/number-input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { downloadBlob, isIOSOrSafari } from '@/lib/image-utils';
import {
  joinItems,
  listStats,
  numberLines,
  removeDuplicates,
  removeEmpty,
  reverseLines,
  sortLines,
  splitItems,
  splitLines,
  trimLines,
  type Result,
  type SortBy,
} from '@/lib/list-tools';
import { shuffleInPlace } from '@/lib/random';

const SORT_BY: { id: SortBy; label: string }[] = [
  { id: 'text', label: 'Text' },
  { id: 'number', label: 'Number' },
  { id: 'length', label: 'Length' },
  { id: 'column', label: 'Column' },
];

const SEPARATORS: { id: string; label: string }[] = [
  { id: ',', label: 'Comma' },
  { id: ';', label: 'Semicolon' },
  { id: '\t', label: 'Tab' },
  { id: ' ', label: 'Space' },
];

const ORDER_LABELS: Record<SortBy, [string, string]> = {
  text: ['A to Z', 'Z to A'],
  number: ['Smallest first', 'Largest first'],
  length: ['Shortest first', 'Longest first'],
  column: ['Ascending', 'Descending'],
};

export default function SorterPage() {
  const [text, setText] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [by, setBy] = useState<SortBy>('text');
  const [descending, setDescending] = useState(false);
  const [natural, setNatural] = useState(true);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [column, setColumn] = useState('1');
  const [delimiter, setDelimiter] = useState('');
  const [separator, setSeparator] = useState(',');
  const fileRef = useRef<HTMLInputElement>(null);
  // True while the person is typing; the first keystroke after an action saves an undo step,
  // so Undo brings back their edits' starting point instead of discarding them.
  const [typing, setTyping] = useState(false);

  const lines = useMemo(() => splitLines(text), [text]);
  const stats = useMemo(() => listStats(lines, caseSensitive), [lines, caseSensitive]);
  const hasText = text.trim() !== '';

  /** Applies an action to the list, keeping the previous version for Undo. */
  const apply = (fn: (lines: string[]) => Result) => {
    if (!hasText) return;
    const r = fn(lines);
    const next = r.lines.join('\n');
    if (next !== text) setHistory((h) => [...h.slice(-49), text]);
    setTyping(false);
    setText(next);
    setMessage(r.message);
  };

  /** Typing: the first keystroke after an action or Undo saves an undo step. */
  const edit = (next: string) => {
    if (!typing && text !== '') setHistory((h) => [...h.slice(-49), text]);
    setTyping(true);
    setText(next);
  };

  const undo = () => {
    if (!history.length) return;
    setTyping(false);
    setText(history[history.length - 1]);
    setHistory((h) => h.slice(0, -1));
    setMessage('Undid the last change.');
  };

  const sort = () =>
    apply((l) => sortLines(l, { by, descending, natural, caseSensitive, column: Math.max(1, Number(column) || 1), delimiter }));

  const shuffle = () =>
    apply((l) => ({ lines: shuffleInPlace([...l]), message: `Shuffled ${l.length.toLocaleString()} ${l.length === 1 ? 'line' : 'lines'}.` }));

  const importFile = async (file: File) => {
    const t = (await file.text()).replace(/\r\n?/g, '\n');
    setHistory((h) => (text ? [...h.slice(-49), text] : h));
    setTyping(false);
    setText(t);
    setMessage(`Opened ${file.name}.`);
  };

  const download = () => downloadBlob(new Blob([text], { type: 'text/plain;charset=utf-8' }), 'list.txt', isIOSOrSafari());

  const tidyActions: { label: string; icon: typeof Eraser; run: () => void }[] = [
    { label: 'Remove duplicates', icon: CopyIcon, run: () => apply((l) => removeDuplicates(l, caseSensitive)) },
    { label: 'Remove empty lines', icon: Rows, run: () => apply(removeEmpty) },
    { label: 'Tidy spaces', icon: Eraser, run: () => apply(trimLines) },
    { label: 'Reverse order', icon: ArrowsDownUp, run: () => apply(reverseLines) },
    { label: 'Shuffle', icon: Shuffle, run: shuffle },
    { label: 'Number lines', icon: ListNumbers, run: () => apply(numberLines) },
  ];

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={SortAscending} title="Sorter" />
        <div className="flex flex-col p-4 lg:p-8">
          <div className="mx-auto w-full max-w-7xl space-y-8">
            <PageIntro title="Sorter">Paste a list, one item per line, and sort it, tidy it or turn it into a comma-separated line. Every change can be undone.</PageIntro>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:items-start">
              <Card className="minimal-card">
                <CardHeader className="pb-3">
                  <CardTitle className="font-headline text-lg">Your list</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".txt,.csv,text/plain,text/csv"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.currentTarget.files?.[0];
                        if (f) void importFile(f);
                        e.currentTarget.value = '';
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                      <UploadSimple className="h-4 w-4" /> Open a file
                    </Button>
                    <Button variant="outline" size="sm" onClick={undo} disabled={!history.length}>
                      <ArrowCounterClockwise className="h-4 w-4" /> Undo
                    </Button>
                    <ClearButton
                      onClear={() => {
                        setHistory((h) => [...h.slice(-49), text]);
                        setText('');
                        setMessage('Cleared the list. Undo brings it back.');
                      }}
                      hasContent={hasText}
                      className="ml-auto"
                      confirmTitle="Clear your list?"
                      confirmDescription="This empties the list. You can bring it back with Undo."
                      confirmLabel="Clear list"
                    />
                  </div>
                  <Label htmlFor="sorter-input" className="sr-only">Your list, one item per line</Label>
                  <Textarea
                    id="sorter-input"
                    value={text}
                    onChange={(e) => edit(e.target.value)}
                    placeholder={'One item per line, e.g.\nKuala Lumpur\nPenang\nJohor Bahru'}
                    spellCheck={false}
                    className="min-h-[360px] resize-y font-code text-base sm:text-sm"
                  />
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-xs text-muted-foreground tabular-nums">
                    <span>
                      {stats.items.toLocaleString()} {stats.items === 1 ? 'item' : 'items'} · {stats.unique.toLocaleString()} different
                      {stats.duplicates > 0 && <span className="text-warning"> · {stats.duplicates.toLocaleString()} {stats.duplicates === 1 ? 'duplicate' : 'duplicates'}</span>}
                    </span>
                    <div className="flex gap-2">
                      <CopyButton value={() => text} size="sm" disabled={!hasText} toastTitle="Copied" toastDescription="Your list is on the clipboard." />
                      <Button variant="outline" size="sm" onClick={download} disabled={!hasText}>
                        <DownloadSimple className="h-4 w-4" /> Download .txt
                      </Button>
                    </div>
                  </div>
                  <output className="block min-h-5 text-sm text-success" aria-live="polite">{message}</output>
                </CardContent>
              </Card>

              <div className="space-y-6 lg:sticky lg:top-20">
                <Card className="minimal-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-headline text-lg">Sort</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <fieldset>
                      <legend className="mb-2 text-sm font-medium">Sort by</legend>
                      <div className="flex flex-wrap gap-1.5">
                        {SORT_BY.map((s) => (
                          <Chip key={s.id} active={by === s.id} onClick={() => setBy(s.id)}>{s.label}</Chip>
                        ))}
                      </div>
                    </fieldset>
                    <fieldset>
                      <legend className="mb-2 text-sm font-medium">Order</legend>
                      <div className="flex flex-wrap gap-1.5">
                        <Chip active={!descending} onClick={() => setDescending(false)}>{ORDER_LABELS[by][0]}</Chip>
                        <Chip active={descending} onClick={() => setDescending(true)}>{ORDER_LABELS[by][1]}</Chip>
                      </div>
                    </fieldset>
                    {by === 'column' && (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="sorter-column">Column</Label>
                          <NumberInput id="sorter-column" value={column} onValueChange={setColumn} />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="sorter-delimiter">Separated by</Label>
                          <Input id="sorter-delimiter" value={delimiter} onChange={(e) => setDelimiter(e.target.value)} placeholder="Detect" maxLength={3} />
                        </div>
                      </div>
                    )}
                    {by === 'number' && <p className="text-xs text-muted-foreground">Uses the first number on each line, so “RM 1,250” counts as 1250. Lines without a number go last.</p>}
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <Switch id="sorter-natural" checked={natural} onCheckedChange={setNatural} />
                        <Label htmlFor="sorter-natural" className="cursor-pointer font-normal">Numbers in order (“item 2” before “item 10”)</Label>
                      </div>
                      <div className="flex items-center gap-3">
                        <Switch id="sorter-case" checked={caseSensitive} onCheckedChange={setCaseSensitive} />
                        <Label htmlFor="sorter-case" className="cursor-pointer font-normal">Match capitals (for sorting and duplicates)</Label>
                      </div>
                    </div>
                    <Button onClick={sort} disabled={!hasText} className="w-full">
                      <SortAscending className="h-4 w-4" /> {hasText ? `Sort ${stats.lines.toLocaleString()} ${stats.lines === 1 ? 'line' : 'lines'}` : 'Sort'}
                    </Button>
                  </CardContent>
                </Card>

                <Card className="minimal-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-headline text-lg">Tidy up</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-2">
                      {tidyActions.map((a) => (
                        <Button key={a.label} variant="outline" onClick={a.run} disabled={!hasText} className="justify-start">
                          <a.icon className="h-4 w-4" /> {a.label}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="minimal-card">
                  <CardHeader className="pb-3">
                    <CardTitle className="font-headline text-lg">Split or join</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <fieldset>
                      <legend className="mb-2 text-sm font-medium">Separator</legend>
                      <div className="flex flex-wrap gap-1.5">
                        {SEPARATORS.map((s) => (
                          <Chip key={s.label} active={separator === s.id} onClick={() => setSeparator(s.id)}>{s.label}</Chip>
                        ))}
                      </div>
                    </fieldset>
                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={() => apply((l) => splitItems(l, separator))} disabled={!hasText} className="justify-start">
                        <Rows className="h-4 w-4" /> Split into lines
                      </Button>
                      <Button variant="outline" onClick={() => apply((l) => joinItems(l, separator))} disabled={!hasText} className="justify-start">
                        <TextAlignLeft className="h-4 w-4" /> Join into one line
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Turn “a, b, c” into a list, or a list back into “a, b, c” for a spreadsheet or an email.</p>
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
