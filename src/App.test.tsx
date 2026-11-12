import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { App } from './App'
import { accessibilityViolations } from './testSupport/accessibility'

describe('App', () => {
  it('names the application in its main heading', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { level: 1, name: 'Album-Statistics' }),
    ).toBeInTheDocument()
  })

  it('has no accessibility violations', async () => {
    const { container } = render(<App />)

    expect(await accessibilityViolations(container)).toEqual([])
  })
})
