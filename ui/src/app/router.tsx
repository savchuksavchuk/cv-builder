import { createBrowserRouter } from 'react-router'
import { HomePage } from '@/pages/home/home.page'

export const router = createBrowserRouter([{ path: '/', element: <HomePage /> }])
