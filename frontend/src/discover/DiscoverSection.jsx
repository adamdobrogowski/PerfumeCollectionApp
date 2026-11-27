import { useState } from 'react'
import { Anchor, Button, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'
import DiscoverCard from './DiscoverCard.jsx'

const FIRST_PORTION = 6
const NEXT_PORTION = 12

function DiscoverSection({ section }) {
  const [visible, setVisible] = useState(FIRST_PORTION)
  const shown = section.perfumes.slice(0, visible)
  const hasMore = visible < section.perfumes.length

  return (
    <Stack gap="sm">
      <Stack gap={2}>
        <Title order={3}>{section.clusterName ?? 'Twoje zapachy'}</Title>
        <Text size="sm" c="dimmed">
          Lubiane w tym obszarze: {section.likedCount}
        </Text>
        {section.confidence === 'low' && (
          <Text size="sm" c="dimmed">
            Ta sekcja opiera się na niewielu perfumach.{' '}
            <Anchor component={Link} to="/catalog" size="sm">
              Dodaj więcej Lubianych
            </Anchor>
            , żeby była trafniejsza.
          </Text>
        )}
      </Stack>

      <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
        {shown.map((perfume) => (
          <DiscoverCard key={perfume.perfumeId} perfume={perfume} />
        ))}
      </SimpleGrid>

      {hasMore && (
        <Button variant="default" onClick={() => setVisible((current) => current + NEXT_PORTION)} style={{ alignSelf: 'flex-start' }}>
          Pokaż więcej
        </Button>
      )}
    </Stack>
  )
}

export default DiscoverSection