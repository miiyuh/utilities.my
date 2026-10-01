import { ClearButton } from '@/components/ui/clear-button';
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { NumberInput } from '@/components/ui/number-input';
import { Label } from '@/components/ui/label';
import { Percent, Calculator, TrendUp, TrendDown, Divide, PlusCircle, MinusCircle, ArrowCounterClockwise } from 'phosphor-react';
import { CopyButton } from '@/components/ui/copy-button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sidebar, SidebarInset, SidebarRail } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { PageHeader } from "@/components/page-header";
import { ToolMethodology } from '@/components/tool-methodology';
import { cn } from '@/lib/utils';
import { useToolSettings } from '@/hooks/use-tool-settings';
import { groupDigits } from '@/lib/format';

const QUICK_PERCENTS = [5, 10, 15, 20, 25, 50];


export default function PercentageCalculatorPage() {
  const { formatNumber, numberFormat } = useToolSettings();
  const fmt = (n: number) => formatNumber(n, 2);
  // Echo raw inputs back with the same grouping the fields use.
  const g = (raw: string) => groupDigits(raw, numberFormat);
  // What is X% of Y?
  const [percentOf, setPercentOf] = useState({ percent: '', value: '' });

  // X is what % of Y?
  const [isWhatPercent, setIsWhatPercent] = useState({ part: '', whole: '' });

  // Percentage increase/decrease
  const [percentChange, setPercentChange] = useState({ original: '', newValue: '' });

  // Increase/Decrease by percentage
  const [adjustByPercent, setAdjustByPercent] = useState({ value: '', percent: '' });

  const percentOfResult = React.useMemo(() => {
    const p = parseFloat(percentOf.percent);
    const v = parseFloat(percentOf.value);
    if (isNaN(p) || isNaN(v)) return NaN;
    return (p / 100) * v;
  }, [percentOf]);

  const whatPercentResult = React.useMemo(() => {
    const pt = parseFloat(isWhatPercent.part);
    const wh = parseFloat(isWhatPercent.whole);
    if (isNaN(pt) || isNaN(wh) || wh === 0) return NaN;
    return (pt / wh) * 100;
  }, [isWhatPercent]);

  const changeResult = React.useMemo(() => {
    const orig = parseFloat(percentChange.original);
    const newVal = parseFloat(percentChange.newValue);
    if (isNaN(orig) || isNaN(newVal) || orig === 0) return null;
    const change = newVal - orig;
    return { percent: (change / orig) * 100, change };
  }, [percentChange]);

  const adjustResult = React.useMemo(() => {
    const val = parseFloat(adjustByPercent.value);
    const pct = parseFloat(adjustByPercent.percent);
    if (isNaN(val) || isNaN(pct)) return null;
    return { increase: val + (val * pct) / 100, decrease: val - (val * pct) / 100 };
  }, [adjustByPercent]);

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={Percent} title="Percentage Calculator" />

        <div className="flex flex-1 flex-col px-4 p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-8">
            <div className="mb-8 max-sm:sr-only">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">
                Percentage Calculator
              </h1>
              <p className="text-lg text-muted-foreground max-w-3xl">
                Pick the calculation that matches your question, results update as you type, in plain language.
              </p>
            </div>

            <Card className="w-full shadow-sm">
              <CardContent>
                <Tabs defaultValue="percent-of" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
                    <TabsTrigger value="percent-of" className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      <span className="hidden sm:inline">% of a number</span>
                      <span className="sm:hidden">% of</span>
                    </TabsTrigger>
                    <TabsTrigger value="what-percent" className="flex items-center gap-2">
                      <Divide className="h-4 w-4" />
                      <span className="hidden sm:inline">X is what %</span>
                      <span className="sm:hidden">X is %</span>
                    </TabsTrigger>
                    <TabsTrigger value="change" className="flex items-center gap-2">
                      <TrendUp className="h-4 w-4" />
                      <span className="hidden sm:inline">% change</span>
                      <span className="sm:hidden">Change</span>
                    </TabsTrigger>
                    <TabsTrigger value="adjust" className="flex items-center gap-2">
                      <PlusCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Adjust by %</span>
                      <span className="sm:hidden">Adjust</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Tab 1: What is X% of Y? */}
                  <TabsContent value="percent-of" className="mt-6 space-y-5">
                    <p className="text-sm text-muted-foreground">Find how much a percentage is worth of a number. Useful for tips, discounts, and splits.</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="percent-1" className="mb-1.5 block">Percentage (%)</Label>
                        <NumberInput
                          id="percent-1"
                          placeholder="e.g., 25"
                          value={percentOf.percent}
                          onValueChange={(v) => setPercentOf({ ...percentOf, percent: v })}
                        />
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {QUICK_PERCENTS.map((q) => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => setPercentOf({ ...percentOf, percent: String(q) })}
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-xs transition-colors duration-quick",
                                percentOf.percent === String(q) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                              )}
                            >
                              {q}%
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="value-1" className="mb-1.5 block">Of Value</Label>
                        <NumberInput
                          id="value-1"
                          placeholder="e.g., 200"
                          value={percentOf.value}
                          onValueChange={(v) => setPercentOf({ ...percentOf, value: v })}
                        />
                      </div>
                    </div>

                    {Number.isFinite(percentOfResult) && (
                      <div className="p-5 bg-muted/40 border border-border rounded-2xl animate-in fade-in-0 duration-quick ease-smooth-out">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="text-3xl font-bold text-primary tabular-nums">{fmt(percentOfResult)}</div>
                          <div className="text-sm text-muted-foreground">
                            {g(percentOf.percent)}% of {g(percentOf.value)} is <span className="font-medium text-foreground">{fmt(percentOfResult)}</span>
                          </div>
                          <div className="ml-auto">
                            <CopyButton size="sm" value={fmt(percentOfResult)} />
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab 2: X is what % of Y? */}
                  <TabsContent value="what-percent" className="mt-6 space-y-5">
                    <p className="text-sm text-muted-foreground">Find what percentage one number is of another. Useful for scores, quotas, and progress.</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="part" className="mb-1.5 block">Part (X)</Label>
                        <NumberInput
                          id="part"
                          placeholder="e.g., 50"
                          value={isWhatPercent.part}
                          onValueChange={(v) => setIsWhatPercent({ ...isWhatPercent, part: v })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="whole" className="mb-1.5 block">Whole (Y)</Label>
                        <NumberInput
                          id="whole"
                          placeholder="e.g., 200"
                          value={isWhatPercent.whole}
                          onValueChange={(v) => setIsWhatPercent({ ...isWhatPercent, whole: v })}
                        />
                      </div>
                    </div>

                    {Number.isFinite(whatPercentResult) && (
                      <div className="p-5 bg-muted/40 border border-border rounded-2xl animate-in fade-in-0 duration-quick ease-smooth-out">
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="text-3xl font-bold text-primary tabular-nums">{fmt(whatPercentResult)}%</div>
                          <div className="text-sm text-muted-foreground">
                            {g(isWhatPercent.part)} is <span className="font-medium text-foreground">{fmt(whatPercentResult)}%</span> of {isWhatPercent.whole}
                          </div>
                          <div className="ml-auto">
                            <CopyButton size="sm" value={`${fmt(whatPercentResult)}%`} />
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab 3: Percentage Change */}
                  <TabsContent value="change" className="mt-6 space-y-5">
                    <p className="text-sm text-muted-foreground">Find how much a value grew or shrank, in relative and absolute terms.</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="original" className="mb-1.5 block">Original Value</Label>
                        <NumberInput
                          id="original"
                          placeholder="e.g., 100"
                          value={percentChange.original}
                          onValueChange={(v) => setPercentChange({ ...percentChange, original: v })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="new-value" className="mb-1.5 block">New Value</Label>
                        <NumberInput
                          id="new-value"
                          placeholder="e.g., 150"
                          value={percentChange.newValue}
                          onValueChange={(v) => setPercentChange({ ...percentChange, newValue: v })}
                        />
                      </div>
                    </div>

                    {changeResult && (
                      <div className="p-5 bg-muted/40 border border-border rounded-2xl animate-in fade-in-0 duration-quick ease-smooth-out">
                        <div className="flex flex-wrap items-center gap-4">
                          {changeResult.percent >= 0 ? (
                            <TrendUp className="h-6 w-6 text-green-500 shrink-0" />
                          ) : (
                            <TrendDown className="h-6 w-6 text-red-500 shrink-0" />
                          )}
                          <div className={cn("text-3xl font-bold tabular-nums", changeResult.percent >= 0 ? "text-green-500" : "text-red-500")}>
                            {changeResult.percent >= 0 ? '+' : ''}{fmt(changeResult.percent)}%
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {g(percentChange.original)} → {g(percentChange.newValue)} is a change of{' '}
                            <span className="font-medium text-foreground">{changeResult.change >= 0 ? '+' : ''}{fmt(changeResult.change)}</span>
                            {' '}({changeResult.percent >= 0 ? '+' : ''}{fmt(changeResult.percent)}%)
                          </div>
                          <div className="ml-auto">
                            <CopyButton size="sm" value={`${changeResult.percent >= 0 ? '+' : ''}${fmt(changeResult.percent)}%`} />
                          </div>
                        </div>
                        <div className="mt-4 h-2 w-full bg-background rounded-full overflow-hidden">
                          <div
                            className={cn("h-full transition-all duration-medium ease-smooth-out", changeResult.percent >= 0 ? "bg-green-500" : "bg-red-500")}
                            style={{ width: `${Math.min(100, Math.abs(changeResult.percent))}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* Tab 4: Increase/Decrease by percentage */}
                  <TabsContent value="adjust" className="mt-6 space-y-5">
                    <p className="text-sm text-muted-foreground">Apply a percentage increase or decrease to a value at once, side by side.</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="base-value" className="mb-1.5 block">Value</Label>
                        <NumberInput
                          id="base-value"
                          placeholder="e.g., 100"
                          value={adjustByPercent.value}
                          onValueChange={(v) => setAdjustByPercent({ ...adjustByPercent, value: v })}
                        />
                      </div>
                      <div>
                        <Label htmlFor="adjust-percent" className="mb-1.5 block">Percentage (%)</Label>
                        <NumberInput
                          id="adjust-percent"
                          placeholder="e.g., 20"
                          value={adjustByPercent.percent}
                          onValueChange={(v) => setAdjustByPercent({ ...adjustByPercent, percent: v })}
                        />
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {QUICK_PERCENTS.map((q) => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => setAdjustByPercent({ ...adjustByPercent, percent: String(q) })}
                              className={cn(
                                "rounded-full border px-2.5 py-1 text-xs transition-colors duration-quick",
                                adjustByPercent.percent === String(q) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted/50"
                              )}
                            >
                              {q}%
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {adjustResult && (
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="p-5 bg-muted/40 border border-border rounded-2xl animate-in fade-in-0 duration-quick ease-smooth-out">
                          <div className="flex items-center gap-3">
                            <PlusCircle className="h-5 w-5 text-green-500 shrink-0" />
                            <div>
                              <div className="text-xs text-muted-foreground mb-0.5">Increase by {adjustByPercent.percent}%</div>
                              <div className="text-2xl font-bold text-green-500 tabular-nums">{fmt(adjustResult.increase)}</div>
                            </div>
                            <div className="ml-auto">
                              <CopyButton size="sm" value={fmt(adjustResult.increase)} />
                            </div>
                          </div>
                        </div>
                        <div className="p-5 bg-muted/40 border border-border rounded-2xl animate-in fade-in-0 duration-quick ease-smooth-out">
                          <div className="flex items-center gap-3">
                            <MinusCircle className="h-5 w-5 text-red-500 shrink-0" />
                            <div>
                              <div className="text-xs text-muted-foreground mb-0.5">Decrease by {adjustByPercent.percent}%</div>
                              <div className="text-2xl font-bold text-red-500 tabular-nums">{fmt(adjustResult.decrease)}</div>
                            </div>
                            <div className="ml-auto">
                              <CopyButton size="sm" value={fmt(adjustResult.decrease)} />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <ClearButton
                onClear={() => {
                  setPercentOf({ percent: '', value: '' });
                  setIsWhatPercent({ part: '', whole: '' });
                  setPercentChange({ original: '', newValue: '' });
                  setAdjustByPercent({ value: '', percent: '' });
                }}
                hasContent={[percentOf, isWhatPercent, percentChange, adjustByPercent].some((o) => Object.values(o).some(Boolean))}
                label="Reset all"
                icon={ArrowCounterClockwise}
                className="h-8"
                confirmTitle="Reset all calculators?"
                confirmDescription="This clears every number you entered on all four tabs."
              />
            </div>
          </div>
        </div>
        <ToolMethodology />
      </SidebarInset>
    </>
  );
}
