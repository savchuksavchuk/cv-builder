import { useQuery } from '@tanstack/react-query'
import { getMe, ME_QUERY_KEY } from '@/entities/user'

export const useMe = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: [ME_QUERY_KEY],
    queryFn: getMe,
    retry: false,
  })

  return { user: data, isPending, isError }
}
