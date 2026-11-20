import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteNote } from '../api/notes.js'
import { shelfListKey } from '../shelf/useShelf.js'
import { noteKey } from './useNote.js'

export function useDeleteNote(perfumeId) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => deleteNote(perfumeId),
    onSuccess: () => {
      queryClient.setQueryData(noteKey(perfumeId), { note: null })
      queryClient.invalidateQueries({ queryKey: shelfListKey })
    },
    onError: (error) =>
      notifications.show({ color: 'red', title: 'Nie udało się usunąć notatki', message: error.message }),
  })
}