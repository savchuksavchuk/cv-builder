import { useQuery } from '@tanstack/react-query'
import { ME_QUERY_KEY, UserApi } from '@/entities/user'

export const useMe = () => {
  const { data, isPending, isError } = useQuery({
    queryKey: [ME_QUERY_KEY],
    queryFn: () => UserApi.getMe(),
    retry: false,
  })

  return { user: data, isPending, isError }
}
