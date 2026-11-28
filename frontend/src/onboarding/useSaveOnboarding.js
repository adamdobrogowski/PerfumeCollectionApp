import { useMutation, useQueryClient } from '@tanstack/react-query'
import { saveOnboarding } from '../api/onboarding.js'
import { CURRENT_USER_KEY } from '../auth/useCurrentUser.js'
import { prefetchDiscover } from '../discover/useDiscover.js'

export function useSaveOnboarding() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ liked, disliked }) => saveOnboarding(liked, disliked),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shelf'] })
      queryClient.setQueryData(CURRENT_USER_KEY, (user) => (user ? { ...user, onboardingCompleted: true } : user))
      prefetchDiscover(queryClient)
    },
    onError: (error) => {
      if (error.status === 409) {
        queryClient.invalidateQueries({ queryKey: CURRENT_USER_KEY })
      }
    },
  })
}