"use client";

import React from 'react';
import { Marked } from 'marked';
import DOMPurify from 'dompurify';

interface MarkdownViewProps {
  content: string;
  lastUpdated?: string;
}

interface TocItem {
  id: string;
  title: string;
  level: number;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Rendering trusted, in-repo static content (privacy / terms), sanitized anyway.
const md = new Marked({ gfm: true });

function renderMarkdown(content: string): string {
  try {
    const raw = md.parse(content) as string;
    // Inject slug IDs into headings so the table-of-contents anchors resolve.
    const withIds = raw.replace(/<h([1-6])>([\s\S]*?)<\/h\1>/g, (_m, level, inner) => {
      const text = inner.replace(/<[^>]+>/g, '');
      return `<h${level} id="${slugify(text)}">${inner}</h${level}>`;
    });
    return DOMPurify.sanitize(withIds);
  } catch {
    return '<p>Failed to render content.</p>';
  }
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
        tocItems.push({ id: slugify(title), title, level });
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
      const headerOffset = 100;
      const offsetPosition = element.offsetTop - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      history.replaceState(null, '', `#${id}`);
    }
  };

  return (
    <div className="sticky top-24 max-h-[calc(100vh-6rem)]">
      <div className="p-4">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">On this page</h4>
        <nav className="space-y-1">
          {items.map(({ id, title }) => (
            <button
              key={id}
              onClick={() => handleClick(id)}
              className={`
                block w-full text-left text-sm transition-colors duration-quick py-1 hover:text-foreground
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

export function MarkdownView({ content }: MarkdownViewProps) {
  const HEADER_OFFSET = 100;

  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const offsetPosition = element.offsetTop - HEADER_OFFSET;
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    history.replaceState(null, '', `#${id}`);
  };

  const tocItems = React.useMemo(() => extractTableOfContents(content), [content]);

  // Remove the inline "Table of Contents" section from the rendered body.
  const contentWithoutToc = React.useMemo(
    () => content.replace(/## Table of Contents[\s\S]*?(?=\n##\s|$)/i, '').trim(),
    [content]
  );
  const html = React.useMemo(() => renderMarkdown(contentWithoutToc), [contentWithoutToc]);

  // Scroll to an ID if the URL contains a hash on load/content change.
  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      const id = hash.substring(1);
      setTimeout(() => scrollToId(id), 80);
    }
  }, [tocItems]);

  // Reset scroll on content change (navigating between markdown pages).
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [content]);

  return (
    <div className="flex flex-1 flex-col px-4 p-4 lg:p-8">
      <div className="w-full max-w-7xl mx-auto">
        <div className="flex gap-8">
          {/* Main content */}
          <article
            className="markdown-preview flex-1 max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />

          {/* Table of Contents sidebar */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <TableOfContents items={tocItems} />
          </div>
        </div>
      </div>
    </div>
  );
}
