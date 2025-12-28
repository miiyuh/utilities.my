import { Helmet } from 'react-helmet-async'
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { RotateCcw, Settings } from 'lucide-react'
import { Sidebar, SidebarTrigger, SidebarInset, SidebarRail } from "@/components/ui/sidebar"
import { SidebarContent } from "@/components/sidebar-content"
import { ThemeToggleButton } from "@/components/theme-toggle-button"
import { useSettings, UnitSystem, DateFormat, NumberFormat, Currency } from '@/contexts/settings-context'

export default function SettingsPage() {
  const { settings, updateSetting, resetSettings } = useSettings()

  // Get available timezones
  const timeZones = (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone') ?? []
  const commonTimeZones = [
    'America/New_York',
    'America/Chicago', 
    'America/Denver',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'UTC'
  ]

  return (
    <>
      <Helmet>
        <title>Settings | utilities.my</title>
        <meta name="description" content="Configure your preferences for utilities.my tools." />
        <link rel="canonical" href="https://utilities.my/settings" />
      </Helmet>
      <Sidebar collapsible="icon" variant="sidebar" side="left">
        <SidebarContent />
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur-sm md:px-6">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="lg:hidden" />
            <Settings className="h-5 w-5 text-primary" />
            <h1 className="text-xl font-semibold font-headline">Settings</h1>
          </div>
          <ThemeToggleButton />
        </header>
        <div className="flex flex-1 flex-col p-4 lg:p-8">
          <div className="flex flex-1 items-start justify-center">
            <div className="w-full max-w-7xl mx-auto space-y-6">
              
              {/* Appearance Settings */}
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl font-headline">Appearance</CardTitle>
                  <CardDescription>Customize the look and feel of the application.</CardDescription>
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
                  
                  {/* Default Units */}
                  <div className="space-y-2">
                    <Label htmlFor="units">Default Units</Label>
                    <Select value={settings.defaultUnits} onValueChange={(value: UnitSystem) => updateSetting('defaultUnits', value)}>
                      <SelectTrigger id="units">
                        <SelectValue placeholder="Select unit system" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="metric">Metric (kg, cm, °C)</SelectItem>
                        <SelectItem value="imperial">Imperial (lbs, ft, °F)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Default unit system for the unit converter tool.
                    </p>
                  </div>

                  {/* Date Format */}
                  <div className="space-y-2">
                    <Label htmlFor="dateFormat">Date Format</Label>
                    <Select value={settings.dateFormat} onValueChange={(value: DateFormat) => updateSetting('dateFormat', value)}>
                      <SelectTrigger id="dateFormat">
                        <SelectValue placeholder="Select date format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US)</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (EU)</SelectItem>
                        <SelectItem value="ISO">YYYY-MM-DD (ISO)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Date format used in date-related tools and displays.
                    </p>
                  </div>

                  {/* Time Zone */}
                  <div className="space-y-2">
                    <Label htmlFor="timezone">Time Zone</Label>
                    <Select value={settings.timeZone} onValueChange={(value: string) => updateSetting('timeZone', value)}>
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select timezone" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        <div className="font-medium text-sm p-2 text-muted-foreground">Common Timezones</div>
                        {commonTimeZones.map((tz) => (
                          <SelectItem key={tz} value={tz}>
                            {tz} ({new Date().toLocaleTimeString('en-US', { timeZone: tz, timeZoneName: 'short' }).split(' ')[1]})
                          </SelectItem>
                        ))}
                        <div className="font-medium text-sm p-2 text-muted-foreground border-t mt-2">All Timezones</div>
                        {timeZones.filter((tz: string) => !commonTimeZones.includes(tz)).map((tz: string) => (
                          <SelectItem key={tz} value={tz}>
                            {tz}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Timezone used for timestamp conversion and time-related tools.
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

                  {/* Currency */}
                  <div className="space-y-2">
                    <Label htmlFor="currency">Default Currency</Label>
                    <Select value={settings.currency} onValueChange={(value: Currency) => updateSetting('currency', value)}>
                      <SelectTrigger id="currency">
                        <SelectValue placeholder="Select currency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD - US Dollar ($)</SelectItem>
                        <SelectItem value="EUR">EUR - Euro (€)</SelectItem>
                        <SelectItem value="GBP">GBP - British Pound (£)</SelectItem>
                        <SelectItem value="JPY">JPY - Japanese Yen (¥)</SelectItem>
                        <SelectItem value="CAD">CAD - Canadian Dollar (C$)</SelectItem>
                        <SelectItem value="AUD">AUD - Australian Dollar (A$)</SelectItem>
                        <SelectItem value="CHF">CHF - Swiss Franc (CHF)</SelectItem>
                        <SelectItem value="CNY">CNY - Chinese Yuan (¥)</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Default currency for financial calculations and displays.
                    </p>
                  </div>

                  {/* Reset Button */}
                  <div className="pt-4 border-t">
                    <Button 
                      variant="outline" 
                      onClick={resetSettings}
                      className="flex items-center gap-2"
                    >
                      <RotateCcw className="h-4 w-4" />
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
