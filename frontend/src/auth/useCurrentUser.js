import { useQuery } from '@tanstack/react-query'
import { fetchCurrentUser } from '../api/auth.js'

// Klucz, pod którym TanStack Query trzyma zalogowanego użytkownika w pamięci.
export const CURRENT_USER_KEY = ['currentUser']

// data: użytkownik albo null (niezalogowany), isPending: trwa pierwsze sprawdzanie sesji.
export function useCurrentUser() {
  return useQuery({
    queryKey: CURRENT_USER_KEY,
    queryFn: fetchCurrentUser,
    retry: false,
    // Przez 5 minut wynik jest uznawany za świeży i nie jest pobierany ponownie.
    staleTime: 5 * 60 * 1000,
  })
}