import { Loader2 } from 'lucide-react'
import { Link } from 'react-router'
import { Button } from '@/shared/ui/button'
import { useCvs } from '../hooks/use-cvs'
import { CvCard } from './cv-card'

export const CvList = () => {
  const { data, page, totalPages, setPage, isPending, isError, refetch } =
    useCvs()

  if (isPending) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="text-muted-foreground animate-spin" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <p className="text-muted-foreground text-sm">Could not load your CVs</p>
        <Button variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  if (data.total === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-12">
        <p className="text-muted-foreground text-sm">You have no CVs yet</p>
        <Button asChild>
          <Link to="/cvs/new">Create your first CV</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {data.items.map((cv) => (
        <CvCard key={cv.id} cv={cv} />
      ))}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-muted-foreground text-sm">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
