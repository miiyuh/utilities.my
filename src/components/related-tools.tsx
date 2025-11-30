'use client';

import Link from 'next/link';
import { tools } from '@/lib/tools';
import { ArrowRight } from 'lucide-react';

interface RelatedToolsProps {
  currentPath: string;
  maxItems?: number;
}

export function RelatedTools({ currentPath, maxItems = 4 }: RelatedToolsProps) {
  // Get related tools (exclude current and home)
  const relatedTools = tools
    .filter(tool => tool.path !== currentPath && tool.path !== '/')
    .slice(0, maxItems);

  if (relatedTools.length === 0) return null;

  return (
    <div className="mt-12 pt-8 border-t">
      <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <ArrowRight className="h-5 w-5 text-primary" />
        Explore More Tools
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {relatedTools.map((tool) => (
          <Link
            key={tool.path}
            href={tool.path}
            className="group p-4 rounded-lg border bg-card hover:bg-accent/50 transition-all duration-200 hover:shadow-md"
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                <tool.icon className="h-4 w-4" />
              </div>
              <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                {tool.name}
              </span>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {tool.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
