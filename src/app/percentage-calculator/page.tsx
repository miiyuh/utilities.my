"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Percent, Calculator, TrendingUp, TrendingDown, Divide, PlusCircle, MinusCircle } from 'lucide-react';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PercentageCalculatorPage() {
  // What is X% of Y?
  const [percentOf, setPercentOf] = useState({ percent: '', value: '', result: '' });
  
  // X is what % of Y?
  const [isWhatPercent, setIsWhatPercent] = useState({ part: '', whole: '', result: '' });
  
  // Percentage increase/decrease
  const [percentChange, setPercentChange] = useState({ original: '', newValue: '', result: '', change: '' });
  
  // Increase/Decrease by percentage
  const [adjustByPercent, setAdjustByPercent] = useState({ value: '', percent: '', increase: '', decrease: '' });

  const calculatePercentOf = () => {
    const p = parseFloat(percentOf.percent);
    const v = parseFloat(percentOf.value);
    if (!isNaN(p) && !isNaN(v)) {
      const result = (p / 100) * v;
      setPercentOf({ ...percentOf, result: result.toFixed(2) });
    }
  };

  const calculateIsWhatPercent = () => {
    const part = parseFloat(isWhatPercent.part);
    const whole = parseFloat(isWhatPercent.whole);
    if (!isNaN(part) && !isNaN(whole) && whole !== 0) {
      const result = (part / whole) * 100;
      setIsWhatPercent({ ...isWhatPercent, result: result.toFixed(2) });
    }
  };

  const calculatePercentChange = () => {
    const orig = parseFloat(percentChange.original);
    const newVal = parseFloat(percentChange.newValue);
    if (!isNaN(orig) && !isNaN(newVal) && orig !== 0) {
      const change = newVal - orig;
      const percent = ((change / orig) * 100);
      setPercentChange({ 
        ...percentChange, 
        change: change.toFixed(2),
        result: percent.toFixed(2)
      });
    }
  };

  const calculateAdjustByPercent = () => {
    const val = parseFloat(adjustByPercent.value);
    const pct = parseFloat(adjustByPercent.percent);
    if (!isNaN(val) && !isNaN(pct)) {
      const increase = val + (val * pct / 100);
      const decrease = val - (val * pct / 100);
      setAdjustByPercent({ 
        ...adjustByPercent, 
        increase: increase.toFixed(2),
        decrease: decrease.toFixed(2)
      });
    }
  };

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 md:px-6 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="lg:hidden" />
            <Percent className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold font-headline">Percentage Calculator</h1>
          </div>
          <ThemeToggleButton />
        </header>

        <div className="flex flex-1 flex-col p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8">
            {/* Big heading */}
            <div className="mb-8">
              <h1 className="text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">
                Percentage Calculator
              </h1>
              <p className="text-lg text-muted-foreground">
                Calculate percentages, percentage changes, increases, and decreases with ease.
              </p>
            </div>

            <Tabs defaultValue="percent-of" className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 h-auto">
                <TabsTrigger value="percent-of" className="text-xs sm:text-sm py-2">
                  <Calculator className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">What is</span> X% of Y
                </TabsTrigger>
                <TabsTrigger value="is-what-percent" className="text-xs sm:text-sm py-2">
                  <Divide className="h-4 w-4 mr-1 sm:mr-2" />
                  X is what <span className="hidden sm:inline">%</span> of Y
                </TabsTrigger>
                <TabsTrigger value="percent-change" className="text-xs sm:text-sm py-2">
                  <TrendingUp className="h-4 w-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Percent</span> Change
                </TabsTrigger>
                <TabsTrigger value="adjust-by-percent" className="text-xs sm:text-sm py-2">
                  <PlusCircle className="h-4 w-4 mr-1 sm:mr-2" />
                  Increase/Decrease
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: What is X% of Y? */}
              <TabsContent value="percent-of">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      What is X% of Y?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="percent-1">Percentage (%)</Label>
                        <Input
                          id="percent-1"
                          type="number"
                          placeholder="e.g., 25"
                          value={percentOf.percent}
                          onChange={(e) => setPercentOf({ ...percentOf, percent: e.target.value })}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="value-1">Of Value</Label>
                        <Input
                          id="value-1"
                          type="number"
                          placeholder="e.g., 200"
                          value={percentOf.value}
                          onChange={(e) => setPercentOf({ ...percentOf, value: e.target.value })}
                          className="h-12"
                        />
                      </div>
                    </div>
                    
                    <Button onClick={calculatePercentOf} className="w-full h-12" size="lg">
                      <Calculator className="h-5 w-5 mr-2" />
                      Calculate
                    </Button>

                    {percentOf.result && (
                      <div className="p-6 bg-primary/10 border border-primary/20 rounded-lg text-center">
                        <div className="text-sm text-muted-foreground mb-2">Result:</div>
                        <div className="text-3xl font-bold text-primary">
                          {percentOf.result}
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          {percentOf.percent}% of {percentOf.value} is {percentOf.result}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 2: X is what % of Y? */}
              <TabsContent value="is-what-percent">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Divide className="h-5 w-5" />
                      X is what % of Y?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="part">Part (X)</Label>
                        <Input
                          id="part"
                          type="number"
                          placeholder="e.g., 50"
                          value={isWhatPercent.part}
                          onChange={(e) => setIsWhatPercent({ ...isWhatPercent, part: e.target.value })}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="whole">Whole (Y)</Label>
                        <Input
                          id="whole"
                          type="number"
                          placeholder="e.g., 200"
                          value={isWhatPercent.whole}
                          onChange={(e) => setIsWhatPercent({ ...isWhatPercent, whole: e.target.value })}
                          className="h-12"
                        />
                      </div>
                    </div>
                    
                    <Button onClick={calculateIsWhatPercent} className="w-full h-12" size="lg">
                      <Calculator className="h-5 w-5 mr-2" />
                      Calculate
                    </Button>

                    {isWhatPercent.result && (
                      <div className="p-6 bg-primary/10 border border-primary/20 rounded-lg text-center">
                        <div className="text-sm text-muted-foreground mb-2">Result:</div>
                        <div className="text-3xl font-bold text-primary">
                          {isWhatPercent.result}%
                        </div>
                        <div className="text-sm text-muted-foreground mt-2">
                          {isWhatPercent.part} is {isWhatPercent.result}% of {isWhatPercent.whole}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 3: Percentage Change */}
              <TabsContent value="percent-change">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Percentage Change
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="original">Original Value</Label>
                        <Input
                          id="original"
                          type="number"
                          placeholder="e.g., 100"
                          value={percentChange.original}
                          onChange={(e) => setPercentChange({ ...percentChange, original: e.target.value })}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="new-value">New Value</Label>
                        <Input
                          id="new-value"
                          type="number"
                          placeholder="e.g., 150"
                          value={percentChange.newValue}
                          onChange={(e) => setPercentChange({ ...percentChange, newValue: e.target.value })}
                          className="h-12"
                        />
                      </div>
                    </div>
                    
                    <Button onClick={calculatePercentChange} className="w-full h-12" size="lg">
                      <Calculator className="h-5 w-5 mr-2" />
                      Calculate
                    </Button>

                    {percentChange.result && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-primary/10 border border-primary/20 rounded-lg text-center">
                          <div className="text-sm text-muted-foreground mb-2">Percentage Change:</div>
                          <div className={`text-3xl font-bold ${parseFloat(percentChange.result) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {parseFloat(percentChange.result) >= 0 ? '+' : ''}{percentChange.result}%
                          </div>
                          {parseFloat(percentChange.result) >= 0 ? (
                            <TrendingUp className="h-6 w-6 mx-auto mt-2 text-green-600 dark:text-green-400" />
                          ) : (
                            <TrendingDown className="h-6 w-6 mx-auto mt-2 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                        <div className="p-6 bg-muted/50 border border-border rounded-lg text-center">
                          <div className="text-sm text-muted-foreground mb-2">Absolute Change:</div>
                          <div className="text-3xl font-bold text-foreground">
                            {parseFloat(percentChange.change) >= 0 ? '+' : ''}{percentChange.change}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Tab 4: Increase/Decrease by Percentage */}
              <TabsContent value="adjust-by-percent">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PlusCircle className="h-5 w-5" />
                      Increase or Decrease by Percentage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="base-value">Value</Label>
                        <Input
                          id="base-value"
                          type="number"
                          placeholder="e.g., 100"
                          value={adjustByPercent.value}
                          onChange={(e) => setAdjustByPercent({ ...adjustByPercent, value: e.target.value })}
                          className="h-12"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="adjust-percent">Percentage (%)</Label>
                        <Input
                          id="adjust-percent"
                          type="number"
                          placeholder="e.g., 20"
                          value={adjustByPercent.percent}
                          onChange={(e) => setAdjustByPercent({ ...adjustByPercent, percent: e.target.value })}
                          className="h-12"
                        />
                      </div>
                    </div>
                    
                    <Button onClick={calculateAdjustByPercent} className="w-full h-12" size="lg">
                      <Calculator className="h-5 w-5 mr-2" />
                      Calculate
                    </Button>

                    {adjustByPercent.increase && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg text-center">
                          <div className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-2">
                            <PlusCircle className="h-4 w-4" />
                            Increase by {adjustByPercent.percent}%:
                          </div>
                          <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                            {adjustByPercent.increase}
                          </div>
                        </div>
                        <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
                          <div className="text-sm text-muted-foreground mb-2 flex items-center justify-center gap-2">
                            <MinusCircle className="h-4 w-4" />
                            Decrease by {adjustByPercent.percent}%:
                          </div>
                          <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                            {adjustByPercent.decrease}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
