import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { saveNote } from '../api/notes.js'
import { shelfListKey } from '../shelf/useShelf.js'
import { noteKey } from './useNote.js'

export function useSaveNote(perfumeId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (note) => saveNote(perfumeId, note),
    onSuccess: (data) => {
      queryClient.setQueryData(noteKey(perfumeId), data)
      queryClient.invalidateQueries({ queryKey: shelfListKey })
    },
    onError: (error) =>
      notifications.show({ color: 'red', title: 'Nie udało się zapisać notatki', message: error.message }),
  })
}