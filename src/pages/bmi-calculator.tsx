import React from "react";
import { Helmet } from 'react-helmet-async';
import { Sidebar, SidebarInset, SidebarRail, SidebarTrigger } from "@/components/ui/sidebar";
import { SidebarContent } from "@/components/sidebar-content";
import { ThemeToggleButton } from "@/components/theme-toggle-button";
import { Activity, Ruler, Dumbbell, Sparkles, Info, ArrowDown, Heart, TrendingUp, AlertTriangle, RotateCcw, Copy, Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useSettings } from "@/contexts/settings-context";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from '@/hooks/use-toast';

type UnitSystem = "metric" | "imperial";

function clamp(num: number, min: number, max: number) {
  return Math.min(max, Math.max(min, num));
}

function classifyBMI(bmi: number) {
  if (!isFinite(bmi) || bmi <= 0) return { label: "—", color: "", hint: "Enter height and weight", icon: null };
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-500", hint: "Below healthy range", icon: ArrowDown };
  if (bmi < 25) return { label: "Healthy", color: "text-green-500", hint: "Within healthy range", icon: Heart };
  if (bmi < 30) return { label: "Overweight", color: "text-amber-500", hint: "Above healthy range", icon: TrendingUp };
  return { label: "Obesity", color: "text-red-500", hint: "Significantly above healthy range", icon: AlertTriangle };
}

