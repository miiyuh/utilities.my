"use client";

import React from 'react';
import type { Icon } from 'phosphor-react';
import { Sidebar, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { PageHeader } from "@/components/page-header";
import { MarkdownView } from './markdown-view';

interface MarkdownPageProps {
  icon: Icon;
  title: string;
  content: string;
}

export function MarkdownPage({ icon: Icon, title, content }: MarkdownPageProps) {
  const [lastUpdated, setLastUpdated] = React.useState('');

  React.useEffect(() => {
    setLastUpdated(new Date().toLocaleDateString());
  }, []);

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={Icon} title={title} />
        <MarkdownView content={content} lastUpdated={lastUpdated} />
      </SidebarInset>
    </>
  );
}
