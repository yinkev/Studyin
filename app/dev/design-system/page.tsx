/**
 * Design System Playground
 * Visual showcase of all Nova design system components
 */

'use client';

import { Button } from '@/components/newui/atoms/Button';
import { Input } from '@/components/newui/atoms/Input';
import { Badge } from '@/components/newui/atoms/Badge';
import { Text } from '@/components/newui/atoms/Text';
import { IconButton } from '@/components/newui/atoms/IconButton';
import { AuraIcon } from '@/components/newui/icons';
import { tokens } from '@/components/newui/tokens';

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-[var(--nova-surface-bg0)] text-white p-8">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div>
          <Text as="h1" size="4xl" weight="bold" font="display" variant="high">
            Nova Design System
          </Text>
          <Text size="lg" variant="med" className="mt-2">
            Dark Aurora Theme for Studyin
          </Text>
        </div>

        {/* Color Palette */}
        <section>
          <Text as="h2" size="2xl" weight="semibold" className="mb-6">
            Color Palette
          </Text>

          <div className="space-y-6">
            <div>
              <Text size="sm" variant="med" className="mb-3">Brand Colors</Text>
              <div className="flex gap-4">
                <ColorSwatch color={tokens.colors.brand.primary} label="Primary" />
                <ColorSwatch color={tokens.colors.brand.secondary} label="Secondary" />
                <ColorSwatch color={tokens.colors.brand.tertiary} label="Tertiary" />
              </div>
            </div>

            <div>
              <Text size="sm" variant="med" className="mb-3">Surfaces</Text>
              <div className="flex gap-4">
                <ColorSwatch color={tokens.colors.surface.bg0} label="BG0" />
                <ColorSwatch color={tokens.colors.surface.bg1} label="BG1" />
                <ColorSwatch color={tokens.colors.surface.bg2} label="BG2" />
                <ColorSwatch color={tokens.colors.surface.bg3} label="BG3" />
              </div>
            </div>

            <div>
              <Text size="sm" variant="med" className="mb-3">Visualization</Text>
              <div className="flex gap-4">
                <ColorSwatch color={tokens.colors.viz.masteryLow} label="Mastery Low" />
                <ColorSwatch color={tokens.colors.viz.masteryMid} label="Mastery Mid" />
                <ColorSwatch color={tokens.colors.viz.masteryHigh} label="Mastery High" />
                <ColorSwatch color={tokens.colors.viz.confusionEdge} label="Confusion" />
                <ColorSwatch color={tokens.colors.viz.blueprintTarget} label="Blueprint" />
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section>
          <Text as="h2" size="2xl" weight="semibold" className="mb-6">
            Typography
          </Text>
          <div className="space-y-4">
            <Text as="h1" size="5xl" weight="bold" font="display">
              Display - Space Grotesk
            </Text>
            <Text size="2xl" font="body">
              Body - Manrope Regular
            </Text>
            <Text size="base" font="mono">
              Mono - JetBrains Mono
            </Text>
          </div>
        </section>

        {/* Buttons */}
        <section>
          <Text as="h2" size="2xl" weight="semibold" className="mb-6">
            Buttons
          </Text>
          <div className="space-y-6">
            <div className="flex gap-4 items-center">
              <Button variant="primary" size="lg">Primary Large</Button>
              <Button variant="primary" size="md">Primary Medium</Button>
              <Button variant="primary" size="sm">Primary Small</Button>
            </div>
            <div className="flex gap-4 items-center">
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
            <div className="flex gap-4 items-center">
              <Button variant="primary" disabled>Disabled</Button>
              <Button variant="primary" isLoading>Loading</Button>
            </div>
          </div>
        </section>

        {/* Icon Buttons */}
        <section>
          <Text as="h2" size="2xl" weight="semibold" className="mb-6">
            Icon Buttons
          </Text>
          <div className="flex gap-4 items-center">
            <IconButton variant="primary" size="lg" aria-label="Large primary">
              <AuraIcon icon="Brain" size="lg" />
            </IconButton>
            <IconButton variant="ghost" size="md" aria-label="Medium ghost">
              <AuraIcon icon="Gear" size="md" />
            </IconButton>
            <IconButton variant="danger" size="sm" aria-label="Small danger">
              <AuraIcon icon="X" size="sm" />
            </IconButton>
          </div>
        </section>

        {/* Icons */}
        <section>
          <Text as="h2" size="2xl" weight="semibold" className="mb-6">
            Phosphor Icons
          </Text>
          <div className="grid grid-cols-8 gap-6">
            <IconShowcase icon="Brain" />
            <IconShowcase icon="Lightbulb" />
            <IconShowcase icon="Target" />
            <IconShowcase icon="TrendUp" />
            <IconShowcase icon="BookOpen" />
            <IconShowcase icon="ChartLine" />
            <IconShowcase icon="Fire" />
            <IconShowcase icon="Trophy" />
            <IconShowcase icon="Star" />
            <IconShowcase icon="Lightning" />
            <IconShowcase icon="Upload" />
            <IconShowcase icon="Check" />
          </div>
        </section>

        {/* Inputs */}
        <section>
          <Text as="h2" size="2xl" weight="semibold" className="mb-6">
            Inputs
          </Text>
          <div className="space-y-4 max-w-md">
            <Input placeholder="Default input" />
            <Input placeholder="Small input" size="sm" />
            <Input placeholder="Large input" size="lg" />
            <Input placeholder="Error state" error />
            <Input placeholder="Disabled" disabled />
          </div>
        </section>

        {/* Badges */}
        <section>
          <Text as="h2" size="2xl" weight="semibold" className="mb-6">
            Badges
          </Text>
          <div className="flex gap-3 flex-wrap">
            <Badge variant="default">Default</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="danger">Danger</Badge>
            <Badge variant="info">Info</Badge>
            <Badge variant="success" size="sm">Small</Badge>
          </div>
        </section>

        {/* Text Variants */}
        <section>
          <Text as="h2" size="2xl" weight="semibold" className="mb-6">
            Text Variants
          </Text>
          <div className="space-y-2">
            <Text variant="high">High contrast text</Text>
            <Text variant="med">Medium contrast text</Text>
            <Text variant="low">Low contrast text</Text>
            <Text variant="disabled">Disabled text</Text>
          </div>
        </section>
      </div>
    </div>
  );
}

// Helper Components
function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="w-24 h-24 rounded-lg border border-white/10"
        style={{ backgroundColor: color }}
      />
      <Text size="xs" variant="med" className="text-center">
        {label}
      </Text>
      <Text size="xs" variant="low" font="mono" className="text-center">
        {color}
      </Text>
    </div>
  );
}

// Helper to get CSS variable value
function getCSSVar(varName: string): string {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }
  return '';
}

function IconShowcase({ icon }: { icon: any }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <AuraIcon icon={icon} size="xl" />
      <Text size="xs" variant="low" className="text-center">
        {icon}
      </Text>
    </div>
  );
}
