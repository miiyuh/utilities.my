import { ClearButton } from '@/components/ui/clear-button';
import { Hint } from '@/components/ui/tooltip';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import DOMPurify from 'dompurify';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { DownloadSimple, Eye, Article, Info, Columns, ArrowCounterClockwise, PencilSimple, TextAa, UploadSimple } from 'phosphor-react';
import { Sidebar, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { marked, Renderer, Tokens } from 'marked';
import markedFootnote from 'marked-footnote';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { useToast } from '@/hooks/use-toast';
import { useToolSettings } from '@/hooks/use-tool-settings';
import { PageHeader } from "@/components/page-header";
import { Chip } from '@/components/ui/chip';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { downloadBlob, isIOSOrSafari } from '@/lib/image-utils';

import { ToolMethodology } from '@/components/tool-methodology';
// Fallback simple icons for actions not present in lucide-react selection
const CodeIconFallback = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
);

// Configure marked with footnotes + custom renderer (token-based API)
marked.use(markedFootnote());
// Basic type for marked tokens (partial, for demonstration)
type MarkedToken = {
  text?: string;
  depth?: number;
  task?: boolean;
  checked?: boolean;
  lang?: string;
};
class AppRenderer extends Renderer {
  heading(token: MarkedToken): string {
    const id = (token.text || '').toLowerCase().replace(/[^a-z0-9]+/g,'-');
    return `<h${token.depth} id="${id}" class="md-heading md-h${token.depth}"><a href="#${id}" class="md-anchor" aria-label="Link to section">#</a>${token.text}</h${token.depth}>`;
  }
  listitem(token: MarkedToken): string {
    if (token.task) {
      return `<li class="md-task"><input type="checkbox" disabled ${token.checked ? 'checked' : ''} /> <span>${token.text}</span></li>`;
    }
    return `<li>${token.text}</li>`;
  }
  code(token: MarkedToken): string {
    const lang = (token.lang || '').toLowerCase();
    return `<pre data-lang="${lang}"><code class="language-${lang}">${token.text}</code></pre>`;
  }
  table(token: Tokens.Table): string {
    // token.header: TableCell[]; token.rows: TableCell[][]
    const renderRow = (row: Tokens.TableCell[]) =>
      '<tr>' + row.map(cell => `<td>${cell.text}</td>`).join('') + '</tr>';
    const headerRow = '<tr>' + token.header.map(cell => `<th>${cell.text}</th>`).join('') + '</tr>';
    const bodyRows = token.rows.map(renderRow).join('');
    return `<div class="md-table-wrapper"><table>${headerRow}${bodyRows}</table></div>`;
  }
}
marked.use({ renderer: new AppRenderer(), gfm: true, breaks: true });

interface EditorPaneProps { markdownText: string; setMarkdownText: (v: string)=>void; wrap: boolean; }
const EditorPane: React.FC<EditorPaneProps> = ({ markdownText, setMarkdownText, wrap }) => {
  return (
  <div className="flex flex-col h-full min-h-0 md:min-h-[400px]">
    <div className="flex items-center justify-between px-3 py-2 border-b bg-background/70">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Markdown</span>
    </div>
    <Textarea
      value={markdownText}
      onChange={(e)=>setMarkdownText(e.target.value)}
      className={"field-sizing-fixed flex-1 min-h-0 resize-none font-code text-sm p-3 bg-transparent border-0 focus-visible:ring-0 focus-visible:outline-none overflow-y-auto " + (wrap ? 'whitespace-pre-wrap' : 'whitespace-pre')}
      placeholder="Type your Markdown here…"
    />
  </div>
  );
};

const PreviewPane: React.FC<{ htmlOutput: string }> = ({ htmlOutput }) => (
  <div className="flex flex-col h-full min-h-0 md:min-h-[400px]">
    <div className="flex items-center justify-between px-3 py-2 border-b bg-background/70">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</span>
    </div>
    <div className="flex-1 overflow-auto p-4">
      <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: htmlOutput }} />
    </div>
  </div>
);

const VIEWS = [
  { id: 'edit', label: 'Write', icon: PencilSimple },
  { id: 'split', label: 'Split', icon: Columns },
  { id: 'preview', label: 'Preview', icon: Eye },
] as const;

