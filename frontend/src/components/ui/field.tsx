import type { InputHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

type FieldProps = {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  children: ReactNode
  className?: string
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: FieldProps) {
  return (
    <div className={cn('block', className)}>
      <label htmlFor={htmlFor} className="type-label mb-2 block">
        {label}
      </label>

      {children}

      {error ? (
        <p className="type-secondary mt-2 text-destructive">{error}</p>
      ) : hint ? (
        <p className="type-secondary mt-2 text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  )
}

export const fieldControlClassName =
  'form-control w-full disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive'

type TextFieldProps = {
  label: string
  hint?: string
  error?: string
} & InputHTMLAttributes<HTMLInputElement>

export function TextField({
  label,
  hint,
  error,
  className,
  id,
  name,
  ...props
}: TextFieldProps) {
  const inputId = id ?? name

  return (
    <Field label={label} htmlFor={inputId} hint={hint} error={error}>
      <input
        id={inputId}
        name={name}
        className={cn(fieldControlClassName, className)}
        aria-invalid={error ? true : undefined}
        {...props}
      />
    </Field>
  )
}
