import { TextInput } from '@mantine/core'
import { useState } from 'react'
import { useNavigate } from 'react-router'

function HeaderSearch() {
  const [value, setValue] = useState('')
  const navigate = useNavigate()

  function handleSubmit(event) {
    event.preventDefault()
    const phrase = value.trim()
    if (phrase.length === 0) {
      return
    }
    navigate(`/catalog?q=${encodeURIComponent(phrase)}`)
  }

  return (
    <form onSubmit={handleSubmit} style={{ flex: 1, maxWidth: 400 }}>
      <TextInput
        placeholder="Szukaj perfum"
        aria-label="Szukaj perfum"
        maxLength={100}
        value={value}
        onChange={(event) => setValue(event.currentTarget.value)}
      />
    </form>
  )
}

export default HeaderSearch