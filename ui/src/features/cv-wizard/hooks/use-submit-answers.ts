import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CvApi, CVS_QUERY_KEY, type CvAnswer } from '@/entities/cv'
import { ApiError } from '@/shared/api/api-error'

const errorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 409) {
      return 'The questions have changed, please review and submit again'
    }

    if (error.status === 503) {
      return 'Could not continue generation, please try again'
    }
  }
  return 'Server error, please try again later'
}

export const useSubmitAnswers = (id: string) => {
  const queryClient = useQueryClient()
  const queryKey = [CVS_QUERY_KEY, id]

  const { mutate, isPending, error } = useMutation({
    mutationFn: (answers: CvAnswer[]) => CvApi.submitAnswers(id, answers),
    onSuccess: (cv) => queryClient.setQueryData(queryKey, cv),
    onSettled: () => queryClient.invalidateQueries({ queryKey }),
  })

  return {
    submit: mutate,
    isPending,
    error: error ? errorMessage(error) : null,
  }
}
