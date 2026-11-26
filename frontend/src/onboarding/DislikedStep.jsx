import { Button, Group, Stack, Text, Title } from '@mantine/core'
import DislikedList from './DislikedList.jsx'
import PerfumePicker from './PerfumePicker.jsx'
import { MAX_DISLIKED, MIN_DISLIKED } from './rules.js'
import StickyBar from './StickyBar.jsx'

function DislikedStep({ disliked, likedIds, onAdd, onRemove, onBack, onNext }) {
  const isFull = disliked.length >= MAX_DISLIKED
  const canContinue = disliked.length >= MIN_DISLIKED

  return (
    <Stack gap="md">
      <Text c="dimmed">
        Wybierz przynajmniej jedne perfumy, których nie lubisz. Dzięki temu ostrzeżemy Cię przed zakupem podobnych
        zapachów.
      </Text>

      {disliked.length > 0 && (
        <Stack gap="xs">
          <Title order={4}>Twoje Nielubiane</Title>
          <DislikedList perfumes={disliked} onRemove={onRemove} />
          {isFull && (
            <Text size="sm" c="dimmed">
              Osiągnięto limit {MAX_DISLIKED} perfum. Aby dodać kolejne, usuń któreś z wybranych.
            </Text>
          )}
        </Stack>
      )}

      <PerfumePicker
        selectedIds={disliked.map((perfume) => perfume.id)}
        blockedIds={likedIds}
        blockedLabel="Jest w Lubianych"
        onAdd={onAdd}
        addDisabled={isFull}
      />

      <StickyBar>
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm">
            {canContinue ? `Wybrano ${disliked.length}.` : `Wybrano ${disliked.length} z minimum ${MIN_DISLIKED}`}
          </Text>
          <Group gap="xs" wrap="nowrap">
            <Button variant="default" onClick={onBack}>
              Wstecz
            </Button>
            <Button disabled={!canContinue} onClick={onNext}>
              Dalej
            </Button>
          </Group>
        </Group>
      </StickyBar>
    </Stack>
  )
}

export default DislikedStep