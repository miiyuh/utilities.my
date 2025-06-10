
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PanelLeft, FileText, Eye, Info, Trash2 } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { marked } from 'marked';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';

const initialMarkdown = `# Welcome to Markdown Previewer!

## Basic Syntax
You can make text **bold**, *italic*, or even ***both***!
Strikethrough uses two tildes: ~~scratch this.~~

## Lists
1. First ordered list item
2. Another item
  - Unordered sub-list.
3. Actual numbers don't matter, just that it's a number
  1. Ordered sub-list
    - Deeper unordered sub-sub-list.

Paragraphs in lists:
1.  This is the first list item.

    You can include paragraphs in list items.
    Make sure the paragraph is indented to align with the text of the list item. It will have its own spacing.

2.  Second item.

- Unordered list
  - Can use asterisks
  * Or minuses
  + Or pluses
    - With deeper nesting too.

## Links
[Visit Firebase](https://firebase.google.com)

## Images
![Alt text for a placeholder image](https://placehold.co/300x200.png "Placeholder Image")

## Code
Inline \`code\` has \`back-ticks around\` it.

\`\`\`javascript
// Code block
function greet(name) {
  console.log("Hello, " + name + "!");
}
greet("World");
\`\`\`

## Blockquotes
> Dorothy followed her through many of the beautiful rooms in her castle.
>
> This is a second paragraph in the blockquote.

## Horizontal Rule
---
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
    title: "Lists",
    content: `Ordered List:\n1. First item\n2. Second item\n3. Third item\n  1. Indented item (2 spaces)\n    - Further indented (4 spaces)\n\nUnordered List:\n- Item 1\n- Item 2\n  - Sub-item 2.1 (2 spaces)\n  - Sub-item 2.2 (2 spaces)\n\n- List item with a paragraph:\n\n  This is a paragraph inside a list item. It should be indented.\n\n- Another item.`,
  },
  {
    title: "Links & Images",
    content: `[I'm an inline-style link](https://www.google.com)\n\n![alt text](https://placehold.co/100x50.png "Logo Title Text 1")`,
  },
  {
    title: "Code",
    content: "Inline `code` has `back-ticks around` it.\n\n```javascript\n// Code block\nvar s = \"JavaScript syntax highlighting\";\nalert(s);\n```",
  },
  {
    title: "Blockquotes & Horizontal Rules",
    content: `> Blockquotes are very handy in email to emulate reply text.\n> This line is part of the same quote.\n\nThree or more...\n\n---\n\nHyphens\n\n***\n\nAsterisks\n\n___\n\nUnderscores`,
  },
];


export default function MarkdownPreviewerPage() {
  const [markdownText, setMarkdownText] = useState(initialMarkdown);
  const [htmlOutput, setHtmlOutput] = useState('');

  useEffect(() => {
    const generateHtml = async () => {
      // Configure marked to handle line breaks (gfm: true implies breaks: true, but explicitly setting can be clearer)
      // and to use GitHub Flavored Markdown.
      const rawMarkup = await marked.parse(markdownText, { 
        gfm: true, 
        breaks: true, // Ensures <br> for single newlines within paragraphs
        mangle: false, // Recommended for security with untrusted input, but usually false for simple previewers.
        headerIds: false, // Avoids generating ids for headers if not needed.
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
            <SidebarTrigger className="md:hidden">
              <PanelLeft />
            </SidebarTrigger>
            <h1 className="text-xl font-semibold font-headline">Markdown Previewer</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="grid flex-1 gap-6 md:grid-cols-2">
            {/* Markdown Input Card */}
            <Card className="shadow-lg flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <CardTitle className="text-xl font-headline">Markdown Input</CardTitle>
                </div>
                <Button variant="outline" size="sm" onClick={handleClearInput} title="Clear Markdown Input">
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
                  className="flex-grow resize-none font-code" 
                  placeholder="Type your Markdown here..."
                />
              </CardContent>
            </Card>

            {/* HTML Preview Card */}
            <Card className="shadow-lg flex flex-col">
              <CardHeader>
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
          <Card className="shadow-lg mt-6">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl font-headline">Markdown Quick Reference</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {markdownExamples.map((example, index) => (
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
      </SidebarInset>
    </>
  );
}
