'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/radix/dialog';

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
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-50">View details</button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl border-gray-200 bg-white text-gray-900">
            <DialogHeader>
              <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="mt-2 rounded-lg bg-gray-50 p-2">
              {render(420, setApi)}
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => download('png')} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm">Download PNG</button>
              <button onClick={() => download('svg')} className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm">Download SVG</button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
