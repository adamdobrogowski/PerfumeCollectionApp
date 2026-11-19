import { Stack, Text } from '@mantine/core'

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

function Rating({ sourceRating, large = false, color, align = 'flex-end' }) {
  if (sourceRating === null) {
    return (
      <Text size="sm" c={color ?? 'dimmed'} style={{ whiteSpace: 'nowrap' }}>
        brak oceny
      </Text>
    )
  }
  const value = sourceRating.value.toLocaleString('pl-PL', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return (
    <Stack gap={0} align={align}>
      <Text fw={500} size={large ? 'xl' : 'md'} c={color} style={{ whiteSpace: 'nowrap' }}>
        ★ {value}
      </Text>
      <Text size="xs" c={color ?? 'dimmed'} style={{ whiteSpace: 'nowrap' }}>
        {formatRatingCount(sourceRating.count)}
      </Text>
    </Stack>
  )
}

export default Rating