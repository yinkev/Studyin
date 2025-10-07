import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <nav aria-label="Breadcrumb" className="text-sm text-text-med">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="transition-colors hover:text-brand-light">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'text-text-high font-semibold' : undefined}>{item.label}</span>
              )}
              {!isLast && <span className="text-text-low">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
