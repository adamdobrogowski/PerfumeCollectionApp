import { Badge, Group, Paper, Stack, Text } from '@mantine/core'
import { GENDER_LABELS } from './labels.js'
import { getDisplayName } from './names.js'

function formatRating(sourceRating) {
  if (sourceRating === null) {
    return 'brak oceny'
  }
  const value = sourceRating.value.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${value} (${sourceRating.count.toLocaleString('pl-PL')})`
}

// Jeden wynik na liście: nazwa, marka, płeć, rodzina, ocena i akordy w kolejności wyczuwalności.
function PerfumeResultRow({ perfume }) {
  const details = [perfume.brand.name, GENDER_LABELS[perfume.gender], perfume.family.name]

  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" align="flex-start" wrap="nowrap">
        <Stack gap={2}>
          <Text fw={500}>{perfume.name}</Text>
          <Text size="sm" c="dimmed">
            {details.filter(Boolean).join(' · ')}
          </Text>
        </Stack>
        <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
          {formatRating(perfume.sourceRating)}
        </Text>
      </Group>
      {perfume.accords.length > 0 && (
        <Group gap={6} mt="xs">
          {perfume.accords.map((accord) => {
            const { main, other } = getDisplayName(accord)
            return (
              <Badge key={accord.id} variant="light" color="gray" tt="none" fw={400}>
                {main}
                {other && (
                  <Text span c="dimmed" inherit>
                    {' · '}
                    {other}
                  </Text>
                )}
              </Badge>
            )
          })}
        </Group>
      )}
    </Paper>
  )
}

export default PerfumeResultRow