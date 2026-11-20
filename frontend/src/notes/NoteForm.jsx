import { Button, Group, SegmentedControl, Stack, Text, Textarea } from '@mantine/core'
import { useForm } from '@mantine/form'
import {
  LEVEL_LABELS,
  LEVEL_OPTIONS,
  NOTE_MAX_LENGTH,
  controlToLevel,
  getNoteLength,
  getNoteProblem,
  levelToControl,
} from './noteRules.js'
import { useSaveNote } from './useSaveNote.js'

function LevelField({ label, value, onChange }) {
  return (
    <Stack gap={4}>
      <Text size="sm" fw={500}>
        {label}
      </Text>
      <SegmentedControl
        size="xs"
        w="fit-content"
        data={LEVEL_OPTIONS}
        value={levelToControl(value)}
        onChange={(next) => onChange(controlToLevel(next))}
      />
      <Text size="xs" c="dimmed">
        {value === null ? 'Bez oceny' : `${LEVEL_LABELS[value]} (${value}/5)`}
      </Text>
    </Stack>
  )
}

function NoteForm({ perfumeId, initialNote, onClose }) {
  const save = useSaveNote(perfumeId)

  const form = useForm({
    initialValues: {
      body: initialNote?.body ?? '',
      longevity: initialNote?.longevity ?? null,
      projection: initialNote?.projection ?? null,
    },
    validate: { body: getNoteProblem },
  })

  const length = getNoteLength(form.values.body)

  function handleSubmit(values) {
    save.mutate(values, { onSuccess: onClose })
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Textarea
          label="Treść notatki"
          autosize
          minRows={4}
          maxRows={12}
          {...form.getInputProps('body')}
        />
        <Text size="xs" c={length > NOTE_MAX_LENGTH ? 'red' : 'dimmed'} ta="right">
          {length} / {NOTE_MAX_LENGTH}
        </Text>
        <Group align="flex-start" gap="xl">
          <LevelField
            label="Trwałość"
            value={form.values.longevity}
            onChange={(level) => form.setFieldValue('longevity', level)}
          />
          <LevelField
            label="Projekcja"
            value={form.values.projection}
            onChange={(level) => form.setFieldValue('projection', level)}
          />
        </Group>
        <Group>
          <Button type="submit" loading={save.isPending}>
            Zapisz
          </Button>
          <Button variant="default" disabled={save.isPending} onClick={onClose}>
            Anuluj
          </Button>
        </Group>
      </Stack>
    </form>
  )
}

export default NoteForm