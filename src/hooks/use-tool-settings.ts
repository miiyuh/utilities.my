import { useSettings } from '@/contexts/settings-context';

export function useToolSettings() {
  const { settings } = useSettings();

  const formatNumber = (num: number, decimals: number = 2): string => {
    const formatted = num.toFixed(decimals);
    if (settings.numberFormat === 'comma') {
      return formatted.replace(/\B(?=(\d{3})+(?!\d))/g, '.').replace('.', ',');
    }
    return formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const formatDate = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    switch (settings.dateFormat) {
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'ISO':
        return `${year}-${month}-${day}`;
      default:
        return `${month}/${day}/${year}`;
    }
  };

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
    formatNumber,
    formatDate,
    formatCurrency,
    convertToUserTimezone,
    getUnitsForMeasurement,
  };
}
