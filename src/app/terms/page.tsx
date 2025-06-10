
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { PanelLeft } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

export default function TermsOfServicePage() {
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
            <h1 className="text-xl font-semibold font-headline">Terms of Service</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-2xl mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Terms of Service</CardTitle>
                <CardDescription>Please read these terms carefully.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose dark:prose-invert max-w-none">
                  <p><strong>Last Updated: {new Date().toLocaleDateString()}</strong></p>

                  <h2>1. Acceptance of Terms</h2>
                  <p>
                    By accessing or using the UtilityBelt application (the "Service"), you agree to
                    be bound by these Terms of Service ("Terms"). If you disagree with any part of
                    the terms, then you may not access the Service.
                  </p>

                  <h2>2. Use of the Service</h2>
                  <p>
                    UtilityBelt provides a collection of online utility tools. You agree to use
                    these tools for their intended purposes and in a lawful manner.
                  </p>
                  <p>
                    You are solely responsible for any data you input into the Service. Since many
                    tools operate client-side, data is processed within your browser and not
                    typically stored on our servers. However, you should not input sensitive
                    personal information or confidential data into any online tool without
                    understanding its data handling practices.
                  </p>

                  <h2>3. Intellectual Property</h2>
                  <p>
                    The Service and its original content (excluding content provided by users),
                    features, and functionality are and will remain the exclusive property of
                    UtilityBelt and its licensors. The Service is protected by copyright,
                    trademark, and other laws.
                  </p>

                  <h2>4. Disclaimer of Warranties</h2>
                  <p>
                    The Service is provided on an "AS IS" and "AS AVAILABLE" basis. UtilityBelt
                    makes no warranties, expressed or implied, and hereby disclaims and negates
                    all other warranties including, without limitation, implied warranties or
                    conditions of merchantability, fitness for a particular purpose, or
                    non-infringement of intellectual property or other violation of rights.
                  </p>
                  <p>
                    Further, UtilityBelt does not warrant or make any representations concerning
                    the accuracy, likely results, or reliability of the use of the materials on
                    its Service or otherwise relating to such materials or on any sites linked
                    to this site.
                  </p>

                  <h2>5. Limitation of Liability</h2>
                  <p>
                    In no event shall UtilityBelt or its suppliers be liable for any damages
                    (including, without limitation, damages for loss of data or profit, or due
                    to business interruption) arising out of the use or inability to use the
                    materials on UtilityBelt's Service, even if UtilityBelt or a UtilityBelt
                    authorized representative has been notified orally or in writing of the
                    possibility of such damage.
                  </p>

                  <h2>6. Modifications to Terms</h2>
                  <p>
                    UtilityBelt reserves the right, at its sole discretion, to modify or replace
                    these Terms at any time. We will try to provide at least 30 days' notice
                    prior to any new terms taking effect. What constitutes a material change will
                    be determined at our sole discretion.
                  </p>
                  <p>
                    By continuing to access or use our Service after those revisions become
                    effective, you agree to be bound by the revised terms.
                  </p>

                  <h2>7. Governing Law</h2>
                  <p>
                    These Terms shall be governed and construed in accordance with the laws of
                    [Your Jurisdiction - placeholder], without regard to its conflict of law provisions.
                  </p>

                  <h2>8. Contact Us</h2>
                  <p>
                    If you have any questions about these Terms, please contact us.
                    (Note: A real contact method would be provided in a production app).
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
