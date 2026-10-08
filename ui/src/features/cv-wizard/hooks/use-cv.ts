import { useQuery } from '@tanstack/react-query'
import { CvApi, CvStatus, CvStep, CVS_QUERY_KEY } from '@/entities/cv'

const POLL_INTERVAL_MS = 2500

export const useCv = (id: string) => {
  const { data, isPending, error } = useQuery({
    queryKey: [CVS_QUERY_KEY, id],
    queryFn: () => CvApi.getOne(id),
    staleTime: 0,
    refetchInterval: ({ state: { data } }) =>
      data &&
      (data.status !== CvStatus.Processing ||
        data.currentStep === CvStep.AnswerQuestions)
        ? false
        : POLL_INTERVAL_MS,
  })

  return { cv: data, isPending, error }
}
