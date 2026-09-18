import type { ReactNode } from 'react'

import { Card } from '@/components/ui/card'
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  PackageOpen,
} from 'lucide-react'

type FlowStateKind = 'loading' | 'empty' | 'error' | 'success'

type FlowStateProps = {
  kind: FlowStateKind
  title: string
  description: string
  action?: ReactNode
}

const icons = {
  loading: LoaderCircle,
  empty: PackageOpen,
  error: AlertCircle,
  success: CheckCircle2,
}

export function FlowState({
  kind,
  title,
  description,
  action,
}: FlowStateProps) {
  const Icon = icons[kind]

  return (
    <Card role={kind === 'error' ? 'alert' : 'status'} className="p-6">
      <Icon
        aria-hidden="true"
        className={[
          'size-6',
          kind === 'error' ? 'text-destructive' : 'text-primary',
          kind === 'loading' ? 'animate-spin' : '',
        ].join(' ')}
      />

      <h2 className="mt-4 text-lg font-medium">{title}</h2>

      <p className="type-secondary mt-2 max-w-xl text-muted-foreground">
        {description}
      </p>

      {action ? <div className="mt-5">{action}</div> : null}
    </Card>
  )
}
