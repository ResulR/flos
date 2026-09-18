import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type BadgeTone = 'neutral' | 'positive' | 'warning' | 'danger'

type BadgeProps = {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

const badgeToneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-brand-gray-100 text-brand-gray-800',
  positive: 'bg-brand-black text-brand-white',
  warning: 'bg-primary text-primary-foreground',
  danger: 'bg-destructive text-white',
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex min-h-7 items-center rounded-md px-2.5 text-xs font-medium',
        badgeToneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
