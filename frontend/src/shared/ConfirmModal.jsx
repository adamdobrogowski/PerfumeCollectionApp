import { Button, Group, Modal, Stack, Text } from '@mantine/core'

function ConfirmModal({ opened, onClose, onConfirm, title, message, confirmLabel = 'Potwierdź', confirmColor = 'red' }) {
  return (
    <Modal opened={opened} onClose={onClose} title={title} centered>
      <Stack gap="md">
        <Text size="sm">{message}</Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Anuluj
          </Button>
          <Button color={confirmColor} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </Group>
      </Stack>
    </Modal>
  )
}

export default ConfirmModal