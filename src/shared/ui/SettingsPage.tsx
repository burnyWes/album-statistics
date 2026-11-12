import { useEffect, useRef, type ReactNode } from 'react'

export type SettingsEntry =
  | {
      kind: 'toggle'
      id: string
      label: string
      enabled: boolean
      onToggle: () => void
    }
  | { kind: 'action'; id: string; label: string; onSelect: () => void }

type SettingsPageProps = {
  navigation: ReactNode
  entries: readonly SettingsEntry[]
  headingFocusRequest: number
  focusedEntry: string | null
}

export function SettingsPage({
  navigation,
  entries,
  headingFocusRequest,
  focusedEntry,
}: SettingsPageProps) {
  const heading = useRef<HTMLHeadingElement>(null)
  const entryButtons = useRef(new Map<string, HTMLButtonElement>())

  useEffect(() => {
    const focusedButton =
      focusedEntry === null ? undefined : entryButtons.current.get(focusedEntry)
    ;(focusedButton ?? heading.current)?.focus()
  }, [headingFocusRequest, focusedEntry])

  function entryControl(entry: SettingsEntry) {
    switch (entry.kind) {
      case 'toggle':
        return (
          <label className="settingsToggle">
            <span>{entry.label}</span>
            <input
              type="checkbox"
              checked={entry.enabled}
              onChange={entry.onToggle}
            />
          </label>
        )
      case 'action':
        return (
          <button
            type="button"
            className="rowButton"
            onClick={entry.onSelect}
            ref={(button) => {
              if (button === null) return
              entryButtons.current.set(entry.id, button)
              return () => {
                entryButtons.current.delete(entry.id)
              }
            }}
          >
            {entry.label}
          </button>
        )
    }
  }

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            Einstellungen
          </h1>
        </div>
        <ul className="itemList">
          {entries.map((entry) => (
            <li key={entry.id} className="listRow">
              {entryControl(entry)}
            </li>
          ))}
        </ul>
      </main>
    </>
  )
}
