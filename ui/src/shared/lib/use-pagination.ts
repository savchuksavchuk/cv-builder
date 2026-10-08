import { useSearchParams } from 'react-router'

export const usePagination = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '', 10) || 1)

  const setPage = (next: number) =>
    setSearchParams((prev) => {
      prev.set('page', String(next))
      return prev
    })

  return { page, setPage }
}
