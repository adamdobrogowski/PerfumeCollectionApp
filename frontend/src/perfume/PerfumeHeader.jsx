import { Anchor, Badge, Group, Paper, Stack, Text, Title, Tooltip } from '@mantine/core'
import { Link } from 'react-router'
import { GENDER_LABELS, capitalizeFirst, capitalizeWords } from '../shared/perfume/labels.js'
import PerfumeCover from '../shared/perfume/PerfumeCover.jsx'
import Rating from '../shared/perfume/Rating.jsx'

function PerfumeHeader({ perfume, actions }) {
  const plainBadges = [
    GENDER_LABELS[perfume.gender] && capitalizeFirst(GENDER_LABELS[perfume.gender]),
    perfume.releaseYear,
  ].filter(Boolean)
  const perfumersLabel = perfume.perfumers.length > 1 ? 'Perfumiarze' : 'Perfumiarz'
  const perfumersText =
    perfume.perfumers.length > 0
      ? perfume.perfumers.map((perfumer) => capitalizeWords(perfumer.name)).join(', ')
      : 'brak danych'

  return (
    <Paper withBorder radius="md" p="lg">
      <Group align="center" gap="lg">
        <PerfumeCover
          brandName={perfume.brand.name}
          familyId={perfume.family.id}
          width={112}
          height={140}
        />
        <Stack gap="xs" style={{ flex: 1, minWidth: 220 }}>
          <Text size="sm" c="dimmed">
            <Tooltip label="Pokaż w katalogu perfumy tej marki" openDelay={300} withArrow>
              <Anchor
                component={Link}
                to={`/catalog?brand=${perfume.brand.id}`}
                c="dimmed"
                underline="always"
                inherit
              >
                {perfume.brand.name}
              </Anchor>
            </Tooltip>
            {perfume.brand.country && ` · ${perfume.brand.country}`}
          </Text>
          <Title order={2}>{perfume.name}</Title>
          <Group gap={6}>
            {plainBadges.map((badge) => (
              <Badge key={badge} variant="light" color="gray" tt="none" fw={400}>
                {badge}
              </Badge>
            ))}
            <Tooltip label="Pokaż w katalogu perfumy z tej rodziny" openDelay={300} withArrow>
              <Badge
                component={Link}
                to={`/catalog?family=${perfume.family.id}`}
                variant="light"
                color="gray"
                tt="none"
                fw={400}
                style={{ textDecoration: 'underline', cursor: 'pointer' }}
              >
                {perfume.family.name}
              </Badge>
            </Tooltip>
            <Badge variant="outline" color="gray" tt="none" fw={400}>
              {perfume.subfamily.name}
            </Badge>
          </Group>
          <Text size="sm" c="dimmed">
            {perfumersLabel}: {perfumersText}
          </Text>
          {actions}
        </Stack>
        <Rating sourceRating={perfume.sourceRating} large />
      </Group>
    </Paper>
  )
}

export default PerfumeHeader