import { Badge, Group, Paper, Stack, Text, Title } from '@mantine/core'
import { getFamilyColors } from './familyColors.js'
import { GENDER_LABELS, capitalizeFirst } from './labels.js'
import PerfumeCover from './PerfumeCover.jsx'
import Rating from './Rating.jsx'

function PerfumeHeader({ perfume }) {
  const { background, ink } = getFamilyColors(perfume.family.id)
  const badges = [
    GENDER_LABELS[perfume.gender] && capitalizeFirst(GENDER_LABELS[perfume.gender]),
    perfume.releaseYear,
    perfume.family.name,
    perfume.subfamily.name,
  ].filter(Boolean)
  const perfumersLabel = perfume.perfumers.length === 1 ? 'Perfumiarz' : 'Perfumiarze'

  return (
    <Paper radius="md" p="lg" style={{ background, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
      <Group align="center" gap="lg">
        <PerfumeCover
          brandName={perfume.brand.name}
          familyId={perfume.family.id}
          width={140}
          height={176}
        />
        <Stack gap="xs" style={{ flex: 1, minWidth: 220 }}>
          <Text size="sm" c={ink}>
            {[perfume.brand.name, perfume.brand.country].filter(Boolean).join(' · ')}
          </Text>
          <Title order={2} c={ink}>
            {perfume.name}
          </Title>
          <Group gap={6}>
            {badges.map((badge) => (
              <Badge
                key={badge}
                tt="none"
                fw={500}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.75)', color: ink }}
              >
                {badge}
              </Badge>
            ))}
          </Group>
          <Rating sourceRating={perfume.sourceRating} large color={ink} align="flex-start" />
          {perfume.perfumers.length > 0 && (
            <Text size="sm" c={ink}>
              {perfumersLabel}: {perfume.perfumers.map((perfumer) => perfumer.name).join(', ')}
            </Text>
          )}
        </Stack>
      </Group>
    </Paper>
  )
}

export default PerfumeHeader