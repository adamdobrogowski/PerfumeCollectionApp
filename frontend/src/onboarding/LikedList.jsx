import { CloseButton, Group, Paper, SegmentedControl, Stack, Text } from '@mantine/core'
import { LIKE_LEVELS } from '../shelf/shelfState.js'

const STRENGTH_OPTIONS = LIKE_LEVELS.map((level) => ({ value: String(level.strength), label: level.label }))

function LikedList({ items, onChangeStrength, onRemove }) {
  return (
    <Stack gap="xs">
      {items.map(({ perfume, strength }) => (
        <Paper key={perfume.id} withBorder p="sm" radius="md">
          <Group justify="space-between" gap="sm" wrap="wrap">
            <Stack gap={0} style={{ flex: 1, minWidth: 140 }}>
              <Text size="xs" c="dimmed">
                {perfume.brand.name}
              </Text>
              <Text fw={500}>{perfume.name}</Text>
            </Stack>
            <Group gap="xs" wrap="nowrap">
              <SegmentedControl
                size="xs"
                data={STRENGTH_OPTIONS}
                value={String(strength)}
                onChange={(value) => onChangeStrength(perfume.id, Number(value))}
                aria-label={`Siła upodobania: ${perfume.name}`}
              />
              <CloseButton aria-label={`Usuń z wybranych: ${perfume.name}`} onClick={() => onRemove(perfume.id)} />
            </Group>
          </Group>
        </Paper>
      ))}
    </Stack>
  )
}

export default LikedList