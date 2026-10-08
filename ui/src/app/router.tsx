import { createBrowserRouter, Navigate } from 'react-router'
import { RequireAuth, RequireGuest } from '@/features/auth'
import { HomePage } from '@/pages/home/home.page'
import { SignInPage } from '@/pages/sign-in/sign-in.page'
import { SignUpPage } from '@/pages/sign-up/sign-up.page'

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
    children: [{ path: '/', element: <HomePage /> }],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
