import { getVertical, type VerticalCode } from '@/lib/verticals';
import { cn } from '@/lib/utils/cn';

type VerticalBadgeProps = {
  vertical: VerticalCode | string | null | undefined;
  variant?: 'default' | 'compact' | 'icon-only' | 'dot';
  className?: string;
};

/**
 * Badge visual que identifica el vertical de un tenant.
 *
 * Variantes:
 *  - default:   ícono + label completo (para listas principales)
 *  - compact:   más pequeño (para tablas densas)
 *  - icon-only: solo el ícono en un cuadrado (para avatars/columnas estrechas)
 *  - dot:       un punto de color + label (para listados ligeros)
 *
 * Ejemplos:
 *   <VerticalBadge vertical="dental" />
 *   <VerticalBadge vertical={tenant.vertical} variant="compact" />
 *   <VerticalBadge vertical="legal" variant="icon-only" />
 */
export function VerticalBadge({
  vertical,
  variant = 'default',
  className,
}: VerticalBadgeProps) {
  const config = getVertical(vertical);
  const Icon = config.icon;

  if (variant === 'icon-only') {
    return (
      <span
        className={cn(
          'inline-flex items-center justify-center w-7 h-7 rounded-md border',
          config.color.badge,
          className
        )}
        title={config.label}
        aria-label={config.label}
      >
        <Icon className="w-4 h-4" />
      </span>
    );
  }

  if (variant === 'dot') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 text-sm',
          className
        )}
      >
        <span
          className={cn('w-2 h-2 rounded-full', config.color.dot)}
          aria-hidden
        />
        <span className={config.color.text}>{config.label}</span>
      </span>
    );
  }

  if (variant === 'compact') {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border',
          config.color.badge,
          className
        )}
      >
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  }

  // default
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors',
        config.color.badge,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </span>
  );
}