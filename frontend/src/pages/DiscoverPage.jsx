import { useMemo, useState } from 'react'
import { Alert, Button, Chip, Container, Group, Input, SimpleGrid, Skeleton, Stack, Text, Title } from '@mantine/core'
import { Link, useNavigate } from 'react-router'
import DiscoverSection from '../discover/DiscoverSection.jsx'
import { getSectionAnchorId, scrollToSection } from '../discover/sections.js'
import { useDiscover } from '../discover/useDiscover.js'
import { GENDER_LABELS, capitalizeFirst } from '../shared/perfume/labels.js'

const GENDER_OPTIONS = Object.entries(GENDER_LABELS).map(([value, label]) => ({
  value,
  label: capitalizeFirst(label),
}))

function DiscoverPage() {
  const { data, isPending, isError, error, refetch, isFetching } = useDiscover()
  const navigate = useNavigate()
  const [genders, setGenders] = useState([])

  const sections = useMemo(() => {
    if (!data) {
      return []
    }
    return data.sections
      .map((section) => ({
        ...section,
        perfumes: genders.length === 0 ? section.perfumes : section.perfumes.filter((perfume) => genders.includes(perfume.gender)),
      }))
      .filter((section) => section.perfumes.length > 0)
  }, [data, genders])

  function handleSurprise() {
    const allPerfumes = sections.flatMap((section) => section.perfumes)
    const pick = allPerfumes[Math.floor(Math.random() * allPerfumes.length)]
    navigate(`/perfumes/${pick.perfumeId}`)
  }

  const hasRecommendations = !isPending && !isError && data.sections.length > 0

  let content
  if (isError) {
    content = (
      <Alert color="red" title="Nie udało się pobrać rekomendacji">
        <Stack gap="xs" align="flex-start">
          <Text size="sm">{error.message}</Text>
          <Button variant="default" size="xs" onClick={() => refetch()}>
            Spróbuj ponownie
          </Button>
        </Stack>
      </Alert>
    )
  } else if (isPending) {
    content = (
      <Stack gap="md">
        <Text c="dimmed">Przygotowujemy rekomendacje dla Ciebie…</Text>
        <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} height={200} radius="md" />
          ))}
        </SimpleGrid>
      </Stack>
    )
  } else if (data.sections.length === 0) {
    content = (
      <Stack gap="xs" align="flex-start">
        <Text fw={500}>
          {data.likedTotal === 0 ? 'Nie mamy jeszcze z czego przygotować rekomendacji' : 'Nie mamy teraz nowych propozycji'}
        </Text>
        <Text size="sm" c="dimmed">
          {data.likedTotal === 0
            ? 'Oznacz perfumy, które lubisz, a pojawią się tutaj propozycje podobnych zapachów.'
            : 'Dodaj więcej Lubianych perfum, a przygotujemy kolejne propozycje.'}
        </Text>
        <Button component={Link} to="/catalog" variant="light">
          Przejrzyj katalog
        </Button>
      </Stack>
    )
  } else {
    content = (
      <Stack gap="md">
        <Input.Wrapper label="Płeć" description="Brak zaznaczenia oznacza wszystkie">
          <Chip.Group multiple value={genders} onChange={setGenders}>
            <Group gap="xs" mt={4}>
              {GENDER_OPTIONS.map((option) => (
                <Chip key={option.value} value={option.value}>
                  {option.label}
                </Chip>
              ))}
            </Group>
          </Chip.Group>
        </Input.Wrapper>

        {sections.length > 1 && (
          <Input.Wrapper label="Twoje obszary">
            <Group gap="xs" mt={4}>
              {sections.map((section) => (
                <Button
                  key={getSectionAnchorId(section)}
                  variant="light"
                  size="compact-sm"
                  onClick={() => scrollToSection(getSectionAnchorId(section))}
                >
                  {section.clusterName ?? 'Twoje zapachy'}
                </Button>
              ))}
            </Group>
          </Input.Wrapper>
        )}

        {sections.length === 0 ? (
          <Stack gap="xs" align="flex-start">
            <Text fw={500}>Brak propozycji dla wybranej płci</Text>
            <Button variant="light" onClick={() => setGenders([])}>
              Pokaż wszystkie
            </Button>
          </Stack>
        ) : (
          <Stack gap="xl" mt="md" style={{ opacity: isFetching ? 0.6 : 1 }}>
            {sections.map((section) => (
              <DiscoverSection key={getSectionAnchorId(section)} section={section} anchorId={getSectionAnchorId(section)} />
            ))}
          </Stack>
        )}
      </Stack>
    )
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <Title order={2}>Odkrywaj</Title>
          {hasRecommendations && sections.length > 0 && (
            <Button variant="light" onClick={handleSurprise}>
              Zaskocz mnie
            </Button>
          )}
        </Group>
        {content}
      </Stack>
    </Container>
  )
}

export default DiscoverPage