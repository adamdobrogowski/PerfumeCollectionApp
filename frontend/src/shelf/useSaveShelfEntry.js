import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { saveShelfEntry } from '../api/shelf.js'
import { shelfListKey } from './useShelf.js'
import { shelfEntryKey } from './useShelfEntry.js'

export function useSaveShelfEntry(perfumeId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (state) => saveShelfEntry(perfumeId, state),
    onSuccess: (data) => {
      queryClient.setQueryData(shelfEntryKey(perfumeId), data)
      queryClient.invalidateQueries({ queryKey: shelfListKey })
    },
    onError: (error) =>
      notifications.show({ color: 'red', title: 'Nie udało się zapisać zmiany', message: error.message }),
  })
}