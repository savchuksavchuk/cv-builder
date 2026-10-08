import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { signIn, signUp } from '@/entities/auth'
import { ME_QUERY_KEY } from '@/entities/user'
import { ApiError } from '@/shared/api/api-error'
import {
  CredentialsSchema,
  type CredentialsFormData,
} from '../utils/credentials.schema'

export type AuthMode = 'sign-in' | 'sign-up'

const errorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 401) {
      return 'Invalid email or password'
    }

    if (error.status === 400) {
      return error.message
    }
  }
  return 'Server error, please try again later'
}

export const useAuthForm = (mode: AuthMode) => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const form = useForm<CredentialsFormData>({
    resolver: zodResolver(CredentialsSchema),
  })

  const { mutate, isPending, error } = useMutation({
    mutationFn: async (data: CredentialsFormData) => {
      if (mode === 'sign-up') {
        await signUp(data)
      }
      await signIn(data)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [ME_QUERY_KEY] })
      navigate('/', { replace: true })
    },
  })

  return {
    form,
    isPending,
    error: error ? errorMessage(error) : null,
    onSubmit: form.handleSubmit((data) => mutate(data)),
  }
}
