import { useEffect } from 'react'
import {
  Alert,
  Anchor,
  Breadcrumbs,
  Button,
  Container,
  Group,
  SimpleGrid,
  Skeleton,
  Stack,
  Text,
  Title,
} from '@mantine/core'
import { Link, useLocation, useNavigate, useParams } from 'react-router'
import AccordBars from '../perfume/AccordBars.jsx'
import CardSection from '../perfume/CardSection.jsx'
import { parseId } from '../catalog/filters/filters.js'
import NotesPyramid from '../perfume/NotesPyramid.jsx'
import PerfumeHeader from '../perfume/PerfumeHeader.jsx'
import { usePerfume } from '../perfume/usePerfume.js'
import ShelfActions from '../shelf/ShelfActions.jsx'

function PerfumeSkeleton() {
  return (
    <Stack gap="md">
      <Skeleton height={172} radius="md" />
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Skeleton height={220} radius="md" />
        <Skeleton height={220} radius="md" />
      </SimpleGrid>
    </Stack>
  )
}

function PerfumeContent({ perfume }) {
  const { subfamily } = perfume

  return (
    <Stack gap="md">
      <PerfumeHeader perfume={perfume} actions={<ShelfActions perfumeId={perfume.id} />} />
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <CardSection title="Akordy" hint="Od najbardziej wyczuwalnego. Długość paska pokazuje tylko kolejność.">
          <AccordBars accords={perfume.accords} />
        </CardSection>
        <CardSection title="Piramida nut" hint="Nazwa główna to nuta ogólna, obok dokładniejsze nuty.">
          <NotesPyramid notes={perfume.notes} />
        </CardSection>
      </SimpleGrid>
      <CardSection title={`O stylu zapachu: ${subfamily.name}`}>
        <Text size="sm" c={subfamily.description ? undefined : 'dimmed'}>
          {subfamily.description ?? 'Brak opisu tej podrodziny.'}
        </Text>
      </CardSection>
    </Stack>
  )
}

function PerfumePage() {
  const { id: rawId } = useParams()
  const id = parseId(rawId ?? null)
  const location = useLocation()
  const navigate = useNavigate()
  const { data, isPending, isError, error, refetch } = usePerfume(id)

  useEffect(() => {
    if (!data) {
      return undefined
    }
    const previousTitle = document.title
    document.title = `${data.name} · ${data.brand.name} | PerfumeCollection`
    return () => {
      document.title = previousTitle
    }
  }, [data])

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
    content = <PerfumeContent perfume={data} />
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group gap="sm">
          <Button variant="subtle" size="compact-sm" ml={-8} onClick={handleBack}>
            ← Wróć
          </Button>
          {data && (
            <Breadcrumbs separator="›">
              <Anchor component={Link} to="/catalog" size="sm">
                Katalog
              </Anchor>
              <Anchor component={Link} to={`/catalog?brand=${data.brand.id}`} size="sm">
                {data.brand.name}
              </Anchor>
              <Text size="sm" c="dimmed">
                {data.name}
              </Text>
            </Breadcrumbs>
          )}
        </Group>
        {content}
      </Stack>
    </Container>
  )
}

export default PerfumePage