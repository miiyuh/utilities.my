
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PanelLeft, Copy, Download, Eye, EyeOff, Maximize, Minimize, FileText, Trash2, Info } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { marked } from 'marked';
import markedFootnote from 'marked-footnote';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';

marked.use(markedFootnote());

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


export default function MarkdownPreviewerPage() {
  const [markdownText, setMarkdownText] = useState(initialMarkdown);
  const [htmlOutput, setHtmlOutput] = useState('');

  useEffect(() => {
    const generateHtml = async () => {
      const rawMarkup = await marked.parse(markdownText, {
        gfm: true,
        breaks: true,
      });
      setHtmlOutput(rawMarkup);
    };
    generateHtml();
  }, [markdownText]);

  const handleClearInput = () => {
    setMarkdownText('');
  };

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
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
              <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Markdown Previewer</h1>
              <p className="text-lg text-muted-foreground">Write Markdown and see a live preview.</p>
            </div>
            
            <div className="grid flex-1 gap-6 lg:gap-8 md:grid-cols-2">
              {/* Markdown Input Card */}
              <Card className="shadow-lg flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between pb-6">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl font-headline">Markdown Input</CardTitle>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleClearInput} title="Clear Markdown Input" className="h-9 px-3">
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Clear
                  </Button>
                </CardHeader>
                <CardContent className="flex-grow flex flex-col">
                  <Label htmlFor="markdownInput" className="sr-only">Markdown Input</Label>
                  <Textarea
                    id="markdownInput"
                    value={markdownText}
                    onChange={(e) => setMarkdownText(e.target.value)}
                    className="flex-grow resize-none font-code text-base"
                    placeholder="Type your Markdown here..."
                  />
                </CardContent>
              </Card>

              {/* HTML Preview Card */}
              <Card className="shadow-lg flex flex-col">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl font-headline">HTML Preview</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="flex-grow overflow-auto">
                  <div
                    className="prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: htmlOutput }}
                  />
                </CardContent>
              </Card>
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
