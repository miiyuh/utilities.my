"use client";

import React from 'react';
import { Card } from './ui/card';

interface MarkdownContentProps {
  content: string;
  lastUpdated?: string;
}

export function MarkdownContent({ content, lastUpdated }: MarkdownContentProps) {
  return (
    <Card className="p-6">
      {lastUpdated && (
        <p className="text-sm text-muted-foreground mb-6">
          <strong>Last Updated: {lastUpdated}</strong>
        </p>
      )}
      <div className="prose dark:prose-invert max-w-none markdown-content whitespace-pre-wrap">
        {content}
      </div>
    </Card>
  );
}
