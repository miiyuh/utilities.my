import React, { createContext, useContext, useState, useEffect } from 'react';
import type { DatePreset, NumberFormat, TimeFormat } from '@/lib/format';

export type DateFormat = DatePreset;
export type { NumberFormat, TimeFormat };

export interface ToolSettings {
  dateFormat: DateFormat;
  timeFormat: TimeFormat;
  numberFormat: NumberFormat;
}

interface SettingsContextType {
  settings: ToolSettings;
  updateSetting: <K extends keyof ToolSettings>(key: K, value: ToolSettings[K]) => void;
  resetSettings: () => void;
}

const defaultSettings: ToolSettings = {
  dateFormat: 'my',
  timeFormat: '24h',
  numberFormat: 'period',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'utilities-tool-settings';

// Date formats were stored as literal patterns before the presets existed.
const LEGACY_DATE_FORMATS: Record<string, DateFormat> = {
  'DD/MM/YYYY': 'my',
  'MM/DD/YYYY': 'us',
  ISO: 'iso',
};

/**
 * Read once, synchronously, as the initial state. Loading from an effect meant
 * the provider rendered null on the first pass (the whole app was blank for a
 * frame) and then re-rendered with the stored values.
 */
function loadSettings(): ToolSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as Partial<ToolSettings>;
      // Pick known keys, so settings that no longer exist (units, time zone,
      // currency) are dropped from storage on the next save.
      return {
        dateFormat: LEGACY_DATE_FORMATS[parsed.dateFormat ?? ''] ?? parsed.dateFormat ?? defaultSettings.dateFormat,
        timeFormat: parsed.timeFormat ?? defaultSettings.timeFormat,
        numberFormat: parsed.numberFormat ?? defaultSettings.numberFormat,
      };
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
  return defaultSettings;
}

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ToolSettings>(loadSettings);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }, [settings]);

  const updateSetting = <K extends keyof ToolSettings>(key: K, value: ToolSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  return (
    <SettingsContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
