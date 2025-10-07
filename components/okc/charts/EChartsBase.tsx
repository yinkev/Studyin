'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

export interface EChartsBaseProps<T = any> {
  data: T;
  height?: number;
  buildOption: (
    data: T,
    theme: {
      okcFeather: string;
      okcMask: string;
      okcMacaw: string;
      okcCardinal: string;
      grid: string;
      text: string;
      surface: string;
    }
  ) => any;
  onReady?: (api: { chart: any; getDataURL: (opts?: any) => string; resize: () => void }) => void;
}

export function EChartsBase<T>({ data, height = 280, buildOption, onReady }: EChartsBaseProps<T>) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const el = ref.current;
    const echarts = (window as any).echarts;
    if (!el || !echarts) return;
    const chart = echarts.init(el);
    const css = getComputedStyle(document.documentElement);
    const read = (name: string, fallback: string) => (css.getPropertyValue(name) || '').trim() || fallback;
    const theme = {
      okcFeather: read('--okc-feather', '#22d3ee'),
      okcMask: read('--okc-mask', '#0ea5e9'),
      okcMacaw: read('--okc-macaw', '#38e3c2'),
      okcCardinal: read('--okc-cardinal', '#f97316'),
      grid: read('--grid-subtle', '#e2e8f0'),
      text: read('--text-high', '#0f172a'),
      surface: read('--surface-bg1', '#f8fafc')
    } as const;
    chart.setOption(buildOption(data, theme));
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    if (onReady) onReady({ chart, getDataURL: chart.getDataURL.bind(chart), resize: chart.resize.bind(chart) });
    return () => { window.removeEventListener('resize', onResize); chart.dispose(); };
  }, [ready, data, buildOption, onReady]);

  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js" strategy="afterInteractive" onLoad={() => setReady(true)} />
      <div ref={ref} style={{ height }} />
    </>
  );
}
