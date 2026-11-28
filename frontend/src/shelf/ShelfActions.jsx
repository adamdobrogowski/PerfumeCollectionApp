import { useState } from 'react'
import { Alert, Button, Group, Menu, Skeleton, Stack, Text } from '@mantine/core'
import BlindBuyModal from '../blindbuy/BlindBuyModal.jsx'
import ConfirmModal from '../shared/ConfirmModal.jsx'
import { useConfirmation } from '../shared/useConfirmation.js'
import LikeLevelMenu from './LikeLevelMenu.jsx'
import { REMOVE_CONFIRMATIONS, getDislikeConfirmation } from './shelfConfirmations.js'
import {
  DEFAULT_LIKE_STRENGTH,
  isWishlistBlocked,
  toState,
  withDisliked,
  withLiked,
  withPlacement,
  withoutOpinion,
  withoutPlacement,
} from './shelfState.js'
import { useSaveShelfEntry } from './useSaveShelfEntry.js'
import { useShelfEntry } from './useShelfEntry.js'

const PLACEMENT_LABELS = { collection: 'W kolekcji', wishlist: 'Lista życzeń' }

function ShelfActions({ perfumeId }) {
  const { data, isPending, isError, error, refetch } = useShelfEntry(perfumeId)
  const save = useSaveShelfEntry(perfumeId)
  const { ask, modalProps } = useConfirmation()
  const [blindBuyOpened, setBlindBuyOpened] = useState(false)

  if (isPending) {
    return <Skeleton height={36} width={360} radius="md" />
  }
  if (isError) {
    return (
      <Alert color="red" title="Nie udało się pobrać stanu półki">
        <Stack gap="xs" align="flex-start">
          <Text size="sm">{error.message}</Text>
          <Button variant="default" size="xs" onClick={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </Stack>
      </Alert>
    )
  }

  const state = toState(data.entry)
  const busy = save.isPending
  const isLiked = state.opinion === 'liked'
  const isDisliked = state.opinion === 'disliked'
  const wishlistBlocked = isWishlistBlocked(state)

  function selectPlacement(placement) {
    if (state.placement === placement) {
      return
    }
    if (placement === 'wishlist') {
      setBlindBuyOpened(true)
      return
    }
    save.mutate(withPlacement(state, placement))
  }

  function confirmWishlist() {
    save.mutate(withPlacement(state, 'wishlist'), { onSuccess: () => setBlindBuyOpened(false) })
  }

  function handleDislikedClick() {
    if (isDisliked) {
      ask(REMOVE_CONFIRMATIONS.disliked, () => save.mutate(withoutOpinion(state)))
      return
    }

    const confirmation = getDislikeConfirmation(state)
    if (confirmation) {
      ask(confirmation, () => save.mutate(withDisliked(state)))
    } else {
      save.mutate(withDisliked(state))
    }
  }

  return (
    <>
      <Group gap="xs">
        <Menu position="bottom-start" width={250}>
          <Menu.Target>
            <Button variant={state.placement ? 'light' : 'default'} size="sm" disabled={busy}>
              {state.placement ? `✓ ${PLACEMENT_LABELS[state.placement]}` : '+ Dodaj do półki'} ▾
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            {Object.entries(PLACEMENT_LABELS).map(([placement, label]) => (
              <Menu.Item
                key={placement}
                disabled={placement === 'wishlist' && wishlistBlocked}
                rightSection={state.placement === placement ? '✓' : null}
                onClick={() => selectPlacement(placement)}
              >
                {label}
              </Menu.Item>
            ))}
            {wishlistBlocked && <Menu.Label>Nielubianych perfum nie można dodać do listy życzeń.</Menu.Label>}
            {state.placement && (
              <>
                <Menu.Divider />
                <Menu.Item
                  onClick={() => ask(REMOVE_CONFIRMATIONS[state.placement], () => save.mutate(withoutPlacement(state)))}
                >
                  Zdejmij z półki
                </Menu.Item>
              </>
            )}
          </Menu.Dropdown>
        </Menu>

        {isLiked ? (
          <LikeLevelMenu
            strength={state.likeStrength}
            disabled={busy}
            onSelect={(strength) => save.mutate(withLiked(state, strength))}
            onRemove={() => ask(REMOVE_CONFIRMATIONS.liked, () => save.mutate(withoutOpinion(state)))}
          />
        ) : (
          <Button
            variant="default"
            size="sm"
            disabled={busy}
            onClick={() => save.mutate(withLiked(state, DEFAULT_LIKE_STRENGTH))}
          >
            Lubię
          </Button>
        )}

        <Button
          variant={isDisliked ? 'light' : 'default'}
          color={isDisliked ? 'red' : undefined}
          size="sm"
          disabled={busy}
          onClick={handleDislikedClick}
        >
          Nie lubię
        </Button>
      </Group>
      <ConfirmModal {...modalProps} />
      <BlindBuyModal
        opened={blindBuyOpened}
        onClose={() => setBlindBuyOpened(false)}
        onConfirm={confirmWishlist}
        perfumeId={perfumeId}
        isSaving={save.isPending}
      />
    </>
  )
}

export default ShelfActions