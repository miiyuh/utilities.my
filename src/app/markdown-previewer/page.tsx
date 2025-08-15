"use client";

import type { Metadata } from 'next';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Copy, Download, Eye, FileText, Trash2, Info, Columns } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { marked, Renderer } from 'marked';
import markedFootnote from 'marked-footnote';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// Fallback simple icons for actions not present in lucide-react selection
const CodeIconFallback = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
);
const RefreshIconFallback = () => (
  <svg viewBox="0 0 24 24" className="h-4 w-4" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0114.85-3.36L23 10" /><path d="M20.49 15a9 9 0 01-14.85 3.36L1 14" /></svg>
);

// Configure marked with footnotes + custom renderer (token-based API)
marked.use(markedFootnote());
class AppRenderer extends Renderer {
  heading(token: any): string {
    const id = (token.text || '').toLowerCase().replace(/[^a-z0-9]+/g,'-');
    return `<h${token.depth} id="${id}" class="md-heading md-h${token.depth}"><a href="#${id}" class="md-anchor" aria-label="Link to section">#</a>${token.text}</h${token.depth}>`;
  }
  listitem(token: any): string {
    if (token.task) {
      return `<li class="md-task"><input type="checkbox" disabled ${token.checked ? 'checked' : ''} /> <span>${token.text}</span></li>`;
    }
    return `<li>${token.text}</li>`;
  }
  code(token: any): string {
    const lang = (token.lang || '').toLowerCase();
    return `<pre data-lang="${lang}"><code class="language-${lang}">${token.text}</code></pre>`;
  }
  table(token: any): string {
    return `<div class="md-table-wrapper"><table>${token.header}${token.rows.join('')}</table></div>`;
  }
}
marked.use({ renderer: new AppRenderer(), gfm: true, breaks: true });

interface EditorPaneProps { markdownText: string; setMarkdownText: (v: string)=>void; wrap: boolean; }
const EditorPane: React.FC<EditorPaneProps> = ({ markdownText, setMarkdownText, wrap }) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between px-3 py-2 border-b bg-background/70">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Markdown</span>
      <span className="text-[10px] text-muted-foreground">{markdownText.length.toLocaleString()} chars</span>
    </div>
    <Textarea
      value={markdownText}
      onChange={(e)=>setMarkdownText(e.target.value)}
      className={"flex-1 resize-none font-code text-sm p-3 bg-transparent border-0 focus-visible:ring-0 focus-visible:outline-none " + (wrap ? 'whitespace-pre-wrap' : 'whitespace-pre')}
      placeholder="Type your Markdown here..."
    />
  </div>
);

const PreviewPane: React.FC<{ htmlOutput: string }> = ({ htmlOutput }) => (
  <div className="flex flex-col h-full">
    <div className="flex items-center justify-between px-3 py-2 border-b bg-background/70">
      <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Preview</span>
    </div>
    <div className="flex-1 overflow-auto p-4">
      <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: htmlOutput }} />
    </div>
  </div>
);

