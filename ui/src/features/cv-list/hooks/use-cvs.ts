import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { CvApi, CVS_QUERY_KEY } from '@/entities/cv'
import { usePagination } from '@/shared/lib/use-pagination'

const LIMIT = 10

export const useCvs = () => {
  const { page, setPage } = usePagination()

  const { data, isPending, isError, refetch } = useQuery({
    queryKey: [CVS_QUERY_KEY, page],
    queryFn: () => CvApi.getList({ page, limit: LIMIT }),
    placeholderData: keepPreviousData,
  })

  return {
    data,
    page,
    totalPages: data ? Math.ceil(data.total / data.limit) : 0,
    setPage,
    isPending,
    isError,
    refetch,
  }
}