const initialMarkdown = `# Weekend plan

Write on the left and see it formatted on the right. Everything stays in your browser.

## To do

- [x] Book a table for Saturday
- [ ] Buy durian (the good kind)
- [ ] Message the group chat

## Where to eat

| Place | Area | Budget |
| --- | --- | --- |
| Nasi kandar | George Town | RM 15 |
| Dim sum | Ipoh | RM 30 |
| Satay | Kajang | RM 20 |

> **Bold**, *italic*, \`code\` and [links](https://utilities.my) all work. See the cheat sheet below for more.

1. Leave at 9 a.m.
2. Stop for breakfast
3. Arrive by noon[^1]

[^1]: Traffic permitting.
`;

const markdownExamples = [
  {
    title: "Headings",
    content: `# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6`,
  },
  {
    title: "Emphasis",
    content: `*This text will be italic*\n_This will also be italic_\n\n**This text will be bold**\n__This will also be bold__\n\n~~This text will be strikethrough~~\n\n***Bold and italic***`,
  },
  {
    title: "Task lists",
    content: `- [x] Finish project proposal\n- [ ] Schedule team meeting\n- [ ] Review pull requests`,
  },
  {
    title: "Links and images",
    content: `[I'm an inline-style link](https://www.google.com)\n\n![alt text](https://picsum.photos/100/50 "Beautiful Photo 100x50")`,
  },
  {
    title: "Code",
    content: "Inline `code` has `back-ticks around` it.\n\n```javascript\n// Code block\nvar s = \"JavaScript syntax highlighting\";\nalert(s);\n```",
  },
  {
    title: "Quotes and dividers",
    content: `> Blockquotes are very handy in email to emulate reply text.\n> This line is part of the same quote.\n\n---\n\n***\n\n___`,
  },
  {
    title: "Tables",
    content: `| Header 1 | Header 2 | Header 3 |\n| :------- | :------: | -------: |\n| Left     | Center   | Right    |\n| Cell A   | Cell B   | Cell C   |`,
  },
  {
    title: "Lists",
    content: `**Ordered List:**\n1. Item 1\n2. Item 2\n   1. Sub-item 2.1\n   2. Sub-item 2.2\n3. Item 3\n\n**Unordered List:**\n- Item A\n- Item B\n  - Sub-item B.1\n  - Sub-item B.2\n    * Deeper Sub B.2.a\n- Item C`
  }
];


