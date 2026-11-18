import { Button, createTheme } from '@mantine/core'

export const theme = createTheme({
  primaryColor: 'grape',
  defaultRadius: 'md',
  components: {
    Button: Button.extend({
      styles: { label: { overflow: 'visible' } },
    }),
  },
})