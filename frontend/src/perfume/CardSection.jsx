import { Paper, Stack, Text, Title } from '@mantine/core'

function CardSection({ title, hint, children }) {
  return (
    <Paper withBorder radius="md" p="md">
      <Stack gap="sm">
        <Stack gap={0}>
          <Title order={4} size="h5">
            {title}
          </Title>
          {hint && (
            <Text size="xs" c="dimmed">
              {hint}
            </Text>
          )}
        </Stack>
        {children}
      </Stack>
    </Paper>
  )
}

export default CardSection