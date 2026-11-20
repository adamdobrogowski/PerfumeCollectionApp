import { useState } from 'react'

export function useConfirmation() {
  const [opened, setOpened] = useState(false)
  const [content, setContent] = useState(null)

  function close() {
    setOpened(false)
  }

  function ask(confirmation, onConfirm) {
    setContent({ ...confirmation, onConfirm })
    setOpened(true)
  }

  function handleConfirm() {
    content?.onConfirm()
    close()
  }

  return {
    ask,
    modalProps: {
      opened,
      onClose: close,
      onConfirm: handleConfirm,
      title: content?.title,
      message: content?.message,
      confirmLabel: content?.confirmLabel,
    },
  }
}