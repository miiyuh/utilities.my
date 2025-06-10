
"use client";

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { PanelLeft, ShieldCheck } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

export default function PrivacyPolicyPage() {
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
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="md:hidden">
              <PanelLeft />
            </SidebarTrigger>
            <ShieldCheck className="h-5 w-5 md:h-6 md:w-6" />
            <h1 className="text-xl font-semibold font-headline">Privacy Policy</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-2xl mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Privacy Policy</CardTitle>
                <CardDescription>Our commitment to your privacy at utilities.my.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="prose dark:prose-invert max-w-none">
                  <p><strong>Last Updated: {lastUpdated}</strong></p>

                  <h2>1. Introduction</h2>
                  <p>
                    This Privacy Policy explains how utilities.my ("we", "us", or "our")
                    collects, uses, and discloses information about you when you use our
                    application (the "Service").
                  </p>

                  <h2>2. Information We Collect</h2>
                  <p>
                    Currently, utilities.my is designed to operate primarily on the client-side.
                    This means that most data processed by the tools remains within your browser
                    and is not transmitted to our servers.
                  </p>
                  <p>
                    Specifically:
                  </p>
                  <ul>
                    <li>
                      <strong>Theme Preferences:</strong> We use browser local storage to save your
                      preferred theme (light or dark). This information is stored only on your
                      device.
                    </li>
                    <li>
                      <strong>Tool Inputs & Outputs:</strong> Data you enter into tools (e.g., text for
                      the Text Case Converter, JSON for the Formatter) is processed in your
                      browser. We do not store this information on our servers.
                    </li>
                     <li>
                      <strong>Uploaded Files:</strong> For tools like the File Compressor or Color Picker (image upload), files are processed in your browser. They are not uploaded to or stored on our servers.
                    </li>
                  </ul>
                  <p>
                    We do not require user accounts, and we do not collect personal
                    identification information such as your name, email address, or IP address
                    through the standard operation of the tools.
                  </p>

                  <h2>3. How We Use Information</h2>
                  <p>
                    The information stored locally (like theme preference) is used solely to
                    enhance your user experience with the Service.
                  </p>

                  <h2>4. Information Sharing and Disclosure</h2>
                  <p>
                    As we do not collect personal data on our servers through the core tool
                    functionality, we do not share such data with third parties.
                  </p>
                  
                  <h2>5. Data Security</h2>
                  <p>
                    Since data is primarily processed and stored client-side, security largely depends on the security of your own device and browser. We encourage you to use up-to-date browser software.
                  </p>

                  <h2>6. Third-Party Services</h2>
                  <p>
                    The application may include links to third-party websites or services. This Privacy Policy does not apply to such third-party services.
                  </p>

                  <h2>7. Children's Privacy</h2>
                  <p>
                    The Service is not directed to individuals under the age of 13. We do not
                    knowingly collect personal information from children under 13.
                  </p>

                  <h2>8. Changes to This Privacy Policy</h2>
                  <p>
                    We may update this Privacy Policy from time to time. We will notify you of
                    any changes by posting the new Privacy Policy on this page. You are advised
                    to review this Privacy Policy periodically for any changes.
                  </p>

                  <h2>9. Contact Us</h2>
                  <p>
                    If you have any questions about this Privacy Policy, please contact us.
                    (Note: A real contact method would be provided in a production app for utilities.my).
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
