import { Box, Group, Stack, Text, Tooltip } from '@mantine/core'
import { Link } from 'react-router'
import { getDisplayName } from '../shared/perfume/names.js'
import classes from './NotesPyramid.module.css'

const LAYERS = [
  { key: 'top', label: 'Nuty głowy', shade: 0.07 },
  { key: 'middle', label: 'Nuty serca', shade: 0.13 },
  { key: 'base', label: 'Nuty bazy', shade: 0.2 },
]

function groupByGeneralNote(notes) {
  const groups = new Map()
  for (const note of notes) {
    if (!groups.has(note.generalNote.id)) {
      groups.set(note.generalNote.id, { generalNote: note.generalNote, specificNames: [] })
    }
    groups.get(note.generalNote.id).specificNames.push(note.name)
  }
  return [...groups.values()]
}

function NoteChip({ group }) {
  const { main, other } = getDisplayName(group.generalNote)
  const details = group.specificNames.filter(
    (name) => name.toLowerCase() !== group.generalNote.name.toLowerCase(),
  )
  const extra = details.length > 0 ? details.join(', ') : other

  return (
    <Tooltip label={`Pokaż w katalogu perfumy z nutą „${main}”`} openDelay={300} withArrow>
      <Box component={Link} to={`/catalog?notes=${group.generalNote.id}`} className={classes.note}>
        <Text span size="sm">
          {main}
        </Text>
        {extra && (
          <Text span size="xs" c="dimmed">
            {extra}
          </Text>
        )}
      </Box>
    </Tooltip>
  )
}

function NotesPyramid({ notes }) {
  const layers = LAYERS.map((layer) => ({ ...layer, groups: groupByGeneralNote(notes[layer.key] ?? []) })).filter(
    (layer) => layer.groups.length > 0,
  )

  if (layers.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Brak danych o nutach dla tych perfum.
      </Text>
    )
  }

  return (
    <Stack gap={6}>
      {layers.map((layer) => (
        <Stack
          key={layer.key}
          gap={6}
          p="sm"
          style={{ borderRadius: 8, background: `rgba(128, 128, 128, ${layer.shade})` }}
        >
          <Text size="xs" fw={500} c="dimmed">
            {layer.label}
          </Text>
          <Group gap={6}>
            {layer.groups.map((group) => (
              <NoteChip key={group.generalNote.id} group={group} />
            ))}
          </Group>
        </Stack>
      ))}
    </Stack>
  )
}

export default NotesPyramid