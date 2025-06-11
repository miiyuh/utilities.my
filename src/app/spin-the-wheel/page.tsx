
"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PanelLeft, PlayCircle, RotateCcw, Disc3, Gift } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { cn } from "@/lib/utils";

const WHEEL_COLORS = [
  "hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", 
  "hsl(var(--chart-4))", "hsl(var(--chart-5))", "hsl(var(--accent))"
];

const POINTER_SIZE = 20; // Size of the triangular pointer
const TEXT_OFFSET_PERCENTAGE = 0.3; // How far from center text is (30% of radius)

export default function SpinTheWheelPage() {
  const { toast } = useToast();
  const [itemsInput, setItemsInput] = useState('Option 1\nOption 2\nOption 3\nOption 4\nOption 5\nOption 6');
  const [items, setItems] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const wheelRef = useRef<HTMLDivElement>(null);
  const [wheelDiameter, setWheelDiameter] = useState(288); // Default to md size

  useEffect(() => {
    const parsedItems = itemsInput.split('\n').map(item => item.trim()).filter(item => item);
    setItems(parsedItems);
    setResult(null); 
  }, [itemsInput]);

  useEffect(() => {
    if (wheelRef.current) {
      setWheelDiameter(wheelRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (wheelRef.current) {
        setWheelDiameter(wheelRef.current.offsetWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [items]); // Re-check on items change if wheel might resize due to layout shift

  const getConicGradientBackground = () => {
    if (items.length === 0) return 'transparent';
    const segmentAnglePercent = 100 / items.length;
    const colorStops = items.map((_, index) => {
      const color = WHEEL_COLORS[index % WHEEL_COLORS.length];
      const startPercent = segmentAnglePercent * index;
      const endPercent = segmentAnglePercent * (index + 1);
      return `${color} ${startPercent}% ${endPercent}%`;
    });
    return `conic-gradient(${colorStops.join(', ')})`;
  };

  const handleSpin = () => {
    if (items.length < 2) {
      toast({ title: 'Not Enough Items', description: 'Please add at least two items to the wheel.', variant: 'destructive' });
      return;
    }
    setIsSpinning(true);
    setResult(null);

    const randomIndex = Math.floor(Math.random() * items.length);
    const segmentAngle = 360 / items.length;
    
    const baseSpins = Math.floor(Math.random() * 4) + 3; 
    const targetAngle = (baseSpins * 360) - (randomIndex * segmentAngle) - (segmentAngle / 2);
    
    setRotation(prevRotation => prevRotation + targetAngle); // Accumulate rotation for continuous spinning effect

    setTimeout(() => {
      setIsSpinning(false);
      setResult(items[randomIndex]);
      toast({ title: 'And the winner is...', description: items[randomIndex], duration: 3000 });
    }, 4000); 
  };

  const handleReset = () => {
    setItemsInput('Option 1\nOption 2\nOption 3\nOption 4\nOption 5\nOption 6');
    setIsSpinning(false);
    setResult(null);
    setRotation(0); // Reset rotation to initial state
    toast({ title: 'Wheel Reset' });
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
            <h1 className="text-xl font-semibold font-headline">Spin the Wheel</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 md:p-6">
          <div className="flex flex-1 items-center justify-center">
            <Card className="w-full max-w-2xl mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl font-headline">Spin the Wheel</CardTitle>
                <CardDescription>Enter items for the wheel, one per line. Click "Spin" to randomly select an item. Fun for making decisions or giveaways!</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="itemsInput">Wheel Items (one per line)</Label>
                  <Textarea
                    id="itemsInput"
                    value={itemsInput}
                    onChange={(e) => setItemsInput(e.target.value)}
                    placeholder="Enter items here, one per line..."
                    rows={6}
                    className="resize-none"
                    disabled={isSpinning}
                  />
                </div>

                <div className="relative flex flex-col items-center justify-center my-8 min-h-[300px] md:min-h-[350px]">
                    <div 
                        className="absolute top-[-10px] left-1/2 -translate-x-1/2 z-20"
                        style={{
                            width: 0, height: 0,
                            borderLeft: `${POINTER_SIZE / 2}px solid transparent`,
                            borderRight: `${POINTER_SIZE / 2}px solid transparent`,
                            borderTop: `${POINTER_SIZE}px solid hsl(var(--primary))`,
                        }}
                        aria-hidden="true"
                    />
                    <div
                        ref={wheelRef}
                        className={cn(
                            "relative w-64 h-64 md:w-72 md:h-72 rounded-full border-4 border-primary overflow-hidden shadow-2xl",
                            "transition-transform duration-[4000ms] ease-out" 
                        )}
                        style={{ 
                          transform: `rotate(${rotation}deg)`,
                          background: getConicGradientBackground(),
                        }}
                    >
                        {items.length > 0 && items.map((item, index) => {
                          const anglePerSegment = 360 / items.length;
                          const segmentMidAngle = anglePerSegment * index + anglePerSegment / 2;
                          const textRadius = wheelDiameter * TEXT_OFFSET_PERCENTAGE;

                          return (
                            <div
                              key={index}
                              className="absolute top-1/2 left-1/2 pointer-events-none"
                              style={{
                                transform: `rotate(${segmentMidAngle}deg) translate(0, -${textRadius}px) rotate(-${segmentMidAngle}deg)`,
                                width: `${anglePerSegment < 45 ? wheelDiameter * 0.25 : wheelDiameter * 0.35}px`, // Adjust width based on segment size
                              }}
                            >
                              <span className="text-xs md:text-sm font-semibold text-primary-foreground/90 select-none truncate px-1 text-center block">
                                {item}
                              </span>
                            </div>
                          );
                        })}
                        <div className="absolute top-1/2 left-1/2 w-10 h-10 md:w-12 md:h-12 bg-background border-2 border-primary rounded-full -translate-x-1/2 -translate-y-1/2 flex items-center justify-center z-10">
                            <Disc3 className="h-5 w-5 md:h-6 md:w-6 text-primary opacity-70"/>
                        </div>
                    </div>
                </div>

                {result && !isSpinning && (
                  <div className="text-center p-4 bg-accent/20 border border-accent rounded-md">
                    <h3 className="text-lg font-semibold text-accent-foreground">The Winner Is:</h3>
                    <p className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
                        <Gift className="h-6 w-6"/>
                        {result}
                    </p>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex flex-col sm:flex-row justify-between gap-2">
                <Button onClick={handleSpin} disabled={isSpinning || items.length < 2} className="w-full sm:w-auto">
                  <PlayCircle className="mr-2 h-4 w-4" /> {isSpinning ? 'Spinning...' : 'Spin the Wheel!'}
                </Button>
                <Button variant="outline" onClick={handleReset} disabled={isSpinning} className="w-full sm:w-auto">
                  <RotateCcw className="mr-2 h-4 w-4" /> Reset Wheel
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
