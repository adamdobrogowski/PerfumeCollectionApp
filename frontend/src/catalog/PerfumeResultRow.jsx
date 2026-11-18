import { Badge, Group, Paper, Stack, Text } from '@mantine/core'
import AccordBadge from './AccordBadge.jsx'
import { GENDER_LABELS } from './labels.js'
import PerfumeCover from './PerfumeCover.jsx'

function capitalizeFirst(text) {
  return text[0].toUpperCase() + text.slice(1)
}

function formatRatingCount(count) {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100
  let word = 'ocen'
  if (count === 1) {
    word = 'ocena'
  } else if (lastDigit >= 2 && lastDigit <= 4 && (lastTwoDigits < 12 || lastTwoDigits > 14)) {
    word = 'oceny'
  }
  return `${count.toLocaleString('pl-PL')} ${word}`
}

function Rating({ sourceRating }) {
  if (sourceRating === null) {
    return (
      <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
        brak oceny
      </Text>
    )
  }
  const value = sourceRating.value.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return (
    <Stack gap={0} align="flex-end">
      <Text fw={500} style={{ whiteSpace: 'nowrap' }}>
        ★ {value}
      </Text>
      <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
        {formatRatingCount(sourceRating.count)}
      </Text>
    </Stack>
  )
}

function PerfumeResultRow({ perfume }) {
  const details = [
    GENDER_LABELS[perfume.gender] && capitalizeFirst(GENDER_LABELS[perfume.gender]),
    perfume.releaseYear,
    perfume.family.name,
  ].filter(Boolean)

  return (
    <Paper withBorder p="md" radius="md">
      <Group wrap="nowrap" align="center" gap="md">
        <PerfumeCover brandName={perfume.brand.name} familyId={perfume.family.id} />
        <Stack gap={6} style={{ flex: 1, minWidth: 0 }}>
          <Stack gap={0}>
            <Text size="xs" c="dimmed">
              {perfume.brand.name}
            </Text>
            <Text fw={500}>{perfume.name}</Text>
          </Stack>
          <Group gap={6}>
            {details.map((detail) => (
              <Badge key={detail} variant="light" color="gray" tt="none" fw={400}>
                {detail}
              </Badge>
            ))}
          </Group>
          {perfume.accords.length > 0 && (
            <Group gap={6}>
              {perfume.accords.map((accord) => (
                <AccordBadge key={accord.id} accord={accord} />
              ))}
            </Group>
          )}
        </Stack>
        <Rating sourceRating={perfume.sourceRating} />
      </Group>
    </Paper>
  )
}

export default PerfumeResultRow