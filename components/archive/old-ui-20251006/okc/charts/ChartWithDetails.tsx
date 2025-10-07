'use client';

import { useState } from 'react';

export function ChartWithDetails({ title, render }: { title: string; render: (height?: number, onReady?: (api: any) => void) => JSX.Element }) {
  const [open, setOpen] = useState(false);
  const [api, setApi] = useState<any | null>(null);
  const download = (type: 'png' | 'svg') => {
    if (!api?.getDataURL) return;
    const url = api.getDataURL({ type, pixelRatio: 2, backgroundColor: '#ffffff' });
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/\s+/g, '_').toLowerCase()}.${type}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  return (
    <div className="space-y-3">
      <div className="rounded-md bg-gray-50 p-2">
        {render(260, setApi)}
      </div>
      <div className="flex justify-end">
        <button onClick={() => setOpen(true)} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50">View details</button>
        {open && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/50">
            <div className="w-[min(92vw,1024px)] rounded-xl border border-gray-200 bg-white p-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{title}</h2>
                <button onClick={() => setOpen(false)} className="btn-ghost">Close</button>
              </div>
              <div className="mt-2 rounded-lg bg-gray-50 p-2">
                {render(420, setApi)}
              </div>
              <div className="mt-4 flex gap-2 justify-end">
                <button onClick={() => download('png')} className="btn-ghost">Download PNG</button>
                <button onClick={() => download('svg')} className="btn-ghost">Download SVG</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
