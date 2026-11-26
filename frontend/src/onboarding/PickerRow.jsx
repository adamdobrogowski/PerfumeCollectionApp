import { Badge, Button, Group, Paper, Stack, Text } from '@mantine/core'
import AccordBadge from '../shared/perfume/AccordBadge.jsx'
import { GENDER_LABELS, capitalizeFirst } from '../shared/perfume/labels.js'
import PerfumeCover from '../shared/perfume/PerfumeCover.jsx'

function PickerRow({ perfume, isSelected, disabled = false, onAdd }) {
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
        <Button variant={isSelected ? 'default' : 'light'} disabled={isSelected || disabled} onClick={onAdd}>
          {isSelected ? 'Dodano ✓' : 'Dodaj'}
        </Button>
      </Group>
    </Paper>
  )
}

export default PickerRow