import { cva } from 'class-variance-authority'

export { default as Badge } from './Badge.vue'

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold leading-4 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 [&_svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        destructive: 'border-transparent bg-destructive/10 text-destructive',
        outline: 'text-foreground',
        success: 'border-transparent bg-success/10 text-success',
        warning: 'border-transparent bg-warning/15 text-warning-foreground',
        info: 'border-transparent bg-info/10 text-info',
        muted: 'border-transparent bg-muted text-muted-foreground',
        purple: 'border-transparent bg-purple/10 text-purple',
        pink: 'border-transparent bg-pink/10 text-pink',
        cyan: 'border-transparent bg-cyan/10 text-cyan',
        orange: 'border-transparent bg-orange/10 text-orange',
        indigo: 'border-transparent bg-indigo/10 text-indigo',
      },
    },
    defaultVariants: { variant: 'default' },
  },
)
