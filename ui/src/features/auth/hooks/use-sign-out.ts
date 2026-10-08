import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { AuthApi } from '@/entities/auth'

export const useSignOut = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { mutate, isPending } = useMutation({
    mutationFn: () => AuthApi.signOut(),
    onSettled: () => {
      queryClient.clear()
      navigate('/sign-in', { replace: true })
    },
  })

  return { signOut: () => mutate(), isPending }
}
