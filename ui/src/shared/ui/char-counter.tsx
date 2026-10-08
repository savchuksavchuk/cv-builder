import { cn } from '@/shared/lib/utils'

export const CharCounter = ({ length, max }: { length: number; max: number }) => (
  <p
    className={cn(
      'text-muted-foreground text-right text-xs',
      length > max && 'text-destructive',
    )}
  >
    {length.toLocaleString('en-US')} / {max.toLocaleString('en-US')}
  </p>
)
