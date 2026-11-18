import { Box, Stack, Text, Tooltip } from '@mantine/core'
import { Link } from 'react-router'
import { getAccordStyle } from './accordColors.js'
import classes from './AccordBars.module.css'
import { getDisplayName } from './names.js'

const MIN_BAR_WIDTH = 45

function AccordBars({ accords }) {
  if (accords.length === 0) {
    return (
      <Text size="sm" c="dimmed">
        Brak danych o akordach dla tych perfum.
      </Text>
    )
  }

  const sorted = [...accords].sort((a, b) => a.rank - b.rank)
  const step = sorted.length > 1 ? (100 - MIN_BAR_WIDTH) / (sorted.length - 1) : 0

  return (
    <Stack gap={6}>
      {sorted.map((accord, index) => {
        const { main, other } = getDisplayName(accord)
        return (
          <Tooltip
            key={accord.id}
            label={`Pokaż w katalogu perfumy z akordem „${main}”`}
            openDelay={300}
            position="top-start"
            withArrow
          >
            <Box
              component={Link}
              to={`/catalog?accords=${accord.id}`}
              className={classes.bar}
              style={{ ...getAccordStyle(accord.name), width: `${100 - index * step}%` }}
            >
              <span className={classes.name}>{main}</span>
              {other && <span className={classes.other}>{other}</span>}
            </Box>
          </Tooltip>
        )
      })}
    </Stack>
  )
}

export default AccordBars