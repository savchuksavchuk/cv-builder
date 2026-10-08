import { Navigate, useParams } from 'react-router'
import { CvWizard } from '@/features/cv-wizard'

export const CvPage = () => {
  const { id } = useParams()

  return id ? <CvWizard id={id} /> : <Navigate to="/" replace />
}
