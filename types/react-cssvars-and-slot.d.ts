// Allow CSS custom properties (e.g., --md-*) on style objects
// and the `slot` attribute on HTML/SVG elements used by Material Web.
import 'react';

declare module 'react' {
  // Permit CSS variables like --foo: '...'
  interface CSSProperties {
    [key: `--${string}`]: string | number | undefined;
  }

  // Allow slot on HTML & SVG attributes (used by md-* components)
  interface HTMLAttributes<T> {
    slot?: string;
  }
  interface SVGAttributes<T> {
    slot?: string;
  }
}

export {};

