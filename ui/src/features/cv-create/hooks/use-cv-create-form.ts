import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { CvApi, CVS_QUERY_KEY } from '@/entities/cv'
import { ApiError } from '@/shared/api/api-error'
import {
  CvCreateSchema,
  type CvCreateFormData,
} from '../utils/cv-create.schema'

const errorMessage = (error: unknown) => {
  if (error instanceof ApiError) {
    if (error.status === 413) {
      return 'File is larger than 10 MB'
    }

    if (error.status === 415) {
      return 'Only PDF files are supported'
    }

    if (error.status === 400) {
      return error.message
    }

    if (error.status === 503) {
      return 'Could not start generation, please try again'
    }
  }
  return 'Server error, please try again later'
}

const toFormData = ({ targetRole, text, file }: CvCreateFormData) => {
  const body = new FormData()
  body.append('targetRole', targetRole)
  if (text.trim()) {
    body.append('text', text)
  }

  if (file) {
    body.append('file', file)
  }
  return body
}

export const useCvCreateForm = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  const form = useForm<CvCreateFormData>({
    resolver: zodResolver(CvCreateSchema),
    defaultValues: { targetRole: '', text: '' },
  })

  const { mutate, isPending, error } = useMutation({
    mutationFn: (data: CvCreateFormData) => CvApi.create(toFormData(data)),
    onSuccess: async ({ id }) => {
      await queryClient.invalidateQueries({ queryKey: [CVS_QUERY_KEY] })
      navigate(`/cvs/${id}`)
    },
  })

  return {
    form,
    isPending,
    error: error ? errorMessage(error) : null,
    onSubmit: form.handleSubmit((data) => mutate(data)),
  }
}
