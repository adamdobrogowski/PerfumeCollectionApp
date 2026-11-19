import { Anchor, Badge, Button, Group, Paper, Stack, Text } from '@mantine/core'
import { Link } from 'react-router'
import { GENDER_LABELS, capitalizeFirst } from '../shared/perfume/labels.js'
import PerfumeCover from '../shared/perfume/PerfumeCover.jsx'
import LikeLevelMenu from './LikeLevelMenu.jsx'
import { withLiked, withoutOpinion, withoutPlacement } from './shelfState.js'
import { useSaveShelfEntry } from './useSaveShelfEntry.js'

const REMOVE_LABELS = {
  collection: 'Usuń z kolekcji',
  wishlist: 'Usuń z listy życzeń',
  disliked: 'Usuń z Nielubianych',
}

function ShelfRow({ item, sectionId }) {
  const { perfume, entry } = item
  const save = useSaveShelfEntry(perfume.id)
  const busy = save.isPending

  const details = [
    GENDER_LABELS[perfume.gender] && capitalizeFirst(GENDER_LABELS[perfume.gender]),
    perfume.releaseYear,
    perfume.family.name,
  ].filter(Boolean)

  let actions
  if (sectionId === 'liked') {
    actions = (
      <LikeLevelMenu
        strength={entry.likeStrength}
        disabled={busy}
        onSelect={(strength) => save.mutate(withLiked(entry, strength))}
        onRemove={() => save.mutate(withoutOpinion(entry))}
      />
    )
  } else {
    const remove = sectionId === 'disliked' ? withoutOpinion : withoutPlacement
    actions = (
      <Button variant="default" size="sm" disabled={busy} onClick={() => save.mutate(remove(entry))}>
        {REMOVE_LABELS[sectionId]}
      </Button>
    )
  }

  return (
    <Paper withBorder p="sm" radius="md">
      <Group wrap="nowrap" align="center" gap="md">
        <PerfumeCover brandName={perfume.brand.name} familyId={perfume.family.id} width={48} height={60} />
        <Stack gap={4} style={{ flex: 1, minWidth: 0 }}>
          <Stack gap={0}>
            <Text size="xs" c="dimmed">
              {perfume.brand.name}
            </Text>
            <Anchor component={Link} to={`/perfumes/${perfume.id}`} fw={500} c="inherit" underline="hover">
              {perfume.name}
            </Anchor>
          </Stack>
          <Group gap={6}>
            {details.map((detail) => (
              <Badge key={detail} variant="light" color="gray" tt="none" fw={400}>
                {detail}
              </Badge>
            ))}
          </Group>
        </Stack>
        <div style={{ flexShrink: 0 }}>{actions}</div>
      </Group>
    </Paper>
  )
}

export default ShelfRow