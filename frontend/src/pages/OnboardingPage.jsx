import { Container, Stack, Text, Title } from '@mantine/core'

function OnboardingPage() {
  return (
    <Container size="md" py="xl">
      <Stack gap="xs">
        <Title order={2}>Zacznijmy od Twojego gustu</Title>
        <Text c="dimmed">Tutaj pojawi się wybór perfum, które lubisz i których nie lubisz.</Text>
      </Stack>
    </Container>
  )
}

export default OnboardingPage