import { X } from 'lucide-react'
import { cn } from '@/shared/lib/utils'
import { WIZARD_STEPS, type WizardStep } from '../utils/wizard-step'

export const CvStepper = ({
  current,
  failed,
}: {
  current: WizardStep
  failed?: boolean
}) => {
  const index = WIZARD_STEPS.findIndex((step) => step.id === current)

  return (
    <>
      <p
        className={cn(
          'text-sm font-medium sm:hidden',
          failed && 'text-destructive',
        )}
      >
        Step {index + 1} of {WIZARD_STEPS.length} · {WIZARD_STEPS[index].label}
        {failed && ' · Failed'}
      </p>
      <ol className="hidden items-center gap-2 sm:flex">
        {WIZARD_STEPS.map((step, i) => {
          const isFailed = failed && i === index

          return (
            <li
              key={step.id}
              className={cn(
                'flex flex-1 items-center gap-2 text-sm',
                i > index && 'text-muted-foreground',
                i === index && 'font-medium',
                isFailed && 'text-destructive',
              )}
            >
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs',
                  i <= index &&
                    'bg-primary text-primary-foreground border-primary',
                  isFailed && 'bg-destructive border-destructive text-white',
                )}
              >
                {isFailed ? <X className="size-3.5" /> : i + 1}
              </span>
              {step.label}
            </li>
          )
        })}
      </ol>
    </>
  )
}
