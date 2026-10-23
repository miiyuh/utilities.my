import React from 'react';
import type { Icon } from '@phosphor-icons/react';
import { Sidebar, SidebarInset } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { PageHeader } from "@/components/page-header";
import { MarkdownView } from './markdown-view';

interface MarkdownPageProps {
  icon: Icon;
  title: string;
  content: string;
}

export function MarkdownPage({ icon: Icon, title, content }: MarkdownPageProps) {
  return (
    <>
      <Sidebar collapsible="icon" variant="inset" side="left">
        <SidebarContent />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={Icon} title={title} />
        <MarkdownView content={content} />
      </SidebarInset>
    </>
  );
}
