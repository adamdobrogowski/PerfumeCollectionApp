import { Badge } from '@mantine/core'
import { getAccordStyle } from './accordColors.js'
import { getDisplayName } from './names.js'

function AccordBadge({ accord }) {
  const { main, other } = getDisplayName(accord)

  return (
    <Badge variant="filled" tt="none" fw={500} title={other ?? undefined} style={getAccordStyle(accord.name)}>
      {main}
    </Badge>
  )
}

export default AccordBadge