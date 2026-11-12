import { useEffect, useRef } from 'react'

export function useHeadingFocus(focusRequest = 0) {
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    heading.current?.focus()
  }, [focusRequest])

  return heading
}
