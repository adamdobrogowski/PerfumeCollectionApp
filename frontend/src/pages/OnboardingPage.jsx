import { useState } from 'react'
import { Container, Stack, Text, Title } from '@mantine/core'
import PerfumePicker from '../onboarding/PerfumePicker.jsx'

function OnboardingPage() {
  const [liked, setLiked] = useState([])

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Title order={2}>Zacznijmy od Twojego gustu</Title>
        <Text c="dimmed">
          Wybierz co najmniej 3 perfumy, które znasz i lubisz. Nie wiesz, od czego zacząć? Zacznij od popularnych poniżej.
        </Text>
        <Text size="sm">
          Dodane ({liked.length}): {liked.map((perfume) => `${perfume.brand.name} ${perfume.name}`).join(', ')}
        </Text>
        <PerfumePicker
          selectedIds={liked.map((perfume) => perfume.id)}
          onAdd={(perfume) => setLiked((previous) => [...previous, perfume])}
        />
      </Stack>
    </Container>
  )
}

export default OnboardingPage