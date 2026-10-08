import { CircleAlert, Loader2 } from 'lucide-react'
import { Link } from 'react-router'
import { CvStatus, STEP_LABELS, type Cv } from '@/entities/cv'
import { ApiError } from '@/shared/api/api-error'
import { Button } from '@/shared/ui/button'
import { useCv } from '../hooks/use-cv'
import { getWizardStep, WizardStep } from '../utils/wizard-step'
import { CvResult } from './cv-result'
import { CvStepper } from './cv-stepper'
import { QuestionsForm } from './questions-form'

export const CvWizard = ({ id }: { id: string }) => {
  const { cv, isPending, error } = useCv(id)

  if (isPending) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="text-muted-foreground animate-spin" />
      </div>
    )
  }

  if (!cv) {
    const notFound =
      error instanceof ApiError && [400, 404].includes(error.status)

    return (
      <Message text={notFound ? 'CV not found' : 'Could not load the CV'}>
        <Button asChild variant="outline">
          <Link to="/">Back to my CVs</Link>
        </Button>
      </Message>
    )
  }

  const step = getWizardStep(cv)
  const failed = cv.status === CvStatus.Failed

  if (!step && !failed) {
    return <Message text="Something went wrong" />
  }

  return (
    <div className="flex flex-col gap-6">
      <h1 className="truncate text-xl font-semibold">{cv.targetRole}</h1>
      {step && <CvStepper current={step} failed={failed} />}
      {failed ? (
        <FailureNotice cv={cv} />
      ) : (
        step && <Panel cv={cv} step={step} />
      )}
    </div>
  )
}

const FailureNotice = ({ cv }: { cv: Cv }) => (
  <div className="border-destructive/50 bg-destructive/5 flex flex-col gap-4 rounded-lg border p-4">
    <div className="flex gap-3">
      <CircleAlert className="text-destructive mt-0.5 size-5 shrink-0" />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-medium">Generation failed</p>
        {cv.currentStep && (
          <p className="text-muted-foreground text-sm">
            Failed at: {STEP_LABELS[cv.currentStep]}
          </p>
        )}
        {cv.failureReason && (
          <p className="text-sm break-words">{cv.failureReason}</p>
        )}
      </div>
    </div>
    <div className="flex flex-col gap-2 sm:flex-row">
      <Button asChild>
        <Link to="/cvs/new">Create a new CV</Link>
      </Button>
      <Button asChild variant="outline">
        <Link to="/">Back to my CVs</Link>
      </Button>
    </div>
  </div>
)

const Message = ({
  text,
  children,
}: {
  text: string
  children?: React.ReactNode
}) => (
  <div className="flex flex-col items-center gap-3 py-12 text-center">
    <p className="text-muted-foreground text-sm">{text}</p>
    {children}
  </div>
)

const Panel = ({ cv, step }: { cv: Cv; step: WizardStep }) => {
  if (step === WizardStep.Questions && cv.questions.length > 0) {
    return (
      <QuestionsForm
        key={cv.questions.map((q) => q.id).join()}
        cvId={cv.id}
        questions={cv.questions}
      />
    )
  }

  if (cv.status === CvStatus.Completed) {
    return <CvResult cv={cv} />
  }

  return (
    <div className="flex flex-col items-center gap-3 py-12">
      <Loader2 className="text-muted-foreground animate-spin" />
      <p className="text-sm">{cv.currentStep && STEP_LABELS[cv.currentStep]}</p>
    </div>
  )
}
