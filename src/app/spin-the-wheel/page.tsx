"use client";

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Play, RotateCcw, Trash2, Settings, Plus, Disc3 } from 'lucide-react';
import { Sidebar, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { SpinWheelCanvas } from '@/components/spin-wheel-canvas';

const DEFAULT_ITEMS = [
  "Pizza", "Burgers", "Sushi", "Pasta", "Tacos", "Salad"
];

export default function SpinTheWheelPage() {
  const { toast } = useToast();
  const [itemsInput, setItemsInput] = useState(DEFAULT_ITEMS.join("\n"));
  const [winners, setWinners] = useState<string[]>([]);
  const [removeAfterWin, setRemoveAfterWin] = useState(false);

  const items = itemsInput
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);

  const handleSpin = (winner: string) => {
    // Add winner to history
    setWinners((prev) => [...prev, winner]);
    
    // Show celebration toast
    toast({
      title: "🎉 Winner!",
      description: `${winner} has been selected!`,
      duration: 4000,
    });

    // Remove winner if option is enabled
    if (removeAfterWin) {
      setTimeout(() => {
        setItemsInput((prev) => {
          const arr = prev.split("\n").map((l) => l.trim());
          const index = arr.indexOf(winner);
          if (index > -1) {
            arr.splice(index, 1);
          }
          return arr.join("\n");
        });
      }, 1500); // Delay to allow celebration to finish
    }
  };

  const handleClear = () => {
    setItemsInput('');
    setWinners([]);
  };

  const handleReset = () => {
    setItemsInput(DEFAULT_ITEMS.join("\n"));
    setWinners([]);
  };

  const handleAddItem = () => {
    const newItem = `Item ${items.length + 1}`;
    setItemsInput(prev => prev ? `${prev}\n${newItem}` : newItem);
  };

  return (
    <>
      <Sidebar className="z-50">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <div className="flex h-full flex-col">
          <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
            <div className="flex items-center gap-3">
              <Disc3 className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-semibold font-headline">Spin the Wheel</h1>
            </div>
            <ThemeToggleButton />
          </header>
          
          <div className="flex-1 p-4 lg:p-8">
            <div className="w-full max-w-7xl mx-auto space-y-6">
              {/* Big heading */}
              <div className="mb-8">
                <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">Spin the Wheel</h1>
                <p className="text-lg text-muted-foreground">A fun utility to pick a random item from a list.</p>
              </div>
              
              <div className="space-y-2">
                <p className="text-muted-foreground">Add your choices and spin to randomly select one. Perfect for making decisions!</p>
              </div>
              
              <div className="bg-card rounded-lg border p-6 space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Wheel Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">Wheel</h3>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">
                          {items.length} {items.length === 1 ? 'option' : 'options'}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-center">
                      <SpinWheelCanvas 
                        items={items}
                        onSpin={handleSpin}
                        disabled={items.length < 2}
                      />
                    </div>
                  </div>

                  {/* Controls Section */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="itemsInput">Items (one per line)</Label>
                      <Textarea
                        id="itemsInput"
                        rows={8}
                        value={itemsInput}
                        onChange={(e) => setItemsInput(e.target.value)}
                        className="resize-none font-mono text-sm"
                        placeholder="Enter your options here...&#10;Example:&#10;Pizza&#10;Burgers&#10;Sushi&#10;Pasta"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="flex items-center space-x-2">
                        <input
                          id="removeAfterWin"
                          type="checkbox"
                          checked={removeAfterWin}
                          onChange={(e) => setRemoveAfterWin(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <Label htmlFor="removeAfterWin" className="text-sm cursor-pointer">
                          Remove winners automatically
                        </Label>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddItem}
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Add Item
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Reset
                      </Button>
                    </div>

                    {items.length < 2 && (
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                        <p className="text-sm text-yellow-800 dark:text-yellow-200">
                          Add at least 2 items to spin the wheel.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Winner History */}
                {winners.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Winner History ({winners.length})</h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {winners.map((winner, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300"
                          >
                            #{index + 1} {winner}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClear} className="h-10">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear All
                </Button>
              </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
