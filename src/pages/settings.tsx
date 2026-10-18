import { useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ArrowCounterClockwise, Gear } from '@phosphor-icons/react'
import { Sidebar, SidebarInset, SidebarRail } from "@/components/ui/sidebar"
import { SidebarContent } from "@/components/sidebar-content"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import { useSettings, type DateFormat, type NumberFormat, type TimeFormat } from '@/contexts/settings-context'
import { PageHeader } from "@/components/page-header";
import { format } from 'date-fns'
import { DATE_PRESETS, fnsPatterns, type DatePreset } from '@/lib/format'

export default function SettingsPage() {
  const { settings, updateSetting, resetSettings } = useSettings()
  // Captured once so the example times in the menus stay stable while you browse them.
  const [now] = useState(() => new Date())

  return (
    <>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <PageHeader icon={Gear} title="Settings" />
        <div className="flex flex-1 flex-col px-4 p-4 lg:p-8">
          <div className="flex flex-1 items-start justify-center">
            <div className="w-full max-w-7xl mx-auto space-y-8">
              
              {/* Appearance Settings */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-headline">Appearance</CardTitle>
                  <CardDescription>Customise the look and feel of the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div>
                      <Label className="font-semibold">Theme</Label>
                      <p className="text-sm text-muted-foreground">
                        Select your preferred light or dark theme.
                      </p>
                    </div>
                    <ThemeToggleButton />
                  </div>
                </CardContent>
              </Card>

              {/* Tool-Specific Settings */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-headline">Tool Preferences</CardTitle>
                  <CardDescription>Configure default settings for various tools and utilities.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  
                  {/* Date Format */}
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select value={settings.dateFormat} onValueChange={(value: DateFormat) => updateSetting('dateFormat', value)}>
                      <SelectTrigger id="dateFormat">
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(DATE_PRESETS) as DatePreset[]).map((preset) => {
                          const p = fnsPatterns(preset, settings.timeFormat)
                          return (
                            <SelectItem key={preset} value={preset}>
                              {DATE_PRESETS[preset].label}: {format(now, p.long)} · {format(now, p.numeric)}
                            </SelectItem>
                          )
                        })}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Date format used in date-related tools and displays.
                    </p>
                  </div>

                  {/* Time Format */}
                  <div className="space-y-2">
                    <Label htmlFor="timeFormat">Time Format</Label>
                    <Select value={settings.timeFormat} onValueChange={(value: TimeFormat) => updateSetting('timeFormat', value)}>
                      <SelectTrigger id="timeFormat">
                        <SelectValue placeholder="Select time format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="12h">12-hour ({format(now, 'h:mm a')})</SelectItem>
                        <SelectItem value="24h">24-hour ({format(now, 'HH:mm')})</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Default clock for time-related tools. Each tool can still switch for the session.
                    </p>
                  </div>

                  {/* Number Format */}
                  <div className="space-y-2">
                    <Label htmlFor="numberFormat">Number Format</Label>
                    <Select value={settings.numberFormat} onValueChange={(value: NumberFormat) => updateSetting('numberFormat', value)}>
                      <SelectTrigger id="numberFormat">
                        <SelectValue placeholder="Select number format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="period">1,234.56 (Period as decimal)</SelectItem>
                        <SelectItem value="comma">1.234,56 (Comma as decimal)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Number formatting for calculations and displays.
                    </p>
                  </div>

                  {/* Reset Button */}
                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={resetSettings}
                      className="flex items-center gap-2"
                    >
                      <ArrowCounterClockwise className="h-4 w-4" />
                      Reset to Defaults
                    </Button>
                    <p className="text-sm text-muted-foreground mt-2">
                      Reset all settings to their default values.
                    </p>
                  </div>

                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </SidebarInset>
    </>
  )
}