export default function MarkdownPreviewerPage() {
  const { formatNumber } = useToolSettings();
  const [markdownText, setMarkdownText] = useState(() => {
    try {
      return localStorage.getItem('markdown-previewer-content') ?? initialMarkdown;
    } catch {
      return initialMarkdown;
    }
  });
  const [htmlOutput, setHtmlOutput] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [wrap, setWrap] = useState(true);
  const [panelRatio, setPanelRatio] = useState(0.5); // left pane width ratio in split mode
  const draggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const LS_KEY = 'markdown-previewer-content';
  const fileRef = useRef<HTMLInputElement | null>(null);
  const { toast } = useToast();

  // Keep the draft between visits. Blocked storage (a private window) just means it isn't kept.
  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, markdownText);
    } catch {
      // Not saved; nothing else to do.
    }
  }, [markdownText]);

  // Debounced parse for performance on large documents
  useEffect(() => {
    const handle = setTimeout(() => {
      try {
        const rawMarkup = marked.parse(markdownText) as string;
        const sanitized = DOMPurify.sanitize(rawMarkup);
        setHtmlOutput(sanitized);
      } catch {
        toast({ title: "Couldn't show the preview", description: 'Something in this Markdown could not be rendered.', variant: 'destructive' });
        setHtmlOutput('');
      }
    }, 120); // 120ms debounce
    return () => clearTimeout(handle);
  }, [markdownText, toast]);

  const handleClearInput = () => {
    setMarkdownText('');
  };

  const handleResetDemo = () => {
    setMarkdownText(initialMarkdown);
  };

  const handleDownload = () => {
    downloadBlob(new Blob([markdownText], { type: 'text/markdown;charset=utf-8' }), 'document.md', isIOSOrSafari());
    toast({ title: 'Saved', description: 'Downloaded as document.md.' });
  };

  const openFile = async (file: File) => setMarkdownText((await file.text()).replace(/\r\n?/g, '\n'));

  /** Copies the preview as rich text, so it pastes formatted into email, Docs or Word. */
  const copyFormatted = async () => {
    const plain = new DOMParser().parseFromString(htmlOutput, 'text/html').body.innerText;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([htmlOutput], { type: 'text/html' }),
          'text/plain': new Blob([plain], { type: 'text/plain' }),
        }),
      ]);
      toast({ title: 'Copied', description: 'Paste it into an email or document to keep the formatting.' });
    } catch {
      toast({ title: "Couldn't copy", description: 'Your browser blocked rich-text copying. Try Copy HTML instead.', variant: 'destructive' });
    }
  };

  const startDrag = () => {
    if (viewMode !== 'split') return;
    draggingRef.current = true;
    const rect = containerRef.current?.getBoundingClientRect();
    const handleMove = (ev: MouseEvent) => {
      if (!draggingRef.current || !rect) return;
      const x = ev.clientX - rect.left;
      const containerWidth = rect.width;
      
      const minPanelWidth = containerWidth < 768 ? 150 : 200;
      const minRatio = minPanelWidth / containerWidth;
      const maxRatio = (containerWidth - minPanelWidth) / containerWidth;
      
      const ratio = Math.min(maxRatio, Math.max(minRatio, x / containerWidth));
      setPanelRatio(ratio);
    };
    const handleUp = () => { draggingRef.current = false; window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  // Touch-based horizontal resize (for touch devices when panels are side-by-side)
  const startTouch = (e: React.TouchEvent) => {
    if (viewMode !== 'split') return;
    draggingRef.current = true;
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    const handleMove = (ev: TouchEvent) => {
      if (!draggingRef.current || !rect || !ev.touches?.length) return;
      const x = ev.touches[0].clientX - rect.left;
      const containerWidth = rect.width;
      const minPanelWidth = containerWidth < 768 ? 150 : 200;
      const minRatio = minPanelWidth / containerWidth;
      const maxRatio = (containerWidth - minPanelWidth) / containerWidth;
      const ratio = Math.min(maxRatio, Math.max(minRatio, x / containerWidth));
      setPanelRatio(ratio);
    };
    const handleEnd = () => {
      draggingRef.current = false;
      window.removeEventListener('touchmove', handleMove as EventListener);
      window.removeEventListener('touchend', handleEnd);
    };
    window.addEventListener('touchmove', handleMove as EventListener, { passive: false });
    window.addEventListener('touchend', handleEnd);
  };

  // Vertical resize for stacked panels (mobile)
  const startDragVertical = () => {
    if (viewMode !== 'split') return;
    draggingRef.current = true;
    const rect = containerRef.current?.getBoundingClientRect();
    const handleMove = (ev: MouseEvent) => {
      if (!draggingRef.current || !rect) return;
      const y = ev.clientY - rect.top;
      const containerHeight = rect.height;
      const minPanelHeight = 100;
      const minRatio = minPanelHeight / containerHeight;
      const maxRatio = 1 - minRatio;
      const ratio = Math.min(maxRatio, Math.max(minRatio, y / containerHeight));
      setPanelRatio(ratio);
    };
    const handleUp = () => { draggingRef.current = false; window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  const startTouchVertical = (e: React.TouchEvent) => {
    if (viewMode !== 'split') return;
    draggingRef.current = true;
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    const handleMove = (ev: TouchEvent) => {
      if (!draggingRef.current || !rect || !ev.touches?.length) return;
      const y = ev.touches[0].clientY - rect.top;
      const containerHeight = rect.height;
      const minPanelHeight = 100;
      const minRatio = minPanelHeight / containerHeight;
      const maxRatio = 1 - minRatio;
      const ratio = Math.min(maxRatio, Math.max(minRatio, y / containerHeight));
      setPanelRatio(ratio);
    };
    const handleEnd = () => {
      draggingRef.current = false;
      window.removeEventListener('touchmove', handleMove as EventListener);
      window.removeEventListener('touchend', handleEnd);
    };
    window.addEventListener('touchmove', handleMove as EventListener, { passive: false });
    window.addEventListener('touchend', handleEnd);
  };

  const handleResizerKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (viewMode !== 'split') return;
    const step = 0.05;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
      setPanelRatio(r => Math.max(0.05, r - step));
      e.preventDefault();
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
      setPanelRatio(r => Math.min(0.95, r + step));
      e.preventDefault();
    } else if (e.key === 'Home') {
      setPanelRatio(0.05);
      e.preventDefault();
    } else if (e.key === 'End') {
      setPanelRatio(0.95);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      setPanelRatio(0.5);
      e.preventDefault();
    }
  };

  const handleResizerKeyDownVertical = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (viewMode !== 'split') return;
    const step = 0.05;
    if (e.key === 'ArrowUp') {
      setPanelRatio(r => Math.max(0.05, r - step));
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      setPanelRatio(r => Math.min(0.95, r + step));
      e.preventDefault();
    } else if (e.key === 'Home') {
      setPanelRatio(0.05);
      e.preventDefault();
    } else if (e.key === 'End') {
      setPanelRatio(0.95);
      e.preventDefault();
    } else if (e.key === 'Enter') {
      setPanelRatio(0.5);
      e.preventDefault();
    }
  };

  const resetToCenter = () => {
    if (viewMode === 'split') {
      setPanelRatio(0.5);
    }
  };

  const wordCount = useMemo(() => markdownText.trim() ? markdownText.trim().split(/\s+/).length : 0, [markdownText]);
  const lineCount = useMemo(() => markdownText.split(/\n/).length, [markdownText]);
  const charCount = markdownText.length;

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
  <PageHeader icon={Article} title="Markdown Previewer" />
        <div className="flex flex-1 flex-col px-4 p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-8">
            {/* Big heading */}
            <div className="mb-8 max-sm:sr-only">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Markdown Previewer</h1>
              <p className="max-w-3xl text-base text-muted-foreground sm:text-lg">Write Markdown and watch it take shape as you type. Copy it formatted for an email or document, or download the file.</p>
            </div>
            
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-md border border-border bg-card p-3">
              <fieldset className="flex flex-wrap gap-1.5">
                <legend className="sr-only">View</legend>
                {VIEWS.map((v) => (
                  <Chip key={v.id} active={viewMode === v.id} onClick={() => setViewMode(v.id)}>
                    <v.icon className="h-4 w-4" aria-hidden /> {v.label}
                  </Chip>
                ))}
              </fieldset>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".md,.markdown,.txt,text/markdown,text/plain"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.currentTarget.files?.[0];
                    if (f) void openFile(f);
                    e.currentTarget.value = '';
                  }}
                />
                <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
                  <UploadSimple className="h-4 w-4" /> Open
                </Button>
                <Button variant="outline" size="sm" onClick={() => void copyFormatted()} disabled={!markdownText.trim()}>
                  <TextAa className="h-4 w-4" /> Copy formatted
                </Button>
                <CopyButton value={() => markdownText} size="sm" label="Copy Markdown" toastTitle="Copied" toastDescription="Your Markdown is on the clipboard." disabled={!markdownText} />
                <CopyButton value={() => htmlOutput} size="sm" label="Copy HTML" icon={<CodeIconFallback />} toastTitle="Copied" toastDescription="The HTML is on the clipboard." disabled={!markdownText} />
                <Button variant="outline" size="sm" onClick={handleDownload} disabled={!markdownText}>
                  <DownloadSimple className="h-4 w-4" /> Download .md
                </Button>
              </div>
              <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
                <ClearButton
                  onClear={handleResetDemo}
                  hasContent={markdownText !== initialMarkdown}
                  variant="outline"
                  size="sm"
                  label="Start over"
                  icon={ArrowCounterClockwise}
                  confirmTitle="Start over with the example?"
                  confirmDescription="This replaces everything in the editor with the example text."
                  confirmLabel="Start over"
                />
                <ClearButton
                  onClear={handleClearInput}
                  hasContent={Boolean(markdownText)}
                  size="sm"
                  confirmTitle="Clear the editor?"
                  confirmDescription="This removes all the Markdown in the editor. It can't be undone."
                  confirmLabel="Clear editor"
                />
              </div>
            </div>

            {/* Main Workspace */}
            <div
              ref={containerRef}
              className={
                "relative w-full rounded-lg border overflow-hidden bg-card/40 backdrop-blur flex flex-col " +
                "h-[60vh] sm:h-[70vh] md:h-[75vh] lg:h-[80vh] " +
                (viewMode==='split' ? 'xl:h-[85vh]' : '')
              }
            >
              {viewMode === 'edit' && (
                <div className="flex flex-col h-full">
                  <EditorPane markdownText={markdownText} setMarkdownText={setMarkdownText} wrap={wrap} />
                </div>
              )}
              {viewMode === 'preview' && (
                <div className="flex flex-col h-full">
                  <PreviewPane htmlOutput={htmlOutput} />
                </div>
              )}
              {viewMode === 'split' && (
                <div className="flex flex-1 h-full w-full select-none flex-col md:flex-row">
                  <div style={{flexBasis: `${panelRatio*100}%`}} className="min-h-[80px] md:min-h-[300px] min-w-[150px] md:min-w-[200px] md:max-w-[calc(100%-150px)] lg:max-w-[calc(100%-200px)] flex flex-col border-b md:border-b-0 md:border-r overflow-hidden">
                    <EditorPane markdownText={markdownText} setMarkdownText={setMarkdownText} wrap={wrap} />
                  </div>

                  {/* Drag handle: vertical on desktop only */}
                  <Hint label="Drag to resize panels, double-click to reset to center">
                    <div
                    onMouseDown={startDrag}
                    onTouchStart={startTouch}
                    onKeyDown={handleResizerKeyDown}
                    onDoubleClick={resetToCenter}
                    tabIndex={0}
                    className="hidden md:block w-1 cursor-col-resize hover:bg-primary/50 bg-border/60 transition-colors"
                    // A focusable separator carrying aria-valuenow is the
                    // ARIA splitter pattern; <hr> is a thematic break and
                    // can take neither focus nor a value.
                    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize panels (double-click to center)"
                    aria-valuemin={5}
                    aria-valuemax={95}
                    aria-valuenow={Math.round(panelRatio*100)}
                  />
                  </Hint>

                  {/* Mobile drag handle (horizontal / stacked panels) */}
                  <Hint label="Drag to resize panels, double-click to reset to center">
                    <div
                    onMouseDown={startDragVertical}
                    onTouchStart={startTouchVertical}
                    onKeyDown={handleResizerKeyDownVertical}
                    onDoubleClick={resetToCenter}
                    tabIndex={0}
                    className="md:hidden h-2 cursor-row-resize hover:bg-primary/50 bg-border/60 transition-colors"
                    // A focusable separator carrying aria-valuenow is the
                    // ARIA splitter pattern; <hr> is a thematic break and
                    // can take neither focus nor a value.
                    // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
                    role="separator"
                    aria-orientation="horizontal"
                    aria-label="Resize panels vertically (double-click to center)"
                    aria-valuemin={5}
                    aria-valuemax={95}
                    aria-valuenow={Math.round(panelRatio*100)}
                  />
                  </Hint>

                  <div className="flex-1 flex flex-col min-h-[80px] md:min-h-[300px] min-w-[150px] md:min-w-[200px] overflow-hidden">
                    <PreviewPane htmlOutput={htmlOutput} />
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Switch id="md-wrap" checked={wrap} onCheckedChange={setWrap} />
                  <Label htmlFor="md-wrap" className="cursor-pointer text-xs font-normal">Wrap long lines</Label>
                </div>
                <span className="tabular-nums">
                  {formatNumber(wordCount, 0)} words · {formatNumber(lineCount, 0)} lines · {formatNumber(charCount, 0)} characters
                </span>
              </div>
            </div>

            {/* Markdown Quick Reference Card */}
            <Card className="shadow-lg">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-xl font-headline">Markdown cheat sheet</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {[...markdownExamples].sort((a,b) => a.title.localeCompare(b.title)).map((example, index) => (
                    <AccordionItem value={`item-${index}`} key={index}>
                      <AccordionTrigger>{example.title}</AccordionTrigger>
                      <AccordionContent>
                        <pre className="bg-muted/50 p-4 rounded-md border border-border text-sm font-code overflow-x-auto">
                          {example.content}
                        </pre>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
        <ToolMethodology />
      </SidebarInset>
    </>
  );
}

