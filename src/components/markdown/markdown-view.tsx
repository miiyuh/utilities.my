"use client";

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';

interface MarkdownViewProps {
  content: string;
  lastUpdated?: string;
}

interface TocItem {
  id: string;
  title: string;
  level: number;
}

function extractTableOfContents(content: string): TocItem[] {
  const tocItems: TocItem[] = [];
  const lines = content.split('\n');
  
  for (const line of lines) {
    const match = line.match(/^(#{1,6})\s+(.+)$/);
    if (match && !line.includes('Table of Contents')) {
      const level = match[1].length;
      const title = match[2];
      
      // Only include level 2 headings (main sections like 1.0, 2.0, etc.)
      if (level === 2) {
        const id = title
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        tocItems.push({ id, title, level });
      }
    }
  }
  
  return tocItems;
}

function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = React.useState<string>('');

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-20% 0% -35% 0%' }
    );

    items.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  const handleClick = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100; // Adjust this value based on your header height
      const elementPosition = element.offsetTop;
      const offsetPosition = elementPosition - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="sticky top-24 max-h-[calc(100vh-6rem)]">
      <div className="p-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">On this page</h4>
        <nav className="space-y-1">
          {items.map(({ id, title, level }) => (
            <button
              key={id}
              onClick={() => handleClick(id)}
              className={`
                block w-full text-left text-sm transition-colors duration-200 py-1 hover:text-foreground
                font-normal pl-2
                ${
                  activeId === id
                    ? 'text-foreground font-medium border-l-2 border-l-foreground'
                    : 'text-muted-foreground'
                }
              `}
            >
              {title}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}

export function MarkdownView({ content, lastUpdated }: MarkdownViewProps) {
  const tocItems = React.useMemo(() => extractTableOfContents(content), [content]);
  
  // Remove the TOC section from the content
  const contentWithoutToc = content.replace(/## Table of Contents[\s\S]*?(?=##[^#]|\Z)/i, '').trim();

  return (
    <div className="flex flex-1 flex-col p-4 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex gap-8">
          {/* Main content */}
          <article className="flex-1 prose dark:prose-invert prose-slate max-w-none prose-lg">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSlug]}
              components={{
                h1: ({ node, ...props }) => (
                  <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4" {...props} />
                ),
                h2: ({ node, ...props }) => (
                  <h2 className="text-3xl font-semibold mt-12 mb-6 text-foreground border-b border-border pb-2" {...props} />
                ),
                h3: ({ node, ...props }) => (
                  <h3 className="text-2xl font-medium mt-8 mb-4 text-foreground" {...props} />
                ),
                h4: ({ node, ...props }) => (
                  <h4 className="text-xl font-medium mt-6 mb-3 text-foreground" {...props} />
                ),
                p: ({ node, ...props }) => (
                  <p className="leading-8 mb-6 text-foreground/90" {...props} />
                ),
                ul: ({ node, ...props }) => (
                  <ul className="my-6 ml-6 list-disc space-y-2" {...props} />
                ),
                ol: ({ node, ...props }) => (
                  <ol className="my-6 ml-6 list-decimal space-y-2" {...props} />
                ),
                li: ({ node, ...props }) => (
                  <li className="leading-7 text-foreground/90" {...props} />
                ),
                a: ({ node, ...props }) => (
                  <a className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors" {...props} />
                ),
                hr: ({ node, ...props }) => (
                  <hr className="my-8 border-border" {...props} />
                ),
                strong: ({ node, ...props }) => (
                  <strong className="font-semibold text-foreground" {...props} />
                ),
                em: ({ node, ...props }) => (
                  <em className="italic text-foreground/80" {...props} />
                ),
                blockquote: ({ node, ...props }) => (
                  <blockquote className="mt-6 border-l-4 border-primary pl-6 italic text-foreground/80 bg-muted/30 py-4 rounded-r" {...props} />
                ),
                code: ({ node, ...props }) => (
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold" {...props} />
                ),
                pre: ({ node, ...props }) => (
                  <pre className="mb-4 mt-6 overflow-x-auto rounded-lg border bg-muted p-4" {...props} />
                ),
              }}
            >
              {contentWithoutToc}
            </ReactMarkdown>
          </article>

          {/* Table of Contents Sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <TableOfContents items={tocItems} />
          </div>
        </div>
      </div>
    </div>
  );
}
