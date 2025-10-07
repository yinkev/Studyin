export const CHART_FONT = '12px "Inter", ui-sans-serif, system-ui';
export const CHART_AXIS_COLOR = '#94a3b8';
export const CHART_BG = '#ffffff';
export const CHART_GRID_COLOR = 'rgba(148,163,184,0.25)';
export const CHART_PRIMARY = '#2563eb';
export const CHART_SECONDARY = '#38bdf8';
export const CHART_WARNING = '#f59e0b';

export function formatMinutes(value: number): string {
  if (value >= 60) {
    const hrs = value / 60;
    return `${hrs.toFixed(1)}h`;
  }
  return `${value.toFixed(2)}m`;
}

export function cleanLabel(id: string): string {
  return id.replace(/^lo\./, '').replace(/^item\./, '');
}

export function truncate(text: string, max = 20): string {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
