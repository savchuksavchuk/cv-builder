import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'sonner'
import { RouterProvider } from 'react-router/dom'
import { QueryProvider } from './providers/query-provider'
import { router } from './router'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryProvider>
      <RouterProvider router={router} />
      <Toaster position="top-center" />
    </QueryProvider>
  </StrictMode>,
)
