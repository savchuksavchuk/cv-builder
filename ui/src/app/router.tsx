import { createBrowserRouter, Navigate } from 'react-router'
import { RequireAuth, RequireGuest } from '@/features/auth'
import { CvPage } from '@/pages/cv/cv.page'
import { CvNewPage } from '@/pages/cv-new/cv-new.page'
import { HomePage } from '@/pages/home/home.page'
import { SignInPage } from '@/pages/sign-in/sign-in.page'
import { SignUpPage } from '@/pages/sign-up/sign-up.page'
import { AppLayout } from '@/widgets/app-layout/app-layout'

export const router = createBrowserRouter([
  {
    element: <RequireGuest />,
    children: [
      { path: '/sign-in', element: <SignInPage /> },
      { path: '/sign-up', element: <SignUpPage /> },
    ],
  },
  {
    element: <RequireAuth />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/cvs/new', element: <CvNewPage /> },
          { path: '/cvs/:id', element: <CvPage /> },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
