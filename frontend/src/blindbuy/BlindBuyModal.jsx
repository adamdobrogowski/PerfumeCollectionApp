import { Alert, Button, Group, Modal, Skeleton, Stack, Text } from '@mantine/core'
import { formatPerfume, getBlindBuyView, getConfidenceNote } from './blindBuyTexts.js'
import { useBlindBuyCheck } from './useBlindBuyCheck.js'

function CheckResult({ check }) {
  const view = getBlindBuyView(check)
  const confidenceNote = getConfidenceNote(check.confidence)

  return (
    <Stack gap="sm">
      <Alert color={view.color} title={view.title}>
        {view.message}
      </Alert>

      {confidenceNote && <Text size="sm">Pewność oceny: {confidenceNote}.</Text>}
      {check.capped && (
        <Text size="sm" c="dimmed">
          Ocena jest ostrożna: w tej rodzinie masz za mało Lubianych, żeby uznać ryzyko za małe.
        </Text>
      )}

      {check.state === 'known' && check.nearestLiked && (
        <Text size="sm">
          Najbliższa z Twoich Lubianych:{' '}
          <Text component="span" fw={600}>
            {formatPerfume(check.nearestLiked)}
          </Text>
          .
        </Text>
      )}
      {check.state !== 'already_liked' && (
        <Text size="sm" c="dimmed">
          Rodzina zapachowa: {check.family.name}, podrodzina: {check.subfamily.name}.
        </Text>
      )}

      {check.dislikeWarning.length > 0 && (
        <Alert color="orange" title="Podobne do perfum, których nie lubisz">
          {check.dislikeWarning.map(formatPerfume).join(', ')}
        </Alert>
      )}
    </Stack>
  )
}

function BlindBuyContent({ perfumeId, onClose, onConfirm, isSaving }) {
  const { data, isError, isFetching, refetch } = useBlindBuyCheck(perfumeId)
  const isChecking = data === undefined && (!isError || isFetching)

  let body
  if (isChecking) {
    body = (
      <Stack gap="xs">
        <Text size="sm" c="dimmed">
          Sprawdzamy, czy te perfumy pasują do Twojego gustu…
        </Text>
        <Skeleton height={60} radius="md" />
        <Skeleton height={16} width="70%" />
      </Stack>
    )
  } else if (data === undefined) {
    body = (
      <Alert color="red" title="Nie udało się ocenić tych perfum">
        <Stack gap="xs" align="flex-start">
          <Text size="sm">Możesz mimo to dodać je do listy życzeń.</Text>
          <Button variant="default" size="xs" onClick={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </Stack>
      </Alert>
    )
  } else {
    body = <CheckResult check={data} />
  }

  return (
    <Stack gap="md">
      {body}
      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          Anuluj
        </Button>
        <Button onClick={onConfirm} disabled={isChecking} loading={isSaving}>
          Dodaj do listy życzeń
        </Button>
      </Group>
    </Stack>
  )
}

function BlindBuyModal({ opened, onClose, onConfirm, perfumeId, isSaving }) {
  return (
    <Modal opened={opened} onClose={onClose} title="Przed dodaniem do listy życzeń" centered>
      <BlindBuyContent perfumeId={perfumeId} onClose={onClose} onConfirm={onConfirm} isSaving={isSaving} />
    </Modal>
  )
}

export default BlindBuyModal