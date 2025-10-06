'use client';

import { ReactNode, useEffect, useRef } from 'react';
import Link from 'next/link';
import Mascot from '../Mascot';
import anime from 'animejs';

export function AppShell({ children }: { children: ReactNode }) {
  const mascotRef = useRef(null);

  useEffect(() => {
    if (mascotRef.current) {
      anime({
        targets: mascotRef.current,
        translateY: [-5, 5],
        direction: 'alternate',
        loop: true,
        easing: 'easeInOutSine',
        duration: 2000
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-blue-50 font-sans">
      {/* New Duolingo-style Header */}
      <header className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/study" className="flex items-center space-x-2">
                <div ref={mascotRef} className="w-12 h-12">
                  <Mascot />
                </div>
                <span className="text-2xl font-extrabold text-blue-600">Studyin</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {/* Placeholder for Gems/Points */}
              <div className="flex items-center space-x-2 bg-yellow-100 border border-yellow-300 rounded-full px-3 py-1">
                <span className="text-yellow-500 text-xl">💎</span>
                <span className="font-bold text-yellow-700">123</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main id="main" className="flex-1 p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Simple Tab-bar like footer for navigation */}
      <footer className="sticky bottom-0 z-40 w-full bg-white border-t">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-around h-16">
            <Link href="/study" className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 w-full">
              <span className="text-2xl">📚</span>
              <span className="text-xs font-bold">Study</span>
            </Link>
            <Link href="/upload" className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 w-full">
              <span className="text-2xl">☁️</span>
              <span className="text-xs font-bold">Upload</span>
            </Link>
            <Link href="/insights" className="flex flex-col items-center justify-center text-gray-500 hover:text-blue-600 w-full">
              <span className="text-2xl">📊</span>
              <span className="text-xs font-bold">Insights</span>
            </Link>
          </div>
        </nav>
      </footer>
    </div>
  );
}
