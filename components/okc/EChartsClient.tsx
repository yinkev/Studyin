'use client';

import Script from 'next/script';
import { useEffect, useRef, useState } from 'react';

export function EChartsClient({ height = 256 }: { height?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!ready) return;
    const el = ref.current;
    const echarts = (window as any).echarts;
    if (!el || !echarts) return;
    const chart = echarts.init(el);
    chart.setOption({
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'], axisLine:{show:false}, axisTick:{show:false} },
      yAxis: { type: 'value', splitLine:{ lineStyle:{ color:'#e5e7eb', type:'dashed' } }, axisLine:{show:false}, axisTick:{show:false} },
      series: [{
        type: 'line', smooth: true, data: [85,92,88,94,90,96,94],
        lineStyle: { color: '#58CC02', width: 4 },
        itemStyle: { color: '#58CC02', borderWidth: 3, borderColor: '#fff' },
        areaStyle: { color: { type:'linear', x:0,y:0,x2:0,y2:1, colorStops:[{offset:0,color:'rgba(88,204,2,0.3)'},{offset:1,color:'rgba(88,204,2,0.05)'}] } }
      }]
    });
    const onResize = () => chart.resize();
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); chart.dispose(); };
  }, [ready]);

  return (
    <>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/echarts/5.4.3/echarts.min.js" strategy="afterInteractive" onLoad={() => setReady(true)} />
      <div ref={ref} style={{ height }} />
    </>
  );
}

