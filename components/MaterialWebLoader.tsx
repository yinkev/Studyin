'use client';

/**
 * Material Web Components Loader
 *
 * Client component that imports Material Design 3 web components from @material/web.
 * This component must be imported in the root layout to register custom elements
 * globally for use throughout the application.
 *
 * React 19 provides native support for web components with:
 * - Automatic property vs attribute handling
 * - Custom event support via onEventName props
 * - Direct refs without workarounds
 *
 * @see https://github.com/material-components/material-web
 * @see https://m3.material.io
 */

import { useEffect } from 'react';

export function MaterialWebLoader() {
  useEffect(() => {
    // Import all Material Web components
    // Using dynamic imports to ensure they only load client-side

    // Buttons
    import('@material/web/button/filled-button.js');
    import('@material/web/button/outlined-button.js');
    import('@material/web/button/elevated-button.js');
    import('@material/web/button/filled-tonal-button.js');
    import('@material/web/button/text-button.js');

    // FABs
    import('@material/web/fab/fab.js');
    import('@material/web/fab/branded-fab.js');

    // Icon Buttons
    import('@material/web/iconbutton/icon-button.js');
    import('@material/web/iconbutton/filled-icon-button.js');
    import('@material/web/iconbutton/filled-tonal-icon-button.js');
    import('@material/web/iconbutton/outlined-icon-button.js');

    // Form Controls
    import('@material/web/checkbox/checkbox.js');
    import('@material/web/radio/radio.js');
    import('@material/web/switch/switch.js');

    // Text Fields
    import('@material/web/textfield/filled-text-field.js');
    import('@material/web/textfield/outlined-text-field.js');

    // Select
    import('@material/web/select/filled-select.js');
    import('@material/web/select/outlined-select.js');
    import('@material/web/select/select-option.js');

    // Chips
    import('@material/web/chips/chip-set.js');
    import('@material/web/chips/assist-chip.js');
    import('@material/web/chips/filter-chip.js');
    import('@material/web/chips/input-chip.js');
    import('@material/web/chips/suggestion-chip.js');

    // Dialog
    import('@material/web/dialog/dialog.js');

    // List
    import('@material/web/list/list.js');
    import('@material/web/list/list-item.js');

    // Menu
    import('@material/web/menu/menu.js');
    import('@material/web/menu/menu-item.js');
    import('@material/web/menu/sub-menu.js');

    // Progress
    import('@material/web/progress/linear-progress.js');
    import('@material/web/progress/circular-progress.js');

    // Slider
    import('@material/web/slider/slider.js');

    // Utilities
    import('@material/web/divider/divider.js');
    import('@material/web/elevation/elevation.js');
    import('@material/web/icon/icon.js');
    import('@material/web/ripple/ripple.js');
    import('@material/web/focus/md-focus-ring.js');

    // Tabs
    import('@material/web/tabs/tabs.js');
    import('@material/web/tabs/primary-tab.js');
    import('@material/web/tabs/secondary-tab.js');
  }, []);

  // This component doesn't render anything
  return null;
}
