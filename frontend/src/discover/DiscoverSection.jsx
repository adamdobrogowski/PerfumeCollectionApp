import { Fragment, useState } from 'react'
import { Anchor, Button, Group, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { Link } from 'react-router'
import DiscoverCard from './DiscoverCard.jsx'
import { SECTION_SCROLL_OFFSET, scrollToSection } from './sections.js'

const FIRST_PORTION = 6
const NEXT_PORTION = 12

function DiscoverSection({ section, anchorId }) {
  const [visible, setVisible] = useState(FIRST_PORTION)
  const shown = section.perfumes.slice(0, visible)
  const hasMore = visible < section.perfumes.length
  const canCollapse = shown.length > FIRST_PORTION
  const basedOn = section.basedOn ?? []
  const otherLikedCount = section.likedCount - basedOn.length

  function handleCollapse() {
    setVisible(FIRST_PORTION)
    scrollToSection(anchorId)
  }

  return (
    <Stack gap="sm" id={anchorId} style={{ scrollMarginTop: SECTION_SCROLL_OFFSET }}>
      <Stack gap={2}>
        <Title order={3}>{section.clusterName ?? 'Twoje zapachy'}</Title>
        {basedOn.length > 0 ? (
          <Text size="sm" c="dimmed">
            Bo lubisz:{' '}
            {basedOn.map((liked, index) => (
              <Fragment key={liked.perfumeId}>
                {index > 0 && ', '}
                <Anchor component={Link} to={`/perfumes/${liked.perfumeId}`} size="sm" c="dimmed" underline="hover">
                  {liked.brand.name} {liked.name}
                </Anchor>
              </Fragment>
            ))}
            {otherLikedCount > 0 && ` (+${otherLikedCount})`}
          </Text>
        ) : (
          <Text size="sm" c="dimmed">
            Lubiane w tym obszarze: {section.likedCount}
          </Text>
        )}
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

      {(hasMore || canCollapse) && (
        <Group gap="xs">
          {hasMore && (
            <Button variant="default" onClick={() => setVisible((current) => current + NEXT_PORTION)}>
              Pokaż więcej
            </Button>
          )}
          {canCollapse && (
            <Button variant="subtle" color="gray" onClick={handleCollapse}>
              Pokaż mniej
            </Button>
          )}
        </Group>
      )}
    </Stack>
  )
}

export default DiscoverSection