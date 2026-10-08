import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CvApi,
  CVS_QUERY_KEY,
  type Cv,
  type CvDocument,
  type UpdateCvBody,
} from '@/entities/cv'
import { ApiError } from '@/shared/api/api-error'

const toBody = (version: number, document: CvDocument): UpdateCvBody => ({
  ...document,
  version,
  experience: document.experience.map((job) => ({
    ...job,
    bullets: job.bullets.map(({ id, text }) => ({ id, text })),
  })),
})

const errorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return 'The CV was changed elsewhere and has been reloaded, please save again'
    }

    if (error.status === 400) {
      return error.message
    }
  }
  return 'Server error, please try again later'
}

export const useUpdateCv = (cv: Cv) => {
  const queryClient = useQueryClient()

  const { mutate, isPending, error, reset } = useMutation({
    mutationFn: (document: CvDocument) =>
      CvApi.update(cv.id, toBody(cv.version, document)),
    onSuccess: (updated) =>
      queryClient.setQueryData([CVS_QUERY_KEY, cv.id], updated),
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: [CVS_QUERY_KEY] }),
  })

  return {
    update: mutate,
    isPending,
    error: error ? errorMessage(error) : null,
    reset,
  }
}
