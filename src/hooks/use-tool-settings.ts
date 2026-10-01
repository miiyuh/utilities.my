import { useSettings } from '@/contexts/settings-context';
import { dayjsPatterns, fnsPatterns, formatNumber as formatNumberWith } from '@/lib/format';

export function useToolSettings() {
  const { settings } = useSettings();

  const fns = fnsPatterns(settings.dateFormat, settings.timeFormat);
  const dayjs = dayjsPatterns(settings.dateFormat, settings.timeFormat);
  const is24h = settings.timeFormat === '24h';

  const formatNumber = (num: number, maxDecimals: number = 2, minDecimals: number = 0): string =>
    formatNumberWith(num, settings.numberFormat, maxDecimals, minDecimals);

  const formatCurrency = (amount: number): string => {
    const currencySymbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      GBP: '£',
      JPY: '¥',
      CAD: 'C$',
      AUD: 'A$',
      CHF: 'CHF',
      CNY: '¥',
      MYR: 'RM',
    };

    const symbol = currencySymbols[settings.currency] || '$';
    const formatted = formatNumber(amount, 2);
    
    // For some currencies, symbol goes after
    if (settings.currency === 'EUR') {
      return `${formatted} ${symbol}`;
    }
    
    return `${symbol}${formatted}`;
  };

  const convertToUserTimezone = (date: Date): Date => {
    // Create a new date in the user's timezone
    const timeString = date.toLocaleString('en-US', { timeZone: settings.timeZone });
    return new Date(timeString);
  };

  const getUnitsForMeasurement = (type: 'length' | 'weight' | 'temperature' | 'volume') => {
    if (settings.defaultUnits === 'metric') {
      switch (type) {
        case 'length':
          return ['mm', 'cm', 'm', 'km'];
        case 'weight':
          return ['g', 'kg'];
        case 'temperature':
          return ['°C'];
        case 'volume':
          return ['ml', 'l'];
        default:
          return [];
      }
    } else {
      switch (type) {
        case 'length':
          return ['in', 'ft', 'yd', 'mi'];
        case 'weight':
          return ['oz', 'lb'];
        case 'temperature':
          return ['°F'];
        case 'volume':
          return ['fl oz', 'cup', 'pt', 'qt', 'gal'];
        default:
          return [];
      }
    }
  };

  return {
    ...settings,
    fns,
    dayjs,
    is24h,
    formatNumber,
    formatCurrency,
    convertToUserTimezone,
    getUnitsForMeasurement,
  };
}
