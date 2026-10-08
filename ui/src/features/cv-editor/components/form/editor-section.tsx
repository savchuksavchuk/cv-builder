import type { ReactNode } from 'react'

export const EditorSection = ({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) => (
  <section className="grid gap-4">
    <h2 className="border-b pb-1 font-semibold">{title}</h2>
    {children}
  </section>
)
