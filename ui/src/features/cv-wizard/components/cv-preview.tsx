import { renderCvHtml, type CvDocument } from '@cv-builder/cv-template'
import { useEffect, useRef, useState } from 'react'

const A4_WIDTH = 794
const A4_HEIGHT = 1123

export const CvPreview = ({ document }: { document: CvDocument }) => {
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [height, setHeight] = useState(A4_HEIGHT)

  useEffect(() => {
    const wrapper = wrapperRef.current
    if (!wrapper) {
      return
    }

    const observer = new ResizeObserver(([entry]) =>
      setScale(Math.min(1, entry.contentRect.width / A4_WIDTH)),
    )
    observer.observe(wrapper)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={wrapperRef}
      className="w-full overflow-hidden rounded-lg border bg-white"
      style={{ height: height * scale }}
    >
      <iframe
        title="CV preview"
        srcDoc={renderCvHtml(document)}
        sandbox="allow-same-origin"
        style={{
          width: A4_WIDTH,
          height,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
        }}
        onLoad={(e) =>
          setHeight(
            Math.max(
              A4_HEIGHT,
              e.currentTarget.contentDocument?.documentElement.scrollHeight ??
                0,
            ),
          )
        }
      />
    </div>
  )
}
