import type { ReactNode } from 'react'
import { useHeadingFocus } from '../../shared/ui/useHeadingFocus'

export function AlbumsPage({ navigation }: { navigation: ReactNode }) {
  const heading = useHeadingFocus()

  return (
    <>
      {navigation}
      <main className="page pageBelowNavigation">
        <div className="pageHeader">
          <h1 ref={heading} tabIndex={-1}>
            Alben
          </h1>
          <button
            type="button"
            className="addItemButton"
            aria-label="Album hinzufügen"
            aria-disabled="true"
          >
            +
          </button>
        </div>
        <p>Noch keine Alben.</p>
      </main>
    </>
  )
}
