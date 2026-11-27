import { Badge, Group, Paper, Stack, Text } from '@mantine/core'
import { Link } from 'react-router'
import { GENDER_LABELS, capitalizeFirst } from '../shared/perfume/labels.js'
import PerfumeCover from '../shared/perfume/PerfumeCover.jsx'
import classes from './DiscoverCard.module.css'

function DiscoverCard({ perfume }) {
  const details = [
    GENDER_LABELS[perfume.gender] && capitalizeFirst(GENDER_LABELS[perfume.gender]),
    perfume.releaseYear,
    perfume.family.name,
  ].filter(Boolean)

  return (
    <Paper component={Link} to={`/perfumes/${perfume.perfumeId}`} withBorder p="md" radius="md" className={classes.card}>
      <Stack gap="sm" align="flex-start">
        <PerfumeCover brandName={perfume.brand.name} familyId={perfume.family.id} width={72} height={90} />
        <Stack gap={0}>
          <Text size="xs" c="dimmed" lineClamp={1}>
            {perfume.brand.name}
          </Text>
          <Text fw={500} lineClamp={2}>
            {perfume.name}
          </Text>
        </Stack>
        <Group gap={6}>
          {details.map((detail) => (
            <Badge key={detail} variant="light" color="gray" tt="none" fw={400}>
              {detail}
            </Badge>
          ))}
        </Group>
      </Stack>
    </Paper>
  )
}

export default DiscoverCard