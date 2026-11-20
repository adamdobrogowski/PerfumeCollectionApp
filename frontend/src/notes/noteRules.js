export const NOTE_MAX_LENGTH = 2000

export const LEVEL_LABELS = { 1: 'bardzo mała', 2: 'mała', 3: 'średnia', 4: 'duża', 5: 'bardzo duża' }

export const LEVEL_OPTIONS = [
  { value: '0', label: '–' },
  ...[1, 2, 3, 4, 5].map((level) => ({ value: String(level), label: String(level) })),
]

export function levelToControl(level) {
  return level === null ? '0' : String(level)
}

export function controlToLevel(value) {
  return value === '0' ? null : Number(value)
}

export function getNoteLength(text) {
  return Array.from(text.trim()).length
}

export function getNoteProblem(text) {
  if (text.trim() === '') {
    return 'Treść notatki nie może być pusta.'
  }
  if (getNoteLength(text) > NOTE_MAX_LENGTH) {
    return `Notatka może mieć najwyżej ${NOTE_MAX_LENGTH} znaków.`
  }
  return null
}