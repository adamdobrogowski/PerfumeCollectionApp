import { CloseButton, Group, Paper, Stack, Text } from '@mantine/core'

function DislikedList({ perfumes, onRemove }) {
  return (
    <Stack gap="xs">
      {perfumes.map((perfume) => (
        <Paper key={perfume.id} withBorder p="sm" radius="md">
          <Group justify="space-between" wrap="nowrap">
            <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
              <Text size="xs" c="dimmed">
                {perfume.brand.name}
              </Text>
              <Text fw={500}>{perfume.name}</Text>
            </Stack>
            <CloseButton aria-label={`Usuń z wybranych: ${perfume.name}`} onClick={() => onRemove(perfume.id)} />
          </Group>
        </Paper>
      ))}
    </Stack>
  )
}

export default DislikedList