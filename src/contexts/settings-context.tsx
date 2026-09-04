"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type UnitSystem = 'metric' | 'imperial';
export type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'ISO';
export type NumberFormat = 'period' | 'comma';
export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD' | 'AUD' | 'CHF' | 'CNY' | 'MYR';

export interface ToolSettings {
  defaultUnits: UnitSystem;
  dateFormat: DateFormat;
  timeZone: string;
  numberFormat: NumberFormat;
  currency: Currency;
}

interface SettingsContextType {
  settings: ToolSettings;
  updateSetting: <K extends keyof ToolSettings>(key: K, value: ToolSettings[K]) => void;
  resetSettings: () => void;
}

const defaultSettings: ToolSettings = {
  defaultUnits: 'metric',
  dateFormat: 'DD/MM/YYYY',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  numberFormat: 'period',
  currency: 'MYR',
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const STORAGE_KEY = 'utilities-tool-settings';

/**
 * Read once, synchronously, as the initial state. Loading from an effect meant
 * the provider rendered null on the first pass — the whole app was blank for a
 * frame — and then re-rendered with the stored values.
 */
function loadSettings(): ToolSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...defaultSettings, ...(JSON.parse(saved) as Partial<ToolSettings>) };
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
