import { Badge, Group, Paper, Stack, Text } from '@mantine/core'
import { Link } from 'react-router'
import AccordBadge from './AccordBadge.jsx'
import { GENDER_LABELS, capitalizeFirst } from './labels.js'
import PerfumeCover from './PerfumeCover.jsx'
import classes from './PerfumeResultRow.module.css'
import Rating from './Rating.jsx'

// Jeden wynik na liście (cały wiersz to link do karty perfum): okładka, marka, nazwa, płeć, rok i rodzina
// jako plakietki, kolorowe akordy i ocena.
function PerfumeResultRow({ perfume }) {
  const details = [
    GENDER_LABELS[perfume.gender] && capitalizeFirst(GENDER_LABELS[perfume.gender]),
    perfume.releaseYear,
    perfume.family.name,
  ].filter(Boolean)

  return (
    <Paper
      component={Link}
      to={`/perfumes/${perfume.id}`}
      withBorder
      p="md"
      radius="md"
      className={classes.row}
    >
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