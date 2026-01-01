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

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<ToolSettings>(defaultSettings);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('utilities-tool-settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save settings to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem('utilities-tool-settings', JSON.stringify(settings));
      } catch (error) {
        console.error('Failed to save settings:', error);
      }
    }
  }, [settings, isLoaded]);

  const updateSetting = <K extends keyof ToolSettings>(key: K, value: ToolSettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
  };

  if (!isLoaded) {
    return null; // or a loading spinner
  }

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
