import { Alert, Button, Group, Stack, Text, Title } from '@mantine/core'
import { LIKE_LEVELS } from '../shelf/shelfState.js'

const LEVEL_LABELS = Object.fromEntries(LIKE_LEVELS.map((level) => [level.strength, level.label]))

function perfumeName(perfume) {
  return `${perfume.brand.name} ${perfume.name}`
}

function SummaryStep({ liked, disliked, isSaving, error, onBack, onFinish }) {
  return (
    <Stack gap="md">
      <Text c="dimmed">
        Sprawdź swój wybór. Na jego podstawie przygotujemy pierwsze rekomendacje. Później możesz go zmienić na swojej
        półce.
      </Text>

      <Stack gap="xs">
        <Title order={4}>Lubiane ({liked.length})</Title>
        {liked.map(({ perfume, strength }) => (
          <Group key={perfume.id} justify="space-between" wrap="nowrap" gap="md">
            <Text size="sm">{perfumeName(perfume)}</Text>
            <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
              {LEVEL_LABELS[strength]}
            </Text>
          </Group>
        ))}
      </Stack>

      <Stack gap="xs">
        <Title order={4}>Nielubiane ({disliked.length})</Title>
        {disliked.map((perfume) => (
          <Text key={perfume.id} size="sm">
            {perfumeName(perfume)}
          </Text>
        ))}
      </Stack>

      {error && (
        <Alert color="red" title="Nie udało się zakończyć">
          {error.message}
        </Alert>
      )}

      <Group justify="space-between">
        <Button variant="default" disabled={isSaving} onClick={onBack}>
          Wstecz
        </Button>
        <Button loading={isSaving} onClick={onFinish}>
          Zakończ
        </Button>
      </Group>
    </Stack>
  )
}

export default SummaryStep