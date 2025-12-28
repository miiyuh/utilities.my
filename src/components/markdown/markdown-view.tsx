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
  

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '');
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

      // Update the URL hash without jumping
      history.replaceState(null, '', `#${id}`);
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
  const HEADER_OFFSET = 100;

  const scrollToId = (id: string) => {
    const element = document.getElementById(id);
    if (!element) return;
    const elementPosition = element.offsetTop;
    const offsetPosition = elementPosition - HEADER_OFFSET;
    window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    history.replaceState(null, '', `#${id}`);
  };

  const tocItems = React.useMemo(() => extractTableOfContents(content), [content]);
  // Scroll to an ID if the URL contains a hash on load/content change
  React.useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.length > 1) {
      const id = hash.substring(1);
      // Defer to allow DOM to render
      setTimeout(() => scrollToId(id), 80);
    }
  }, [tocItems]);

  // When the content changes (navigating between markdown pages), reset scroll and clear any existing hash so the next page starts at the top.
  React.useEffect(() => {
    // Reset scroll to top of page (accounting for header offset if needed)
    window.scrollTo({ top: 0, behavior: 'auto' });
    // Remove hash from URL to avoid jumping to previous section
    if (window.location.hash) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [content]);

  // Remove the TOC section from the content
  const contentWithoutToc = content.replace(/## Table of Contents[\s\S]*?(?=##[^#]|\Z)/i, '').trim();

  const slugify = (text: string): string => {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

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
                h1: ({ node, children }) => {
                  const text = React.Children.toArray(children).map(c => typeof c === 'string' ? c : String((c as any)?.props?.children || '')).join('');
                  const id = slugify(text || '');
                  return (
                    <h1 id={id} className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4 group">
                      <span className="inline-flex items-center">
                        {children}
                        {id && (
                          <a
                            href={`#${id}`}
                            onClick={(e) => { e.preventDefault(); scrollToId(id); }}
                            className="ml-3 text-muted-foreground hover:text-foreground text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={`Link to ${id}`}
                          >
                            #
                          </a>
                        )}
                      </span>
                    </h1>
                  );
                },
                h2: ({ node, children }) => {
                  const text = React.Children.toArray(children).map(c => typeof c === 'string' ? c : String((c as any)?.props?.children || '')).join('');
                  const id = slugify(text || '');
                  return (
                    <h2 id={id} className="text-3xl font-semibold mt-12 mb-6 text-foreground border-b border-border pb-2 group">
                      <span className="inline-flex items-center">
                        {children}
                        {id && (
                          <a
                            href={`#${id}`}
                            onClick={(e) => { e.preventDefault(); scrollToId(id); }}
                            className="ml-3 text-muted-foreground hover:text-foreground text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={`Link to ${id}`}
                          >
                            #
                          </a>
                        )}
                      </span>
                    </h2>
                  );
                },
                h3: ({ node, children }) => {
                  const text = React.Children.toArray(children).map(c => typeof c === 'string' ? c : String((c as any)?.props?.children || '')).join('');
                  const id = slugify(text || '');
                  return (
                    <h3 id={id} className="text-2xl font-medium mt-8 mb-4 text-foreground group">
                      <span className="inline-flex items-center">
                        {children}
                        {id && (
                          <a
                            href={`#${id}`}
                            onClick={(e) => { e.preventDefault(); scrollToId(id); }}
                            className="ml-3 text-muted-foreground hover:text-foreground text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={`Link to ${id}`}
                          >
                            #
                          </a>
                        )}
                      </span>
                    </h3>
                  );
                },
                h4: ({ node, children }) => {
                  const text = React.Children.toArray(children).map(c => typeof c === 'string' ? c : String((c as any)?.props?.children || '')).join('');
                  const id = slugify(text || '');
                  return (
                    <h4 id={id} className="text-xl font-medium mt-6 mb-3 text-foreground group">
                      <span className="inline-flex items-center">
                        {children}
                        {id && (
                          <a
                            href={`#${id}`}
                            onClick={(e) => { e.preventDefault(); scrollToId(id); }}
                            className="ml-3 text-muted-foreground hover:text-foreground text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                            aria-label={`Link to ${id}`}
                          >
                            #
                          </a>
                        )}
                      </span>
                    </h4>
                  );
                },
                p: ({ node, children }) => (
                  <p className="leading-8 mb-6 text-foreground/90">{children}</p>
                ),
                ul: ({ node, children }) => (
                  <ul className="my-6 ml-6 list-disc space-y-2">{children}</ul>
                ),
                ol: ({ node, children }) => (
                  <ol className="my-6 ml-6 list-decimal space-y-2">{children}</ol>
                ),
                li: ({ node, children }) => (
                  <li className="leading-7 text-foreground/90">{children}</li>
                ),
                a: ({ node, children, href }) => (
                  <a className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors" href={href}>{children}</a>
                ),
                hr: () => (
                  <hr className="my-8 border-border" />
                ),
                strong: ({ node, children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                em: ({ node, children }) => (
                  <em className="italic text-foreground/80">{children}</em>
                ),
                blockquote: ({ node, children }) => (
                  <blockquote className="mt-6 border-l-4 border-primary pl-6 italic text-foreground/80 bg-muted/30 py-4 rounded-r">{children}</blockquote>
                ),
                code: ({ node, children }) => (
                  <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">{children}</code>
                ),
                pre: ({ node, children }) => (
                  <pre className="mb-4 mt-6 overflow-x-auto rounded-lg border bg-muted p-4">{children}</pre>
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
