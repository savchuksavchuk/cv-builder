import { useParams } from 'react-router'

export const CvPage = () => {
  const { id } = useParams()

  return <h1 className="text-xl font-semibold">CV {id}</h1>
}