const initialMarkdown = `# Markdown Comprehensive Demo

This document demonstrates a wide variety of Markdown features.

## 1. Headings

# Heading 1 (H1)
## Heading 2 (H2)
### Heading 3 (H3)
#### Heading 4 (H4)
##### Heading 5 (H5)
###### Heading 6 (H6)

## 2. Emphasis

You can make text **bold** using double asterisks or double underscores: __bold__.
You can make text *italic* using single asterisks or single underscores: _italic_.
You can combine them for ***bold and italic*** or ___bold and italic___.
You can also use ~~strikethrough~~.

## 3. Lists

### Unordered Lists
- Item A
- Item B
  - Sub-item B1 (indent 2 spaces)
  - Sub-item B2
    * Deeper sub-item B2a (indent 4 spaces, can use \`*\`)
    * Deeper sub-item B2b
- Item C

### Ordered Lists
1. First item
2. Second item
   1. Sub-item 1 (indent 2 spaces)
   2. Sub-item 2
      i. Roman numeral sub-item (Note: GFM might not style this distinctively without specific CSS)
      ii. Another Roman numeral
3. Third item

### Task Lists (GFM)
- [x] Completed task: Review feature specifications
- [ ] Incomplete task: Implement new login flow
- [ ] Another task: Write unit tests
  - [x] Sub-task completed: Draft test cases
  - [ ] Sub-task pending: Execute tests

### Lists with Paragraphs (Loose Lists)
- This is the first item in a loose list.

  This is a paragraph belonging to the first item. It must be indented to align with the item's content (e.g., 2 or 4 spaces from the start of the line).

- This is the second item.

  It also contains multiple lines of text, forming a paragraph. This list becomes "loose" because of the blank line separating items or because items contain block-level content like paragraphs.

## 4. Links

### Inline Links
Visit [Google](https://www.google.com "Google's Homepage").
You can also create links with [relative paths](/about).

### Reference-style Links
Here's a link to [Firebase][fb].
And another to the [Mozilla Developer Network][mdn].

[fb]: https://firebase.google.com/ "Firebase - Develop Apps"
[mdn]: https://developer.mozilla.org/ "MDN Web Docs - Resources for Developers"

## 5. Images

![A placeholder image for demonstration](https://placehold.co/400x200.png "Placeholder Image 400x200")

Images can also be linked using reference style:
![Another placeholder][placeholder-img]

[placeholder-img]: https://placehold.co/300x150.png "Placeholder Image 300x150"

## 6. Code

### Inline Code
Use backticks for inline code, for example, to reference a variable like \`userCount\` or a function \`getUser()_new\`.

### Fenced Code Blocks
You can specify the language for syntax highlighting:
\`\`\`javascript
// JavaScript code example
function greet(name) {
  console.log(\`Hello, \${name}!\`);
}
greet("Developer");
\`\`\`

\`\`\`python
# Python code example
def hello_world():
  print("Hello from Python!")

hello_world()
\`\`\`

\`\`\`html
<!-- HTML code example -->
<div>
  <p class="greeting">This is an HTML code block.</p>
</div>
\`\`\`

\`\`\`
A code block without a language specified.
Plain text or data can go here.
  Indentation is preserved.
\`\`\`

## 7. Blockquotes

> This is a blockquote.
> It can span multiple lines, and subsequent lines are part of the same quote.
>
> > Nested blockquotes are also possible by adding more \`>\` symbols.
> > This allows for quoting conversations or different sources.
>
> Back to the first level of blockquote.

## 8. Horizontal Rules

You can create a horizontal rule using three or more hyphens, asterisks, or underscores on a line by themselves:

---

***

___


## 9. Tables (GFM)

| Feature         | Support Level | Notes                                   |
| :-------------- | :-----------: | :-------------------------------------- |
| Headings        |    Full       | H1 to H6                                |
| Emphasis        |    Full       | Bold, Italic, Strikethrough             |
| Lists           |    Full       | Ordered, Unordered, Task, Nested        |
| Links           |    Full       | Inline, Reference                       |
| Code Blocks     |    Full       | Fenced, with language highlighting      |
| Tables          |    Full       | Requires header and separator row       |
| Alignment (Col) |    Full       | Use colons in the separator row         |

## 10. Footnotes

Here's some text that requires a footnote for more details.[^1]
You can have multiple footnotes in your document.[^note-id]

[^1]: This is the detailed explanation for the first footnote.
[^note-id]: This is another footnote, identified by 'note-id'. It can be longer and might even contain multiple paragraphs if your Markdown processor supports it.

## 11. Escaping Characters

To display literal characters that have special meaning in Markdown syntax, use a backslash (\\\`\\\`) before the character:
\\*This is not italic\\*
\\[This is not a link label\\]
\\\`This is not inline code\\\`
\\# This is not a heading
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
    title: "Task Lists (GFM)",
    content: `- [x] Finish project proposal\n- [ ] Schedule team meeting\n- [ ] Review pull requests`,
  },
  {
    title: "Links & Images",
    content: `[I'm an inline-style link](https://www.google.com)\n\n![alt text](https://placehold.co/100x50.png "Logo Title Text 1")`,
  },
  {
    title: "Code (Inline & Fenced)",
    content: "Inline \`code\` has \`back-ticks around\` it.\n\n\`\`\`javascript\n// Code block\nvar s = \"JavaScript syntax highlighting\";\nalert(s);\n\`\`\`",
  },
  {
    title: "Blockquotes & Horizontal Rules",
    content: `> Blockquotes are very handy in email to emulate reply text.\n> This line is part of the same quote.\n\n---\n\n***\n\n___`,
  },
  {
    title: "Tables (GFM)",
    content: `| Header 1 | Header 2 | Header 3 |\n| :------- | :------: | -------: |\n| Left     | Center   | Right    |\n| Cell A   | Cell B   | Cell C   |`,
  },
  {
    title: "Lists (Ordered, Unordered, Nested)",
    content: `**Ordered List:**\n1. Item 1\n2. Item 2\n   1. Sub-item 2.1\n   2. Sub-item 2.2\n3. Item 3\n\n**Unordered List:**\n- Item A\n- Item B\n  - Sub-item B.1\n  - Sub-item B.2\n    * Deeper Sub B.2.a\n- Item C`
  }
];


