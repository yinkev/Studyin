import { lazy, useEffect, useRef } from 'react';

/**
 * Lightweight performance monitoring for personal use
 * Focus on what matters: perceived performance and smooth UX
 */

interface PerformanceMetrics {
  viewTransition: number;
  wsConnect: number;
  firstMessage: number;
  bundleLoad: number;
}

class PersonalPerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private timers: Map<string, number> = new Map();

  // Start a timer
  start(name: string) {
    this.timers.set(name, performance.now());
  }

  // End a timer and log if slow
  end(name: string, slowThreshold = 100) {
    const start = this.timers.get(name);
    if (!start) return;

    const duration = performance.now() - start;
    this.timers.delete(name);

    // Only log if it's slow (personal use = only care about problems)
    if (duration > slowThreshold) {
      console.warn(`⚡ Slow ${name}: ${duration.toFixed(0)}ms`);
    }

    return duration;
  }

  // Track view transitions
  trackViewChange(from: string, to: string) {
    this.start(`view_${from}_to_${to}`);

    // Use requestIdleCallback for non-blocking measurement
    requestIdleCallback(() => {
      const duration = this.end(`view_${from}_to_${to}`, 50);
      if (duration && duration > 100) {
        console.info(`📊 View transition ${from} → ${to}: ${duration.toFixed(0)}ms`);
      }
    });
  }

  // Track WebSocket connection
  trackWebSocketConnection() {
    this.start('ws_connect');
    return () => {
      const duration = this.end('ws_connect', 500);
      if (duration) {
        this.metrics.wsConnect = duration;
      }
    };
  }

  // Get Core Web Vitals (simplified for personal use)
  getCoreWebVitals() {
    if (!('PerformanceObserver' in window)) return;

    // LCP - Largest Contentful Paint
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      console.info(`📏 LCP: ${lastEntry.startTime.toFixed(0)}ms`);
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // FID - First Input Delay
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        if (entry.processingStart && entry.startTime) {
          const delay = entry.processingStart - entry.startTime;
          if (delay > 100) {
            console.warn(`⚠️ Slow input response: ${delay.toFixed(0)}ms`);
          }
        }
      });
    }).observe({ entryTypes: ['first-input'] });

    // CLS - Cumulative Layout Shift (only log if bad)
    let clsValue = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          if (clsValue > 0.1) {
            console.warn(`📐 Layout shift detected: ${clsValue.toFixed(3)}`);
          }
        }
      }
    }).observe({ entryTypes: ['layout-shift'] });
  }

  // Quick performance check
  quickCheck() {
    const navigation = performance.getEntriesByType('navigation')[0] as any;

    if (navigation) {
      const metrics = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        domInteractive: navigation.domInteractive - navigation.fetchStart,
        jsHeapUsed: (performance as any).memory?.usedJSHeapSize / 1024 / 1024,
      };

      // Only log if something is slow
      if (metrics.loadComplete > 1000) {
        console.table(metrics);
      }

      return metrics;
    }
  }

  // Monitor memory (Chrome only, useful for personal debugging)
  monitorMemory() {
    if (!('memory' in performance)) return;

    setInterval(() => {
      const memory = (performance as any).memory;
      const usedMB = memory.usedJSHeapSize / 1024 / 1024;
      const limitMB = memory.jsHeapSizeLimit / 1024 / 1024;

      // Only warn if using too much memory
      if (usedMB > limitMB * 0.9) {
        console.warn(`⚠️ High memory usage: ${usedMB.toFixed(0)}MB / ${limitMB.toFixed(0)}MB`);
      }
    }, 10000); // Check every 10 seconds
  }

  // Dev-only helper to find slow renders
  measureRender(componentName: string, fn: () => void) {
    if (process.env.NODE_ENV === 'development') {
      this.start(`render_${componentName}`);
      fn();
      this.end(`render_${componentName}`, 16); // Log if render takes more than 16ms (60fps)
    } else {
      fn();
    }
  }
}

// Singleton instance
export const perfMonitor = new PersonalPerformanceMonitor();

// Auto-start monitoring in dev
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Start monitoring after page load
  window.addEventListener('load', () => {
    perfMonitor.getCoreWebVitals();
    perfMonitor.monitorMemory();
    perfMonitor.quickCheck();
  });
}

// Utility hook for React components
export function usePerformanceTracking(componentName: string) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;

    // Warn about excessive re-renders (personal use = catch React mistakes)
    if (renderCount.current > 10) {
      console.warn(`⚠️ ${componentName} rendered ${renderCount.current} times`);
    }
  });

  return {
    trackAction: (action: string) => perfMonitor.start(`${componentName}_${action}`),
    endAction: (action: string) => perfMonitor.end(`${componentName}_${action}`),
  };
}

// Quick helper for lazy loading with retry
export function lazyWithRetry<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  retries = 3,
  delay = 1000
): React.LazyExoticComponent<T> {
  return lazy(() => {
    return new Promise<{ default: T }>((resolve, reject) => {
      const attempt = (retriesLeft: number) => {
        importFn()
          .then(resolve)
          .catch((error) => {
            if (retriesLeft === 0) {
              reject(error);
              return;
            }

            console.warn(`Failed to load component, retrying... (${retriesLeft} left)`);
            setTimeout(() => attempt(retriesLeft - 1), delay);
          });
      };

      attempt(retries);
    });
  });
}
