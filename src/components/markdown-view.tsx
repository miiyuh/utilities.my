"use client";

import React from 'react';
import { Card } from './ui/card';
import { marked } from 'marked';

interface MarkdownViewProps {
  markdown: string;
  lastUpdated?: string;
}

marked.setOptions({
  gfm: true,
  breaks: true,
});

export function MarkdownView({ markdown, lastUpdated }: MarkdownViewProps) {
  const htmlContent = React.useMemo(() => {
    // marked() can be typed as string | Promise<string> in some versions; assert string here
    return marked(markdown) as string;
  }, [markdown]);

  return (
    <Card className="p-6">
      {lastUpdated && (
        <p className="text-sm text-muted-foreground mb-6">
          <strong>Last Updated: {lastUpdated}</strong>
        </p>
      )}
      <div 
        className="prose dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </Card>
  );
}
