import { Paper } from '@mantine/core'

function StickyBar({ children }) {
  return (
    <Paper withBorder p="sm" radius="md" style={{ position: 'sticky', bottom: 0, zIndex: 10 }}>
      {children}
    </Paper>
  )
}

export default StickyBar