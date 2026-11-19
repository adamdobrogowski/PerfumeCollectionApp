import { useMemo } from 'react'
import { Button, Collapse, MultiSelect, SimpleGrid, Stack } from '@mantine/core'
import { MAX_LIST_ITEMS } from './filters.js'
import { filterOptions, toDictionaryOptions } from './options.js'

const FIELDS = [
  {
    key: 'notes',
    opposite: 'excludeNotes',
    source: 'notes',
    label: 'Zawiera nuty',
    description: 'Perfumy muszą mieć wszystkie wybrane nuty',
    placeholder: 'Wybierz nuty',
  },
  {
    key: 'excludeNotes',
    opposite: 'notes',
    source: 'notes',
    label: 'Nie zawiera nut',
    description: 'Perfumy nie mogą mieć żadnej z wybranych nut',
    placeholder: 'Wybierz nuty',
  },
  {
    key: 'accords',
    opposite: 'excludeAccords',
    source: 'accords',
    label: 'Zawiera akordy',
    description: 'Perfumy muszą mieć wszystkie wybrane akordy',
    placeholder: 'Wybierz akordy',
  },
  {
    key: 'excludeAccords',
    opposite: 'accords',
    source: 'accords',
    label: 'Nie zawiera akordów',
    description: 'Perfumy nie mogą mieć żadnego z wybranych akordów',
    placeholder: 'Wybierz akordy',
  },
]

function CatalogListFilters({ filters, notes, accords, count, open, onOpenChange, onChange }) {
  const noteOptions = useMemo(() => toDictionaryOptions(notes.data ?? []), [notes.data])
  const accordOptions = useMemo(() => toDictionaryOptions(accords.data ?? []), [accords.data])
  const dictionaries = {
    notes: { query: notes, options: noteOptions },
    accords: { query: accords, options: accordOptions },
  }

  return (
    <Stack gap="sm">
      <Button
        variant="subtle"
        size="xs"
        aria-expanded={open}
        onClick={() => onOpenChange(!open)}
        style={{ alignSelf: 'flex-start' }}
      >
        {count > 0 ? `Więcej filtrów (${count})` : 'Więcej filtrów'}
      </Button>
      <Collapse expanded={open}>
        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          {FIELDS.map((field) => {
            const { query, options } = dictionaries[field.source]
            return (
              <MultiSelect
                key={field.key}
                label={field.label}
                description={field.description}
                placeholder={query.isPending ? 'Ładowanie...' : field.placeholder}
                data={options}
                value={filters[field.key]}
                onChange={(ids) => onChange(field.key, field.opposite, ids)}
                searchable
                clearable
                hidePickedOptions
                maxValues={MAX_LIST_ITEMS}
                limit={50}
                filter={filterOptions}
                nothingFoundMessage="Nie znaleziono"
                disabled={query.isPending || query.isError}
                error={query.isError ? 'Nie udało się wczytać listy' : undefined}
              />
            )
          })}
        </SimpleGrid>
      </Collapse>
    </Stack>
  )
}

export default CatalogListFilters