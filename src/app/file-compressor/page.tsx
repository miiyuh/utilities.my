
"use client";

import React, { useState, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PanelLeft, UploadCloud, FileArchiveIcon, XCircle } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import JSZip from 'jszip';

export default function FileCompressorPage() {
  const { toast } = useToast();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedFiles(event.target.files);
  };

  const handleCompress = async () => {
    if (!selectedFiles || selectedFiles.length === 0) {
      toast({ title: 'No Files Selected', description: 'Please select files to compress.', variant: 'destructive' });
      return;
    }

    const zip = new JSZip();
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      zip.file(file.name, file);
    }

    try {
      const zipBlob = await zip.generateAsync({ type: 'blob', compression: "DEFLATE", compressionOptions: {level: 9} });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(zipBlob);
      link.download = 'compressed_files.zip';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      toast({ title: 'Compression Successful', description: 'compressed_files.zip has been downloaded.' });
      setSelectedFiles(null);
      if(fileInputRef.current) fileInputRef.current.value = "";

    } catch (error) {
      toast({ title: 'Compression Failed', description: String(error), variant: 'destructive' });
    }
  };

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
            <h1 className="text-xl font-semibold font-headline">File Compressor (ZIP)</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-lg mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">File Compressor (ZIP)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="fileUploadButton">Select Files</Label>
                  <Input
                    id="fileUpload"
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden" // Changed from pt-2 to hidden
                  />
                   <Button 
                    id="fileUploadButton"
                    variant="outline" 
                    className="w-full" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <UploadCloud className="mr-2 h-4 w-4" /> Choose Files
                  </Button>
                </div>

                {selectedFiles && selectedFiles.length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <h3 className="font-medium">Selected Files: {selectedFiles.length}</h3>
                    <ul className="max-h-40 overflow-y-auto space-y-1 text-sm bg-muted/30 p-2 rounded-md border">
                      {Array.from(selectedFiles).map((file, index) => (
                        <li key={index} className="truncate p-1">
                          {file.name} <span className="text-xs text-muted-foreground">({(file.size / 1024).toFixed(2)} KB)</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive px-2 py-1"
                      onClick={() => {
                        setSelectedFiles(null);
                        if(fileInputRef.current) fileInputRef.current.value = "";
                      }}
                    >
                      <XCircle className="mr-1 h-3.5 w-3.5" /> Clear Selection
                    </Button>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button onClick={handleCompress} disabled={!selectedFiles || selectedFiles.length === 0} className="w-full">
                  <FileArchiveIcon className="mr-2 h-4 w-4" /> Compress & Download ZIP
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
