import { useSettings } from '@/contexts/settings-context';
import { fnsPatterns, formatNumber as formatNumberWith } from '@/lib/format';

export function useToolSettings() {
  const { settings } = useSettings();

  const fns = fnsPatterns(settings.dateFormat, settings.timeFormat);
  const is24h = settings.timeFormat === '24h';

  const formatNumber = (num: number, maxDecimals: number = 2, minDecimals: number = 0): string =>
    formatNumberWith(num, settings.numberFormat, maxDecimals, minDecimals);

  return {
    ...settings,
    fns,
    is24h,
    formatNumber,
  };
}
