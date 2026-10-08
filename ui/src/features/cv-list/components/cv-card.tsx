import { Link } from 'react-router'
import {
  CvStatus,
  needsAttention,
  STATUS_LABELS,
  STEP_LABELS,
  type CvSummary,
} from '@/entities/cv'
import { cn } from '@/shared/lib/utils'

const statusText = (cv: CvSummary) => {
  if (cv.status === CvStatus.Processing && cv.currentStep) {
    return STEP_LABELS[cv.currentStep]
  }

  return STATUS_LABELS[cv.status]
}

export const CvCard = ({ cv }: { cv: CvSummary }) => {
  const attention = needsAttention(cv)

  return (
    <Link
      to={`/cvs/${cv.id}`}
      className={cn(
        'hover:bg-accent flex flex-col gap-1 rounded-lg border p-4 transition-colors',
        attention && 'border-primary',
      )}
    >
      <span className="truncate font-medium">{cv.targetRole}</span>
      <span
        className={cn(
          'text-muted-foreground text-sm',
          cv.status === CvStatus.Failed && 'text-destructive',
          attention && 'text-primary font-medium',
        )}
      >
        {attention ? 'Needs your answers' : statusText(cv)}
      </span>
      <span className="text-muted-foreground text-xs">
        Updated {new Date(cv.updatedAt).toLocaleString()}
      </span>
    </Link>
  )
}
