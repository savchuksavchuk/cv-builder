import { Link } from 'react-router'
import { CvList } from '@/features/cv-list'
import { Button } from '@/shared/ui/button'

export const HomePage = () => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center justify-between gap-3">
      <h1 className="text-xl font-semibold">My CVs</h1>
      <Button asChild>
        <Link to="/cvs/new">New CV</Link>
      </Button>
    </div>
    <CvList />
  </div>
)