export const metadata: Metadata = {
  title: 'Markdown Previewer',
  description: 'Live preview Markdown with GFM, tables, checklists, and code blocks. Handy for writing docs and README files.',
  keywords: ['markdown preview', 'github markdown', 'gfm', 'readme'],
  alternates: { canonical: '/markdown-previewer' },
  openGraph: {
    title: 'Markdown Previewer · utilities.my',
    url: 'https://utilities.my/markdown-previewer',
    images: [{ url: '/api/og?title=Markdown%20Previewer&subtitle=GFM%2C%20Tables%2C%20Code', width: 1200, height: 630 }],
  },
};

export default function MarkdownPreviewerPage() {
  const [markdownText, setMarkdownText] = useState(initialMarkdown);
  const [htmlOutput, setHtmlOutput] = useState('');
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [wrap, setWrap] = useState(true);
  const [panelRatio, setPanelRatio] = useState(0.5); // left pane width ratio in split mode
  const draggingRef = useRef(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const LS_KEY = 'markdown-previewer-content';
  const { toast } = useToast();

  // Autosave / load
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY);
      if (saved && saved !== markdownText) {
        setMarkdownText(saved);
      }
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try { localStorage.setItem(LS_KEY, markdownText); } catch {}
  }, [markdownText]);

  // Debounced parse for performance on large documents
  useEffect(() => {
    const handle = setTimeout(() => {
      const rawMarkup = marked.parse(markdownText) as string;
      setHtmlOutput(rawMarkup);
    }, 120); // 120ms debounce
    return () => clearTimeout(handle);
  }, [markdownText]);

  const handleClearInput = () => {
    setMarkdownText('');
    toast({ title: 'Cleared', description: 'Editor content removed.' });
  };

  const handleResetDemo = () => {
    setMarkdownText(initialMarkdown);
    toast({ title: 'Demo Reset', description: 'Restored example markdown.' });
  };

  const handleCopyMarkdown = async () => {
    try { await navigator.clipboard.writeText(markdownText); toast({ title: 'Markdown Copied', description: 'Source markdown copied to clipboard.' }); } catch {}
  };
  const handleCopyHtml = async () => {
    try { await navigator.clipboard.writeText(htmlOutput); toast({ title: 'HTML Copied', description: 'Rendered HTML copied to clipboard.' }); } catch {}
  };
  const handleDownload = () => {
    const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'document.md';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast({ title: 'Download Started', description: 'Saved as document.md' });
  };

  const startDrag = (e: React.MouseEvent) => {
    if (viewMode !== 'split') return;
    draggingRef.current = true;
    const rect = containerRef.current?.getBoundingClientRect();
    const handleMove = (ev: MouseEvent) => {
      if (!draggingRef.current || !rect) return;
      const x = ev.clientX - rect.left;
      const ratio = Math.min(0.8, Math.max(0.2, x / rect.width));
      setPanelRatio(ratio);
    };
    const handleUp = () => { draggingRef.current = false; window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
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
  <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="lg:hidden" />
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold font-headline">Markdown Previewer</h1>
            </div>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-8">
            {/* Big heading */}
            <div className="mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Markdown Previewer</h1>
              <p className="text-lg text-muted-foreground">Write Markdown and see a live preview.</p>
            </div>
            
            {/* Controls Bar */}
            <div className="flex flex-wrap gap-3 items-center border rounded-md p-3 bg-background/60 sm:justify-start justify-between overflow-x-auto">
              <div className="flex items-center gap-1">
                <Button variant={viewMode==='edit'?'default':'outline'} size="sm" onClick={()=>setViewMode('edit')} title="Editor only"><FileText className="h-4 w-4"/></Button>
                <Button variant={viewMode==='preview'?'default':'outline'} size="sm" onClick={()=>setViewMode('preview')} title="Preview only"><Eye className="h-4 w-4"/></Button>
                <Button variant={viewMode==='split'?'default':'outline'} size="sm" onClick={()=>setViewMode('split')} title="Split view"><Columns className="h-4 w-4"/></Button>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={handleCopyMarkdown} title="Copy Markdown"><Copy className="h-4 w-4"/></Button>
                <Button variant="outline" size="sm" onClick={handleCopyHtml} title="Copy Rendered HTML"><CodeIconFallback />{/* fallback icon */}</Button>
                <Button variant="outline" size="sm" onClick={handleDownload} title="Download .md"><Download className="h-4 w-4"/></Button>
                <Button variant="outline" size="sm" onClick={handleClearInput} title="Clear"><Trash2 className="h-4 w-4"/></Button>
                <Button variant="outline" size="sm" onClick={handleResetDemo} title="Reset Demo Content"><RefreshIconFallback /></Button>
              </div>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{wordCount.toLocaleString()} words</span>
                <span>{lineCount} lines</span>
                <span>{charCount.toLocaleString()} chars</span>
              </div>
            </div>

            {/* Main Workspace */}
            <div
              ref={containerRef}
              className={
                "relative w-full rounded-lg border overflow-hidden bg-card/40 backdrop-blur flex flex-col h-[60vh] sm:h-[65vh] " +
                (viewMode==='split' ? 'md:h-[70vh]' : 'md:h-[65vh]')
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
                  <div style={{flexBasis: `${panelRatio*100}%`}} className="min-h-[35%] md:min-h-0 md:min-w-[30%] md:max-w-[80%] flex flex-col border-b md:border-b-0 md:border-r">
                    <EditorPane markdownText={markdownText} setMarkdownText={setMarkdownText} wrap={wrap} />
                  </div>
                  {/* Drag handle: vertical on desktop only */}
                  <div
                    onMouseDown={startDrag}
                    className="hidden md:block w-1 cursor-col-resize hover:bg-primary/50 bg-border/60 transition-colors"
                    role="separator"
                    aria-orientation="vertical"
                    aria-label="Resize panels"
                  />
                  <div className="flex-1 flex flex-col min-h-[35%]">
                    <PreviewPane htmlOutput={htmlOutput} />
                  </div>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-t bg-background/70 px-3 py-1.5 text-[11px] gap-2">
                <div className="flex gap-2 flex-wrap items-center">
                  <button onClick={()=>setWrap(w=>!w)} className="px-2 py-0.5 rounded border text-muted-foreground hover:text-foreground hover:border-primary/60 transition-colors">
                    {wrap ? 'Disable Wrap' : 'Enable Wrap'}
                  </button>
                  <span className="text-muted-foreground hidden sm:inline">{wordCount.toLocaleString()} words • {lineCount} lines • {charCount.toLocaleString()} chars</span>
                </div>
                <span className="text-muted-foreground">Debounced live preview</span>
              </div>
            </div>

            {/* Markdown Quick Reference Card */}
            <Card className="shadow-lg">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl font-headline">Markdown Quick Reference</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {markdownExamples.sort((a,b) => a.title.localeCompare(b.title)).map((example, index) => (
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
      </SidebarInset>
    </>
  );
}
