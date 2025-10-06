'use client';

import Link from 'next/link';

export function OKCHeader() {
  const devEnabled =
    process.env.NEXT_PUBLIC_DEV_UPLOAD === '1' || process.env.NEXT_PUBLIC_DEV_TOOLS === '1';
  return (
    <nav className="bg-white shadow sticky top-0 z-40 border-b border-gray-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-2">
            <span aria-hidden className="text-3xl" style={{ color: 'var(--okc-feather)' }}>📚</span>
            <Link href="/" className="text-2xl font-extrabold text-gray-900">Studyin</Link>
            <span className="sr-only">Studyin home</span>
          </div>
          <div className="flex items-center gap-2">
            <div aria-live="polite" className="streak-counter px-3 py-1.5 text-white font-bold text-sm">🔥 7 Day Streak</div>
            <div aria-hidden className="achievement-badge w-10 h-10 flex items-center justify-center text-white font-bold text-base">🏆</div>
            {devEnabled && (
              <Link href="/dev/authoring" className="duo-button text-white font-bold text-sm px-4 py-2">
                Dev Tools
              </Link>
            )}
            <Link href="/upload" className="duo-button text-white font-bold text-sm px-4 py-2">Upload</Link>
            <Link href="/study" className="duo-button text-white font-bold text-sm px-4 py-2">Start</Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