export default function BmiCalculatorPage() {
  const { settings } = useSettings();
  const initialUnit: UnitSystem = settings?.defaultUnits === "imperial" ? "imperial" : "metric";

  const [unitSystem, setUnitSystem] = React.useState<UnitSystem>(initialUnit);
  const [heightCm, setHeightCm] = React.useState<string>("");
  const [weightKg, setWeightKg] = React.useState<string>("");
  const [heightFt, setHeightFt] = React.useState<string>("");
  const [heightIn, setHeightIn] = React.useState<string>("");
  const [weightLb, setWeightLb] = React.useState<string>("");

  React.useEffect(() => {
    try {
      const raw = localStorage.getItem("utilities.bmi-calculator");
      if (raw) {
        const s = JSON.parse(raw);
        if (s.unitSystem) setUnitSystem(s.unitSystem);
        if (s.heightCm != null) setHeightCm(String(s.heightCm));
        if (s.weightKg != null) setWeightKg(String(s.weightKg));
        if (s.heightFt != null) setHeightFt(String(s.heightFt));
        if (s.heightIn != null) setHeightIn(String(s.heightIn));
        if (s.weightLb != null) setWeightLb(String(s.weightLb));
      }
    } catch {}
  }, []);

  React.useEffect(() => {
    const data = { unitSystem, heightCm, weightKg, heightFt, heightIn, weightLb };
    try { localStorage.setItem("utilities.bmi-calculator", JSON.stringify(data)); } catch {}
  }, [unitSystem, heightCm, weightKg, heightFt, heightIn, weightLb]);

  const bmi = React.useMemo(() => {
    if (unitSystem === "metric") {
      const hCm = parseFloat(heightCm);
      const wKg = parseFloat(weightKg);
      if (hCm > 0 && wKg > 0) {
        const hM = hCm / 100;
        return wKg / (hM * hM);
      }
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inches = parseFloat(heightIn) || 0;
      const totalIn = ft * 12 + inches;
      const wLb = parseFloat(weightLb);
      if (totalIn > 0 && wLb > 0) {
        return (703 * wLb) / (totalIn * totalIn);
      }
    }
    return NaN;
  }, [unitSystem, heightCm, weightKg, heightFt, heightIn, weightLb]);

  const display = Number.isFinite(bmi) ? bmi : NaN;
  const rounded = Number.isFinite(display) ? Math.round(display * 10) / 10 : NaN;
  const cls = classifyBMI(display);

  const heightMeters = React.useMemo(()=>{
    if (unitSystem==='metric') { const hCm=parseFloat(heightCm); return hCm>0? hCm/100: NaN; }
    const ft=parseFloat(heightFt)||0; const inches=parseFloat(heightIn)||0; const totalIn=ft*12+inches; return totalIn>0? totalIn*0.0254: NaN;
  }, [unitSystem, heightCm, heightFt, heightIn]);
  
  const weightKgVal = React.useMemo(()=>{
    if (unitSystem==='metric') { const w=parseFloat(weightKg); return w>0? w: NaN; }
    const w=parseFloat(weightLb); return w>0? w*0.45359237: NaN;
  }, [unitSystem, weightKg, weightLb]);
  
  const heightInches = React.useMemo(()=> isFinite(heightMeters) ? heightMeters / 0.0254 : NaN, [heightMeters]);
  const weightLbVal = React.useMemo(()=> isFinite(weightKgVal) ? weightKgVal / 0.45359237 : NaN, [weightKgVal]);
  const idealMin = isFinite(heightMeters) ? 18.5 * heightMeters * heightMeters : NaN;
  const idealMax = isFinite(heightMeters) ? 24.9 * heightMeters * heightMeters : NaN;
  const bmiPrime = isFinite(display) ? display / 25 : NaN;
  const midpoint = isFinite(idealMin) && isFinite(idealMax) ? (idealMin+idealMax)/2 : NaN;
  const deltaFromMid = isFinite(weightKgVal) && isFinite(midpoint) ? weightKgVal - midpoint : NaN;

  const warnings: string[] = [];
  if (isFinite(heightMeters)) {
    if (heightMeters < 1.2) warnings.push('Height entered is quite short; ensure units are correct.');
    else if (heightMeters > 2.2) warnings.push('Height entered is unusually tall.');
  }
  if (isFinite(weightKgVal)) {
    if (weightKgVal < 35) warnings.push('Weight seems very low; double‑check units.');
    else if (weightKgVal > 180) warnings.push('Weight is high; ensure it is accurate.');
  }

  // toast
  const { toast } = useToast();

  const hasInputs = [heightCm, heightFt, heightIn, weightKg, weightLb].some(v=> v);

  const handleReset = () => {
    setHeightCm(''); setWeightKg(''); setHeightFt(''); setHeightIn(''); setWeightLb('');
  };

  const copyBMI = async () => {
    if (!Number.isFinite(rounded)) return;
    const text = `BMI: ${rounded.toFixed(1)} (${cls.label})`;
    try { await navigator.clipboard.writeText(text); } catch {}
  };

  const shareBMI = async () => {
    if (!Number.isFinite(rounded)) return;
    const params = new URLSearchParams();
    if (unitSystem==='metric') { if (heightCm) params.set('h', heightCm); if (weightKg) params.set('w', weightKg); }
    else { if (heightFt) params.set('ft', heightFt); if (heightIn) params.set('in', heightIn); if (weightLb) params.set('lb', weightLb); }
    params.set('u', unitSystem);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    const text = `My BMI is ${rounded.toFixed(1)} (${cls.label}). ${url}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: 'BMI Result', text, url });
        toast({ title: 'Shared', description: 'BMI result shared.' });
        return;
      } catch {
        // user cancelled or failed - fall back to copy
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      toast({ title: 'Copied', description: 'BMI result copied to clipboard.' });
    } catch {
      toast({ title: 'Share failed', description: 'Unable to share or copy the BMI result.', variant: 'destructive' });
    }
  };

  React.useEffect(()=>{
    if (typeof window==='undefined') return;
    const sp = new URLSearchParams(window.location.search);
    const u = sp.get('u'); if (u==='metric' || u==='imperial') setUnitSystem(u);
    if (sp.get('h')) setHeightCm(sp.get('h') || '');
    if (sp.get('w')) setWeightKg(sp.get('w') || '');
    if (sp.get('ft')) setHeightFt(sp.get('ft') || '');
    if (sp.get('in')) setHeightIn(sp.get('in') || '');
    if (sp.get('lb')) setWeightLb(sp.get('lb') || '');
  }, []);

  const pct = Number.isFinite(display) ? clamp((display / 40) * 100, 0, 100) : 0;

  const abnormal = React.useMemo(() => {
    let hMeters = 0;
    let wKg = 0;
    if (unitSystem === "metric") {
      const hCm = parseFloat(heightCm);
      const w = parseFloat(weightKg);
      if (hCm > 0) hMeters = hCm / 100;
      if (w > 0) wKg = w;
    } else {
      const ft = parseFloat(heightFt) || 0;
      const inches = parseFloat(heightIn) || 0;
      const totalIn = ft * 12 + inches;
      if (totalIn > 0) hMeters = totalIn * 0.0254;
      const w = parseFloat(weightLb);
      if (w > 0) wKg = w * 0.45359237;
    }
    if (!hMeters && !wKg) return null;
    if (hMeters > 3.0) return "so-tall";
    if (wKg > 500) return "so-heavy";
    return null;
  }, [unitSystem, heightCm, weightKg, heightFt, heightIn, weightLb]);

  const lastAbnormalRef = React.useRef<string | null>(null);
  React.useEffect(() => {
    if (abnormal && abnormal !== lastAbnormalRef.current) {
      lastAbnormalRef.current = abnormal;
      import("canvas-confetti").then((mod) => {
        const confetti = (mod.default || mod) as unknown as ((opts?: { particleCount?: number; spread?: number; startVelocity?: number; scalar?: number; origin?: { x?: number; y?: number } }) => void);
        try {
          confetti({ particleCount: 80, spread: 70, startVelocity: 35, scalar: 0.8, origin: { y: 0.2 } });
        } catch {}
      }).catch(() => {});
    }
    if (!abnormal) lastAbnormalRef.current = null;
  }, [abnormal]);

  return (
    <>
      <Helmet>
        <title>BMI Calculator | utilities.my</title>
        <meta name="description" content="Calculate your BMI with metric or imperial units. Get health category and personalized recommendations. Free online BMI calculator." />
        <link rel="canonical" href="https://utilities.my/bmi-calculator" />
      </Helmet>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="lg:hidden" />
            <Activity className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold font-headline">BMI Calculator</h1>
          </div>
          <ThemeToggleButton />
        </header>

        <div className="flex flex-1 flex-col p-4 lg:p-8">
          <div className="w-full max-w-7xl mx-auto space-y-8 pb-16 lg:pb-24">
            <div className="mb-8">
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-foreground border-b border-border pb-4">BMI Calculator</h1>
              <p className="text-lg text-muted-foreground max-w-3xl">Compute your Body Mass Index (BMI) using metric or imperial units.</p>
            </div>

            <div>
              <Card className="w-full shadow-sm">
                <CardContent className="space-y-5 p-5 lg:p-7">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
                    <div className="w-full sm:w-60">
                      <Label className="mb-1.5 block">Units</Label>
                      <Select value={unitSystem} onValueChange={(v: UnitSystem) => setUnitSystem(v)}>
                        <SelectTrigger><SelectValue placeholder="Select units" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="metric"><div className="flex items-center gap-2"><Ruler className="h-4 w-4" /> Metric (kg, cm)</div></SelectItem>
                          <SelectItem value="imperial"><div className="flex items-center gap-2"><Dumbbell className="h-4 w-4" /> Imperial (lb, ft/in)</div></SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col sm:flex-row w-full gap-2 sm:gap-2 sm:flex-wrap">
                      <Button type="button" variant="outline" onClick={handleReset} disabled={!hasInputs} className="h-10 w-full sm:w-auto"><RotateCcw className="h-4 w-4" /> Reset</Button>
                      <Button type="button" variant="outline" onClick={copyBMI} disabled={!Number.isFinite(rounded)} className="h-10 w-full sm:w-auto"><Copy className="h-4 w-4" /> Copy BMI</Button>
                      <Button type="button" variant="outline" onClick={shareBMI} disabled={!Number.isFinite(rounded)} className="h-10 w-full sm:w-auto"><Share2 className="h-4 w-4" /> Share</Button>
                    </div>
                  </div>

                  {unitSystem === "metric" ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="heightCm">Height (cm)</Label>
                        <Input id="heightCm" inputMode="decimal" type="number" min={0} placeholder="e.g., 170" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
                        {isFinite(heightMeters) && <p className="mt-1 text-[11px] text-muted-foreground">≈ {(heightMeters).toFixed(2)} m / {(heightInches).toFixed(1)} in</p>}
                      </div>
                      <div>
                        <Label htmlFor="weightKg">Weight (kg)</Label>
                        <Input id="weightKg" inputMode="decimal" type="number" min={0} placeholder="e.g., 65" value={weightKg} onChange={(e) => setWeightKg(e.target.value)} />
                        {isFinite(weightKgVal) && <p className="mt-1 text-[11px] text-muted-foreground">≈ {(weightLbVal).toFixed(1)} lb</p>}
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <Label htmlFor="heightFt">Height (ft)</Label>
                        <Input id="heightFt" inputMode="numeric" type="number" min={0} placeholder="e.g., 5" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="heightIn">Height (in)</Label>
                        <Input id="heightIn" inputMode="numeric" type="number" min={0} placeholder="e.g., 7" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} />
                      </div>
                      <div>
                        <Label htmlFor="weightLb">Weight (lb)</Label>
                        <Input id="weightLb" inputMode="decimal" type="number" min={0} placeholder="e.g., 150" value={weightLb} onChange={(e) => setWeightLb(e.target.value)} />
                        {isFinite(weightLbVal) && <p className="mt-1 text-[11px] text-muted-foreground">≈ {(weightKgVal).toFixed(1)} kg</p>}
                      </div>
                    </div>
                  )}

                  <div className="space-y-5">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="text-2xl sm:text-3xl md:text-4xl font-bold tabular-nums">{Number.isFinite(rounded) ? rounded.toFixed(1) : "—"}</div>
                      <Badge variant="secondary" className="text-xs md:text-sm flex items-center gap-1">
                        {cls.icon && React.createElement(cls.icon, { className: "h-3.5 w-3.5" })}
                        <span>{cls.label}</span>
                      </Badge>
                      <span className={cn("text-xs md:text-sm text-muted-foreground", cls.color)}>{cls.hint}</span>
                    </div>

                    {Number.isFinite(display) && isFinite(idealMin) && isFinite(idealMax) && (
                      <div className="text-xs text-muted-foreground flex flex-wrap gap-2">
                        <span>Ideal range: {idealMin.toFixed(1)}–{idealMax.toFixed(1)} kg</span>
                        {isFinite(deltaFromMid) && Math.abs(deltaFromMid) > 0.5 && (
                          <span className="text-[11px]">Δ from midpoint: {deltaFromMid>0?'+':''}{deltaFromMid.toFixed(1)} kg</span>
                        )}
                        {isFinite(bmiPrime) && <span>BMI Prime: {bmiPrime.toFixed(2)}</span>}
                      </div>
                    )}

                    <div className="space-y-1">
                      <div className="relative w-full">
                        <div className="relative h-3 sm:h-4 w-full overflow-hidden bg-muted/40">
                          <div className="absolute inset-y-0 left-0 bg-blue-500/70" style={{ width: `${(18.5/40)*100}%` }} />
                          <div className="absolute inset-y-0 bg-green-500/70" style={{ left: `${(18.5/40)*100}%`, width: `${((25-18.5)/40)*100}%` }} />
                          <div className="absolute inset-y-0 bg-amber-500/70" style={{ left: `${(25/40)*100}%`, width: `${((30-25)/40)*100}%` }} />
                          <div className="absolute inset-y-0 bg-red-500/70" style={{ left: `${(30/40)*100}%`, width: `${((40-30)/40)*100}%` }} />
                          <div className="pointer-events-none absolute inset-0 hidden sm:flex text-[12px] text-black/80 dark:text-white/80">
                            <div className="flex items-center justify-center" style={{ width: `${(18.5/40)*100}%` }}>Underweight</div>
                            <div className="flex items-center justify-center" style={{ width: `${((25-18.5)/40)*100}%` }}>Healthy</div>
                            <div className="flex items-center justify-center" style={{ width: `${((30-25)/40)*100}%` }}>Overweight</div>
                            <div className="flex items-center justify-center" style={{ width: `${((40-30)/40)*100}%` }}>Obesity</div>
                          </div>
                        </div>
                        <div className="absolute top-[-4px] sm:top-[-5px] bottom-[-4px] sm:bottom-[-5px] w-0.5 bg-foreground/80" style={{ left: `calc(${pct}% - 1px)` }} aria-hidden />
                      </div>
                      <div className="relative h-4 text-[10px] text-muted-foreground">
                        {[{ label: '0', value: 0 }, { label: '18.5', value: 18.5 }, { label: '25', value: 25 }, { label: '30', value: 30 }, { label: '40+', value: 40 }].map((t) => {
                          const left = clamp((t.value / 40) * 100, 0, 100);
                          const transform = left === 0 ? 'translateX(0%)' : left === 100 ? 'translateX(-100%)' : 'translateX(-50%)';
                          return (
                            <React.Fragment key={t.label}>
                              <span className="absolute -top-2 h-2 w-px bg-foreground/40" style={{ left: `${left}%`, transform: 'translateX(-50%)' }} aria-hidden />
                              <span className="absolute top-0 select-none" style={{ left: `${left}%`, transform }}>{t.label}</span>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground flex items-center gap-2">
                      <Info className="h-3.5 w-3.5" />
                      Healthy BMI range: 18.5 – 24.9. BMI is a screening tool and does not directly measure body fat or health.
                    </p>

                    {warnings.length>0 && (
                      <div className="space-y-1">
                        {warnings.map((w,i)=>(<p key={i} className="text-[11px] text-amber-600 dark:text-amber-400">{w}</p>))}
                      </div>
                    )}

                    {abnormal && (
                      <Alert className="mt-2 text-xs">
                        <AlertDescription className="flex items-start gap-2">
                          <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>
                            Those numbers look unusual for humans.
                            {abnormal === "so-tall" && " Measuring a skyscraper?"}
                            {abnormal === "so-heavy" && " Maybe that's a truck."}
                          </span>
                        </AlertDescription>
                      </Alert>
                    )}

                    <Accordion type="single" collapsible className="w-full mt-4 border rounded-md">
                      <AccordionItem value="calc" className="border-none">
                        <AccordionTrigger className="px-4">How BMI is calculated</AccordionTrigger>
                        <AccordionContent className="px-4 pt-0">
                          <p className="mb-2">BMI = weight (kg) / height (m)². Imperial formula uses 703 × weight(lb) / height(in)².</p>
                          <p className="text-muted-foreground text-xs">It is a population-level screening indicator and does not account for muscle mass, bone density, overall body composition, ethnicity, or sex-specific differences.</p>
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="disc" className="border-t border-border">
                        <AccordionTrigger className="px-4">Disclaimers</AccordionTrigger>
                        <AccordionContent className="px-4 pt-0 space-y-2">
                          <p className="text-xs">1. Athletes and very muscular individuals may have elevated BMI despite low body fat.</p>
                          <p className="text-xs">2. BMI thresholds differ for children and teens; use age- and sex-specific percentiles.</p>
                          <p className="text-xs">3. Not a diagnostic tool; consult healthcare providers for personalized assessment.</p>
                          <p className="text-xs">4. Pregnancy changes body composition—standard BMI categories may not apply.</p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  );
}
