import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'type-button inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md border border-transparent transition-colors outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-primary-foreground hover:bg-brand-red-dark',
        secondary: 'bg-brand-black text-brand-white hover:bg-brand-charcoal',
        outline:
          'border-brand-black bg-transparent text-brand-black hover:bg-brand-gray-50',
        ghost: 'bg-transparent text-foreground hover:bg-muted',
        destructive: 'bg-destructive text-white hover:opacity-90',
        link: 'h-auto rounded-none border-0 bg-transparent p-0 text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'min-h-10 px-4',
        default: 'min-h-11 px-5',
        lg: 'min-h-12 px-6',
        icon: 'size-11 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'primary',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
