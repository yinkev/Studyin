'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

export interface EChartsBaseProps<T = any> {
  data: T;
  height?: number;
  buildOption: (
    data: T,
    theme: { okcFeather: string; okcMask: string; okcMacaw: string; okcCardinal: string; grid: string; text: string }
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
      okcFeather: read('--okc-feather', '#58CC02'),
      okcMask: read('--okc-mask', '#89E219'),
      okcMacaw: read('--okc-macaw', '#1CB0F6'),
      okcCardinal: read('--okc-cardinal', '#FF4B4B'),
      grid: '#e5e7eb',
      text: '#111827'
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
