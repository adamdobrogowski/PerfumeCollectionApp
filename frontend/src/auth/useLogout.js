import { notifications } from '@mantine/notifications'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { logout } from '../api/auth.js'
import { CURRENT_USER_KEY } from './useCurrentUser.js'

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: logout,
    onSuccess: () => queryClient.setQueryData(CURRENT_USER_KEY, null),
    onError: (error) => notifications.show({ color: 'red', title: 'Błąd', message: error.message }),
  })
}