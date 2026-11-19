import { Alert, Button, Container, Group, SegmentedControl, Skeleton, Stack, Text, Title } from '@mantine/core'
import { Link, useSearchParams } from 'react-router'
import ShelfRow from '../shelf/ShelfRow.jsx'
import { SHELF_VIEWS, selectSectionItems } from '../shelf/shelfViews.js'
import { useShelf } from '../shelf/useShelf.js'

const DEFAULT_VIEW = 'organization'
const VIEW_OPTIONS = Object.entries(SHELF_VIEWS).map(([value, view]) => ({ value, label: view.label }))

function ShelfPage() {
  const [params, setParams] = useSearchParams()
  const requestedView = params.get('view')
  const viewId = Object.hasOwn(SHELF_VIEWS, requestedView) ? requestedView : DEFAULT_VIEW
  const { data, isPending, isError, error, refetch } = useShelf()

  function handleViewChange(value) {
    setParams(value === DEFAULT_VIEW ? {} : { view: value }, { replace: true })
  }

  let content
  if (isError) {
    content = (
      <Alert color="red" title="Nie udało się pobrać półki">
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
      <Stack gap="sm">
        <Skeleton height={84} radius="md" />
        <Skeleton height={84} radius="md" />
        <Skeleton height={84} radius="md" />
      </Stack>
    )
  } else if (data.items.length === 0) {
    content = (
      <Stack gap="xs" align="flex-start">
        <Text fw={500}>Twoja półka jest pusta</Text>
        <Text size="sm" c="dimmed">
          Oznacz perfumy na ich kartach w katalogu, a pojawią się tutaj.
        </Text>
        <Button component={Link} to="/catalog" variant="light">
          Przejrzyj katalog
        </Button>
      </Stack>
    )
  } else {
    content = (
      <Stack gap="lg">
        <SegmentedControl value={viewId} onChange={handleViewChange} data={VIEW_OPTIONS} w="fit-content" />
        {SHELF_VIEWS[viewId].sections.map((section) => {
          const items = selectSectionItems(data.items, section)
          return (
            <Stack key={section.id} gap="sm">
              <Text fw={500}>
                {section.title} ({items.length})
              </Text>
              {items.length === 0 ? (
                <Text size="sm" c="dimmed">
                  {section.empty}
                </Text>
              ) : (
                items.map((item) => <ShelfRow key={item.perfume.id} item={item} sectionId={section.id} />)
              )}
            </Stack>
          )
        })}
      </Stack>
    )
  }

  return (
    <Container size="md" py="xl">
      <Stack gap="md">
        <Group>
          <Title order={2}>Twoja półka</Title>
        </Group>
        {content}
      </Stack>
    </Container>
  )
}

export default ShelfPage