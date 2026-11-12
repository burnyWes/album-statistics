import { useRef, type ChangeEvent, type RefObject } from 'react'
import { TrashIcon } from '../../shared/ui/TrashIcon'
import type { Cover } from '../domain/cover'
import { ImageIcon } from './ImageIcon'

type CoverFieldProps = {
  cover: Cover | null
  chooseButton: RefObject<HTMLButtonElement | null>
  onChooseFile: (file: File) => void
  onRemove: () => void
}

export function CoverField({
  cover,
  chooseButton,
  onChooseFile,
  onRemove,
}: CoverFieldProps) {
  const fileInput = useRef<HTMLInputElement>(null)

  function chooseFile(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget
    const file = input.files?.[0]
    input.value = ''
    if (file !== undefined) onChooseFile(file)
  }

  return (
    <fieldset className="coverField">
      <legend>Album-Cover (optional)</legend>
      <div className="coverFieldContent">
        {cover !== null && (
          <img className="coverPreview" src={cover} alt="Album-Cover" />
        )}
        <div className="coverFieldButtons">
          <button
            type="button"
            ref={chooseButton}
            aria-describedby="albumFailure"
            onClick={() => fileInput.current?.click()}
          >
            <ImageIcon />
            {cover === null ? 'Cover wählen' : 'Cover ändern'}
          </button>
          {cover !== null && (
            <button type="button" onClick={onRemove}>
              <TrashIcon />
              Cover entfernen
            </button>
          )}
        </div>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        className="visuallyHidden"
        tabIndex={-1}
        aria-hidden="true"
        aria-label="Bild für das Album-Cover"
        onChange={chooseFile}
      />
    </fieldset>
  )
}
