import { Group, Select, Text } from '@mantine/core'
import { SORT_LABELS } from './sorting.js'

function SortSelect({ value, hasPhrase, onChange }) {
  const options = Object.entries(SORT_LABELS)
    .filter(([key]) => key !== 'relevance' || hasPhrase)
    .map(([key, label]) => ({ value: key, label }))

  return (
    <Group gap="xs" wrap="nowrap">
      <Text size="sm" c="dimmed">
        Sortuj według:
      </Text>
      <Select
        aria-label="Sortuj według"
        size="xs"
        w={160}
        data={options}
        value={value}
        onChange={(next) => next !== null && onChange(next)}
        allowDeselect={false}
      />
    </Group>
  )
}

export default SortSelect