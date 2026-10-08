import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { signOut as signOutRequest } from '@/entities/auth'

export const useSignOut = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  const { mutate, isPending } = useMutation({
    mutationFn: signOutRequest,
    onSettled: () => {
      queryClient.clear()
      navigate('/sign-in', { replace: true })
    },
  })

  return { signOut: () => mutate(), isPending }
}
