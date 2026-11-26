import { Button, Group, Stack, Text, Title } from '@mantine/core'
import LikedList from './LikedList.jsx'
import PerfumePicker from './PerfumePicker.jsx'
import { MAX_LIKED, MIN_LIKED } from './rules.js'
import StickyBar from './StickyBar.jsx'

function LikedStep({ liked, dislikedIds, onAdd, onChangeStrength, onRemove, onNext }) {
  const isFull = liked.length >= MAX_LIKED
  const canContinue = liked.length >= MIN_LIKED

  return (
    <Stack gap="md">
      <Text c="dimmed">
        Wybierz co najmniej {MIN_LIKED} perfumy, które znasz i lubisz, a potem wskaż, jak mocno je lubisz. Nie wiesz, od
        czego zacząć? Zacznij od popularnych poniżej.
      </Text>

      {liked.length > 0 && (
        <Stack gap="xs">
          <Title order={4}>Twoje Lubiane</Title>
          <LikedList items={liked} onChangeStrength={onChangeStrength} onRemove={onRemove} />
          {isFull && (
            <Text size="sm" c="dimmed">
              Osiągnięto limit {MAX_LIKED} perfum. Aby dodać kolejne, usuń któreś z wybranych.
            </Text>
          )}
        </Stack>
      )}

      <PerfumePicker
        selectedIds={liked.map((item) => item.perfume.id)}
        blockedIds={dislikedIds}
        blockedLabel="Jest w Nielubianych"
        onAdd={onAdd}
        addDisabled={isFull}
      />

      <StickyBar>
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm">
            {canContinue
              ? `Wybrano ${liked.length}. Możesz dodać więcej albo przejść dalej.`
              : `Wybrano ${liked.length} z minimum ${MIN_LIKED}`}
          </Text>
          <Button disabled={!canContinue} onClick={onNext}>
            Dalej
          </Button>
        </Group>
      </StickyBar>
    </Stack>
  )
}

export default LikedStep