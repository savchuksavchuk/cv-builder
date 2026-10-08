import { CvCreateForm } from '@/features/cv-create'
import { CvStepper, WizardStep } from '@/features/cv-wizard'

export const CvNewPage = () => (
  <div className="flex flex-col gap-6">
    <h1 className="text-xl font-semibold">New CV</h1>
    <CvStepper current={WizardStep.Input} />
    <CvCreateForm />
  </div>
)
