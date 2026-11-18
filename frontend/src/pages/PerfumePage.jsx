import { Alert, Button, Container, Group, Skeleton, Stack, Text, Title } from '@mantine/core'
import { useLocation, useNavigate, useParams } from 'react-router'
import { parseId } from '../catalog/filters.js'
import PerfumeHeader from '../catalog/PerfumeHeader.jsx'
import { usePerfume } from '../catalog/usePerfume.js'

function PerfumeSkeleton() {
  return (
    <Group align="center" gap="lg">
      <Skeleton width={140} height={176} />
      <Stack gap="sm" style={{ flex: 1, minWidth: 220 }}>
        <Skeleton height={14} width="30%" />
        <Skeleton height={28} width="60%" />
        <Skeleton height={20} width="80%" />
      </Stack>
    </Group>
  )
}

function PerfumePage() {
  const { id: rawId } = useParams()
  const id = parseId(rawId ?? null)
  const location = useLocation()
  const navigate = useNavigate()
  const { data, isPending, isError, error, refetch } = usePerfume(id)

  function handleBack() {
    if (location.key === 'default') {
      navigate('/catalog')
    } else {
      navigate(-1)
    }
  }

  let content
  if (id === null || (isError && error.status === 404)) {
    content = <Title order={3}>Nie znaleziono perfum</Title>
  } else if (isError) {
    content = (
      <Alert color="red" title="Nie udało się pobrać karty perfum">
        <Stack gap="xs" align="flex-start">
          <Text size="sm">{error.message}</Text>
          <Button variant="default" size="xs" onClick={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </Stack>
      </Alert>
    )
  } else if (isPending) {
    content = <PerfumeSkeleton />
  } else {
    content = <PerfumeHeader perfume={data} />
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Button variant="subtle" size="xs" onClick={handleBack} style={{ alignSelf: 'flex-start' }}>
          ← Wróć
        </Button>
        {content}
      </Stack>
    </Container>
  )
}

export default PerfumePage