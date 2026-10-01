import { useMemo, useRef, useState } from 'react';
import { TextAa, UploadSimple } from 'phosphor-react';
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
import { CASES, convertAll, type CaseOptions } from '@/lib/text-case';
import { cn } from '@/lib/utils';

const EXAMPLE = 'Nasi lemak and teh tarik for the KL office';

const OPTIONS: { key: keyof CaseOptions; label: string; hint: string }[] = [
  { key: 'smartTitle', label: 'Smart title case', hint: 'Keeps short words like “and”, “dan” and “bin” lowercase.' },
  { key: 'keepAcronyms', label: 'Keep acronyms', hint: 'Leaves words like IC, KL and iPhone as you wrote them.' },
  { key: 'tidySpaces', label: 'Tidy spaces', hint: 'Trims each line and squeezes extra spaces.' },
];

export default function TextCaseConverterPage() {
  const [text, setText] = useState('');
  const [opts, setOpts] = useState<CaseOptions>({ smartTitle: true, keepAcronyms: true, tidySpaces: true });
  const fileRef = useRef<HTMLInputElement>(null);

  const isEmpty = text.trim() === '';
  const results = useMemo(() => convertAll(isEmpty ? EXAMPLE : text, opts), [text, isEmpty, opts]);
  const words = isEmpty ? 0 : text.trim().split(/\s+/).length;

  const importFile = async (file: File) => setText((await file.text()).replace(/\r\n?/g, '\n'));

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={TextAa} title="Text Case Converter" />
        <div className="flex flex-col p-4 lg:p-8">
          <div className="mx-auto w-full max-w-7xl space-y-8">
            <PageIntro title="Text Case Converter">Type or paste once and get every case at the same time, from Sentence case to snake_case. Copy the one you need.</PageIntro>

            <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] lg:items-start">
              <Card className="minimal-card lg:sticky lg:top-20">
                <CardHeader className="pb-3">
                  <CardTitle className="font-headline text-lg">Your text</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".txt,text/plain"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.currentTarget.files?.[0];
                        if (f) void importFile(f);
                        e.currentTarget.value = '';
                      }}
                    />
                    <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                      <UploadSimple className="h-4 w-4" /> Open a .txt file
                    </Button>
                    <ClearButton
                      onClear={() => setText('')}
                      hasContent={!isEmpty}
                      className="ml-auto"
                      confirmTitle="Clear your text?"
                      confirmDescription="This removes the text you entered. It can't be undone."
                      confirmLabel="Clear text"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="case-input" className="sr-only">Text to convert</Label>
                    <Textarea
                      id="case-input"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder={`e.g. ${EXAMPLE}`}
                      className="min-h-[200px] resize-y text-base sm:text-sm"
                    />
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {words.toLocaleString()} {words === 1 ? 'word' : 'words'} · {text.length.toLocaleString()} characters
                    </p>
                  </div>
                  <fieldset className="space-y-3">
                    <legend className="mb-2 text-sm font-medium">Options</legend>
                    {OPTIONS.map((o) => (
                      <div key={o.key} className="flex items-start gap-3">
                        <Switch
                          id={`case-${o.key}`}
                          checked={opts[o.key]}
                          onCheckedChange={(v) => setOpts((p) => ({ ...p, [o.key]: v }))}
                          className="mt-0.5"
                          aria-describedby={`case-${o.key}-hint`}
                        />
                        <div>
                          <Label htmlFor={`case-${o.key}`} className="cursor-pointer font-normal">{o.label}</Label>
                          <p id={`case-${o.key}-hint`} className="text-xs text-muted-foreground">{o.hint}</p>
                        </div>
                      </div>
                    ))}
                  </fieldset>
                </CardContent>
              </Card>

              <Card className="minimal-card">
                <CardHeader className="pb-3">
                  <CardTitle className="font-headline text-lg">Every case</CardTitle>
                  {isEmpty && <p className="text-sm text-muted-foreground">Showing an example. Your text replaces it as you type.</p>}
                </CardHeader>
                <CardContent>
                  <ul className="divide-y divide-border">
                    {CASES.map((c) => (
                      <li key={c.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                        <div className="min-w-0 flex-1 space-y-1">
                          <p className={cn('text-xs font-medium text-muted-foreground', c.code && 'font-code')}>{c.name}</p>
                          <p
                            className={cn(
                              'max-h-32 overflow-y-auto whitespace-pre-wrap break-words text-sm',
                              c.code && 'font-code',
                              isEmpty && 'text-muted-foreground'
                            )}
                          >
                            {results.get(c.id)}
                          </p>
                        </div>
                        <CopyButton
                          value={() => results.get(c.id) ?? ''}
                          label=""
                          size="icon-sm"
                          variant="ghost"
                          aria-label={`Copy ${c.name}`}
                          title={`Copy ${c.name}`}
                          toastTitle="Copied"
                          toastDescription={`${c.name} copied to the clipboard.`}
                          disabled={isEmpty}
                        />
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <ToolMethodology />
      </SidebarInset>
    </>
  );
}
