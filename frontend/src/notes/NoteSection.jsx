import { useState } from 'react'
import { Alert, Badge, Button, Group, Modal, Skeleton, Stack, Text } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import CardSection from '../perfume/CardSection.jsx'
import { useShelfEntry } from '../shelf/useShelfEntry.js'
import NoteForm from './NoteForm.jsx'
import { LEVEL_LABELS } from './noteRules.js'
import { useDeleteNote } from './useDeleteNote.js'
import { useNote } from './useNote.js'

function NoteView({ note, canEdit, onEdit, onDelete }) {
  const levels = [
    note.longevity !== null && `Trwałość: ${LEVEL_LABELS[note.longevity]}`,
    note.projection !== null && `Projekcja: ${LEVEL_LABELS[note.projection]}`,
  ].filter(Boolean)

  return (
    <Stack gap="sm">
      <Text size="sm" style={{ whiteSpace: 'pre-wrap' }}>
        {note.body}
      </Text>
      {levels.length > 0 && (
        <Group gap={6}>
          {levels.map((level) => (
            <Badge key={level} variant="light" color="gray" tt="none" fw={400}>
              {level}
            </Badge>
          ))}
        </Group>
      )}
      <Text size="xs" c="dimmed">
        Zaktualizowano {new Date(note.updatedAt).toLocaleDateString('pl-PL')}
        {!canEdit && '. Aby edytować notatkę, dodaj perfumy do swojej półki.'}
      </Text>
      <Group gap="xs">
        {canEdit && (
          <Button variant="default" size="xs" onClick={onEdit}>
            Edytuj
          </Button>
        )}
        <Button variant="subtle" color="red" size="xs" onClick={onDelete}>
          Usuń
        </Button>
      </Group>
    </Stack>
  )
}

function NoteSection({ perfumeId }) {
  const noteQuery = useNote(perfumeId)
  const shelfQuery = useShelfEntry(perfumeId)
  const remove = useDeleteNote(perfumeId)
  const [editing, setEditing] = useState(false)
  const [confirmOpened, confirm] = useDisclosure(false)

  let content
  const failed = [noteQuery, shelfQuery].find((query) => query.isError)

  if (failed) {
    content = (
      <Alert color="red" title="Nie udało się pobrać notatki">
        <Stack gap="xs" align="flex-start">
          <Text size="sm">{failed.error.message}</Text>
          <Button variant="default" size="xs" onClick={() => failed.refetch()}>
            Spróbuj ponownie
          </Button>
        </Stack>
      </Alert>
    )
  } else if (noteQuery.isPending || shelfQuery.isPending) {
    content = <Skeleton height={72} radius="md" />
  } else {
    const note = noteQuery.data.note
    const onShelf = shelfQuery.data.entry !== null

    if (editing && onShelf) {
      content = <NoteForm perfumeId={perfumeId} initialNote={note} onClose={() => setEditing(false)} />
    } else if (note) {
      content = (
        <NoteView note={note} canEdit={onShelf} onEdit={() => setEditing(true)} onDelete={confirm.open} />
      )
    } else if (onShelf) {
      content = (
        <Stack gap="xs" align="flex-start">
          <Text size="sm" c="dimmed">
            Nie masz jeszcze notatki o tych perfumach.
          </Text>
          <Button variant="default" size="xs" onClick={() => setEditing(true)}>
            Dodaj notatkę
          </Button>
        </Stack>
      )
    } else {
      content = (
        <Text size="sm" c="dimmed">
          Notatkę możesz dodać, gdy perfumy są na Twojej półce.
        </Text>
      )
    }
  }

  return (
    <>
      <CardSection title="Twoja notatka" hint="Prywatna, widoczna tylko dla Ciebie.">
        {content}
      </CardSection>

      <Modal opened={confirmOpened} onClose={confirm.close} title="Usunąć notatkę?" centered>
        <Stack gap="md">
          <Text size="sm">Notatka o tych perfumach zostanie usunięta bezpowrotnie.</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={confirm.close}>
              Anuluj
            </Button>
            <Button color="red" loading={remove.isPending} onClick={() => remove.mutate(undefined, { onSuccess: confirm.close })}>
              Usuń
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}

export default NoteSection