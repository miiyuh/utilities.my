import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Percent, Calculator, TrendingUp, Divide, PlusCircle, MinusCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";

export default function PercentageCalculatorPage() {
  // What is X% of Y?
  const [percentOf, setPercentOf] = useState({ percent: '', value: '', result: '' });
  
  // X is what % of Y?
  const [isWhatPercent, setIsWhatPercent] = useState({ part: '', whole: '', result: '' });
  
  // Percentage increase/decrease
  const [percentChange, setPercentChange] = useState({ original: '', newValue: '', result: '', change: '' });
  
  // Increase/Decrease by percentage
  const [adjustByPercent, setAdjustByPercent] = useState({ value: '', percent: '', increase: '', decrease: '' });

  // UX state
  // Save/history removed — this tool focuses on direct input and immediate results now.


  const copyToClipboard = async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch {}
  };
  // Pure calculation functions
  const calculatePercentOfValue = (percent: string, value: string) => {
    const p = parseFloat(percent);
    const v = parseFloat(value);
    if (!isNaN(p) && !isNaN(v)) {
      return ((p / 100) * v).toFixed(2);
    }
    return '';
  };

  const calculateWhatPercent = (part: string, whole: string) => {
    const pt = parseFloat(part);
    const wh = parseFloat(whole);
    if (!isNaN(pt) && !isNaN(wh) && wh !== 0) {
      return ((pt / wh) * 100).toFixed(2);
    }
    return '';
  };

  const calculatePercentageChange = (original: string, newValue: string) => {
    const orig = parseFloat(original);
    const newVal = parseFloat(newValue);
    if (!isNaN(orig) && !isNaN(newVal) && orig !== 0) {
      const change = newVal - orig;
      const percent = ((change / orig) * 100).toFixed(2);
      return { percent, change: change.toFixed(2) };
    }
    return { percent: '', change: '' };
  };

  const calculateAdjustByPercentValue = (value: string, percent: string) => {
    const val = parseFloat(value);
    const pct = parseFloat(percent);
    if (!isNaN(val) && !isNaN(pct)) {
      const increase = (val + (val * pct / 100)).toFixed(2);
      const decrease = (val - (val * pct / 100)).toFixed(2);
      return { increase, decrease };
    }
    return { increase: '', decrease: '' };
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

            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calculator className="h-5 w-5" />
                      What is X% of Y?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 min-h-[160px] sm:min-h-[180px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 min-w-0">
                        <Label htmlFor="percent-1">Percentage (%)</Label>
                        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                          <Input
                            id="percent-1"
                            type="number"
                            placeholder="e.g., 25"
                            value={percentOf.percent}
                            onChange={(e) => {
                              const newPercent = e.target.value;
                              const result = calculatePercentOfValue(newPercent, percentOf.value);
                              setPercentOf({ ...percentOf, percent: newPercent, result });
                            }}
                            className="h-12 w-full"
                          />

                        </div>

                      </div>
                      <div className="space-y-2 min-w-0">
                        <Label htmlFor="value-1">Of Value</Label>
                        <Input
                          id="value-1"
                          type="number"
                          placeholder="e.g., 200"
                          value={percentOf.value}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            const result = calculatePercentOfValue(percentOf.percent, newValue);
                            setPercentOf({ ...percentOf, value: newValue, result });
                          }}
                          className="h-12 w-full"
                        />

                      </div>
                    </div>

                    {percentOf.result && (
                      <div className="p-6 bg-primary/10 border border-primary/20 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="flex-shrink-0">
                            <div className="text-3xl font-bold text-primary">{Number(parseFloat(percentOf.result)).toLocaleString()}</div>
                          </div>
                          <div className="text-sm text-muted-foreground">{percentOf.percent}% of {percentOf.value}</div>
                          <div className="ml-auto">
                            <Button size="sm" className="h-10" variant="outline" onClick={() => copyToClipboard(`${percentOf.result}`)}><Copy className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </div>
                    )} 
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Divide className="h-5 w-5" />
                      X is what % of Y?
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 min-h-[160px] sm:min-h-[180px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="part">Part (X)</Label>
                        <Input
                          id="part"
                          type="number"
                          placeholder="e.g., 50"
                          value={isWhatPercent.part}
                          onChange={(e) => {
                            const newPart = e.target.value;
                            const result = calculateWhatPercent(newPart, isWhatPercent.whole);
                            setIsWhatPercent({ ...isWhatPercent, part: newPart, result });
                          }}
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
                          onChange={(e) => {
                            const newWhole = e.target.value;
                            const result = calculateWhatPercent(isWhatPercent.part, newWhole);
                            setIsWhatPercent({ ...isWhatPercent, whole: newWhole, result });
                          }}
                          className="h-12"
                        />
                      </div>
                    </div>

                    {isWhatPercent.result && (
                      <div className="p-6 bg-primary/10 border border-primary/20 rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="text-3xl font-bold text-primary">{Number(parseFloat(isWhatPercent.result)).toLocaleString()}%</div>
                          <div className="text-sm text-muted-foreground">{isWhatPercent.part} of {isWhatPercent.whole}</div>
                          <div className="ml-auto">
                            <Button size="sm" className="h-10" variant="outline" onClick={() => copyToClipboard(`${isWhatPercent.result}%`)}><Copy className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Percentage Change
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 min-h-[160px] sm:min-h-[180px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="original">Original Value</Label>
                        <Input
                          id="original"
                          type="number"
                          placeholder="e.g., 100"
                          value={percentChange.original}
                          onChange={(e) => {
                            const newOriginal = e.target.value;
                            const { percent, change } = calculatePercentageChange(newOriginal, percentChange.newValue);
                            setPercentChange({ ...percentChange, original: newOriginal, result: percent, change });
                          }}
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
                          onChange={(e) => {
                            const newNewValue = e.target.value;
                            const { percent, change } = calculatePercentageChange(percentChange.original, newNewValue);
                            setPercentChange({ ...percentChange, newValue: newNewValue, result: percent, change });
                          }}
                          className="h-12"
                        />
                      </div>
                    </div>

                    {percentChange.result && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-primary/10 border border-primary/20 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div>
                              <div className={`text-3xl font-bold ${parseFloat(percentChange.result) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {parseFloat(percentChange.result) >= 0 ? '+' : ''}{Number(parseFloat(percentChange.result)).toLocaleString()}%
                              </div>
                              <div className="text-sm text-muted-foreground">Change</div>
                            </div>
                            <div className="flex-1">
                              <div className="h-3 w-full bg-muted/50 rounded-full overflow-hidden">
                                <div className={`h-full ${parseFloat(percentChange.result) >= 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.abs(Number(percentChange.result)))}%` }} />
                              </div>
                            </div>
                            <div className="ml-auto">
                              <Button size="sm" className="h-10" variant="outline" onClick={() => copyToClipboard(`${percentChange.result}%`)}><Copy className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        </div>
                        <div className="p-6 bg-muted/50 border border-border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="text-3xl font-bold text-foreground">{parseFloat(percentChange.change) >= 0 ? '+' : ''}{percentChange.change}</div>
                              <div className="text-sm text-muted-foreground">Absolute Change</div>
                            </div>
                            <div className="ml-auto">
                              <Button size="sm" className="h-10" variant="outline" onClick={() => copyToClipboard(percentChange.change)}><Copy className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )} 
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PlusCircle className="h-5 w-5" />
                      Increase or Decrease by Percentage
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 min-h-[160px] sm:min-h-[180px]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="base-value">Value</Label>
                        <Input
                          id="base-value"
                          type="number"
                          placeholder="e.g., 100"
                          value={adjustByPercent.value}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            const { increase, decrease } = calculateAdjustByPercentValue(newValue, adjustByPercent.percent);
                            setAdjustByPercent({ ...adjustByPercent, value: newValue, increase, decrease });
                          }}
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
                          onChange={(e) => {
                            const newPercent = e.target.value;
                            const { increase, decrease } = calculateAdjustByPercentValue(adjustByPercent.value, newPercent);
                            setAdjustByPercent({ ...adjustByPercent, percent: newPercent, increase, decrease });
                          }}
                          className="h-12"
                        />
                      </div>
                    </div>

                    {adjustByPercent.increase && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-6 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><PlusCircle className="h-4 w-4" /> Increase by {adjustByPercent.percent}%</div>
                              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{adjustByPercent.increase}</div>
                            </div>
                            <div className="ml-auto">
                              <Button size="sm" className="h-10" variant="outline" onClick={() => copyToClipboard(adjustByPercent.increase)}><Copy className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        </div>
                        <div className="p-6 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="text-sm text-muted-foreground mb-1 flex items-center gap-2"><MinusCircle className="h-4 w-4" /> Decrease by {adjustByPercent.percent}%</div>
                              <div className="text-3xl font-bold text-red-600 dark:text-red-400">{adjustByPercent.decrease}</div>
                            </div>
                            <div className="ml-auto">
                              <Button size="sm" className="h-10" variant="outline" onClick={() => copyToClipboard(adjustByPercent.decrease)}><Copy className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>


          </div>
        </div>
      </SidebarInset>
    </>
  );
}

