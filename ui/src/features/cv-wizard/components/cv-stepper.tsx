import { cn } from '@/shared/lib/utils'
import { WIZARD_STEPS, type WizardStep } from '../utils/wizard-step'

export const CvStepper = ({ current }: { current: WizardStep }) => {
  const index = WIZARD_STEPS.findIndex((step) => step.id === current)

  return (
    <>
      <p className="text-sm font-medium sm:hidden">
        Step {index + 1} of {WIZARD_STEPS.length} · {WIZARD_STEPS[index].label}
      </p>
      <ol className="hidden items-center gap-2 sm:flex">
        {WIZARD_STEPS.map((step, i) => (
          <li
            key={step.id}
            className={cn(
              'flex flex-1 items-center gap-2 text-sm',
              i > index && 'text-muted-foreground',
              i === index && 'font-medium',
            )}
          >
            <span
              className={cn(
                'flex size-6 shrink-0 items-center justify-center rounded-full border text-xs',
                i <= index &&
                  'bg-primary text-primary-foreground border-primary',
              )}
            >
              {i + 1}
            </span>
            {step.label}
          </li>
        ))}
      </ol>
    </>
  )
}
