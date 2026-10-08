import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { CvApi } from '@/entities/cv'

const save = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

export const useDownloadCvPdf = (id: string) => {
  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const toastId = toast.loading('Downloading…')
      try {
        const { blob, fileName } = await CvApi.downloadPdf(id)
        save(blob, fileName)
        toast.success('PDF downloaded', { id: toastId })
      } catch (error) {
        toast.error('Could not download the PDF, please try again', {
          id: toastId,
        })
        throw error
      }
    },
  })

  return { download: mutate, isDownloading: isPending }
}
